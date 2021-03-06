angular.module('mwFormViewer').factory("FormQuestionId", function () {
  var id = 0;
  return {
    next: function () {
      return ++id;
    }
  }
})

  .directive('mwFormQuestion', function () {

    return {
      replace: true,
      restrict: 'AE',
      require: '^mwFormViewer',
      scope: {
        question: '=',
        questionResponse: '=',
        readOnly: '=?',
        options: '=?',
        onResponseChanged: '&?'
      },
      templateUrl: 'mw-form-question.html',
      controllerAs: 'ctrl',
      bindToController: true,
      controller: function ($timeout, FormQuestionId, _, IScrollEvents, $rootScope) {
        var ctrl = this;
        ctrl.explanations = [];
        // Put initialization logic inside `$onInit()`
        // to make sure bindings have been initialized.
        this.$onInit = function () {
          ctrl.validated = false;
          ctrl.id = FormQuestionId.next();
          if (ctrl.question.type == 'radio') {
            if (!ctrl.questionResponse.selectedAnswer) {
              ctrl.questionResponse.selectedAnswer = null;
            } else {
              ctrl.updateExplanation(_.find(ctrl.question.offeredAnswers, {id: ctrl.questionResponse.selectedAnswer}));
            }
            if (ctrl.questionResponse.other) {
              ctrl.isOtherAnswer = true;
            }

          } else if (ctrl.question.type == 'checkbox') {
            if (ctrl.questionResponse.selectedAnswers && ctrl.questionResponse.selectedAnswers.length) {
              ctrl.selectedAnswer = true;
              ctrl.questionResponse.selectedAnswers.forEach(function (answer) {
                ctrl.updateExplanation({id: answer});
              })
            } else {
              ctrl.questionResponse.selectedAnswers = [];
            }
            if (ctrl.questionResponse.other) {
              ctrl.isOtherAnswer = true;
            }


          } else if (ctrl.question.type == 'grid') {
            if (!ctrl.question.grid.cellInputType) {
              ctrl.question.grid.cellInputType = "radio";
            }
            //if(ctrl.questionResponse.selectedAnswers){
            //
            //}else{
            //    ctrl.questionResponse.selectedAnswers={};
            //}
          } else if (ctrl.question.type == 'division') {

            ctrl.computeDivisionSum = function () {
              ctrl.divisionSum = 0;
              ctrl.question.divisionList.forEach(function (item) {

                if (ctrl.questionResponse[item.id] != 0 && !ctrl.questionResponse[item.id]) {
                  ctrl.questionResponse[item.id] = null;
                  ctrl.divisionSum += 0;
                } else {
                  ctrl.divisionSum += ctrl.questionResponse[item.id];
                }
              });
            };

            ctrl.computeDivisionSum();


          } else if (ctrl.question.type == 'date' || ctrl.question.type == 'datetime' || ctrl.question.type == 'time') {
            if (ctrl.questionResponse.answer) {
              ctrl.questionResponse.answer = new Date(ctrl.questionResponse.answer)
            }
          }

          ctrl.isAnswerSelected = false;
          ctrl.initialized = true;
        };

        ctrl.validateQuestion = function() {
          ctrl.validated = true;
          switch (ctrl.question.type) {
            case 'radio':
              var selectedAnswer = _.find(ctrl.question.offeredAnswers, {id: ctrl.questionResponse.selectedAnswer});
              ctrl.allAnswersCorrect = selectedAnswer != null && selectedAnswer.correctAnswer;
              break;
            case 'checkbox':
              var correctAnswerIds = _.map(_.filter(ctrl.question.offeredAnswers, function (answer) {
                return answer.correctAnswer === true
              }), 'id');
              var givenAnswerIds = ctrl.questionResponse.selectedAnswers;
              ctrl.allAnswersCorrect = _.isEqual(correctAnswerIds.sort(), givenAnswerIds.sort());
              break;
          }
        };

        ctrl.selectedAnswerChanged = function () {
          delete ctrl.questionResponse.other;
          ctrl.explanations = [];
          ctrl.isOtherAnswer = false;
          ctrl.answerChanged();

        };
        ctrl.otherAnswerRadioChanged = function () {
          if (ctrl.isOtherAnswer) {
            ctrl.questionResponse.selectedAnswer = null;
          }
          ctrl.answerChanged();
        };

        ctrl.otherAnswerCheckboxChanged = function () {
          if (!ctrl.isOtherAnswer) {
            delete ctrl.questionResponse.other;
          }
          ctrl.selectedAnswer = ctrl.questionResponse.selectedAnswers.length || ctrl.isOtherAnswer ? true : null;
          ctrl.answerChanged();
        };


        ctrl.toggleSelectedAnswer = function (answer) {
          if (ctrl.questionResponse.selectedAnswers.indexOf(answer.id) === -1) {
            ctrl.questionResponse.selectedAnswers.push(answer.id);
            ctrl.explanations[answer.id] = true;
          } else {
            ctrl.questionResponse.selectedAnswers.splice(ctrl.questionResponse.selectedAnswers.indexOf(answer.id), 1);
            ctrl.explanations[answer.id] = false;
          }
          ctrl.selectedAnswer = ctrl.questionResponse.selectedAnswers.length || ctrl.isOtherAnswer ? true : null;
          $rootScope.$emit(IScrollEvents.REFRESH);

          ctrl.answerChanged();
        };

        ctrl.answerChanged = function () {
          if (ctrl.onResponseChanged) {
            ctrl.onResponseChanged();
          }
          ctrl.validated = false;
        };

        ctrl.updateExplanation = function (answer) {
          if (answer != null) {
            ctrl.explanations[answer.id] = !ctrl.explanations[answer.id];
            $rootScope.$emit(IScrollEvents.REFRESH);
          }
        };

        // Prior to v1.5, we need to call `$onInit()` manually.
        // (Bindings will always be pre-assigned in these versions.)
        if (angular.version.major === 1 && angular.version.minor < 5) {
          this.$onInit();
        }

      },
      link: function (scope, ele, attrs, mwFormViewer) {
        var ctrl = scope.ctrl;
        ctrl.print = mwFormViewer.print;
      }
    };
  });
