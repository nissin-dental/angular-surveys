angular.module('mwFormBuilder').directive('mwQuestionOfferedAnswerListBuilder', function () {

  return {
    replace: true,
    restrict: 'AE',
    require: '^mwFormQuestionBuilder',
    scope: {
      question: '=',
      formObject: '=',
      readOnly: '=?',
      options: '=?',
      disableOtherAnswer: '=?',
      uploadUrl: '=',
    },
    templateUrl: 'mw-question-offered-answer-list-builder.html',
    controllerAs: 'ctrl',
    bindToController: true,
    controller: function (FormQuestionBuilderId, mwFormUuid, Upload, $q, $rootScope) {
      var ctrl = this;
      // Put initialization logic inside `$onInit()`
      // to make sure bindings have been initialized.
      this.$onInit = function () {
        ctrl.config = {
          radio: {},
          checkbox: {}
        };

        ctrl.hasCorrectAnswer = false;
        hasCorrectAnswer();
        ctrl.isNewAnswer = {};

        sortAnswersByOrderNo();

        ctrl.offeredAnswersSortableConfig = {
          disabled: ctrl.readOnly,
          ghostClass: "beingDragged",
          handle: ".drag-handle",
          onEnd: function (e, ui) {
            updateAnswersOrderNo();
          }
        };

        if (ctrl.question.offeredAnswers.length === 0) {
          var focus = false;
          var addAnswer = function() {
            if (ctrl.question.offeredAnswers.length < 2) {
              ctrl.addNewOfferedAnswer(focus);
              addAnswer();
            }
          };
          addAnswer();
        }
      };

      function hasCorrectAnswer () {
        ctrl.hasCorrectAnswer = _.filter(ctrl.question.offeredAnswers, {correctAnswer: true}).length > 0;
      }

      function updateAnswersOrderNo() {
        if (ctrl.question.offeredAnswers) {
          for (var i = 0; i < ctrl.question.offeredAnswers.length; i++) {

            var offeredAnswer = ctrl.question.offeredAnswers[i];

            offeredAnswer.orderNo = i + 1;
          }
        }

      }

      function sortAnswersByOrderNo() {
        if (ctrl.question.offeredAnswers) {
          ctrl.question.offeredAnswers.sort(function (a, b) {
            return a.orderNo - b.orderNo;
          });
        }
      }

      ctrl.addNewOfferedAnswer = function (focus) {
        var defaultPageFlow = ctrl.possiblePageFlow != null ? ctrl.possiblePageFlow[0] : {nextPage: true, label: "target.mwForm.pageFlow.goToNextPage"};

        var answer = {
          id: mwFormUuid.get(),
          orderNo: ctrl.question.offeredAnswers.length + 1,
          value: null,
          pageFlow: defaultPageFlow,
          explanation: '',
          correctAnswer: false,
        };
        if(focus == null || focus === true) {
          ctrl.isNewAnswer[answer.id] = true;
        }

        if (ctrl.question.offeredAnswers.length === 0) {
          answer.correctAnswer = true;
          ctrl.hasCorrectAnswer = true;
        }

        ctrl.question.offeredAnswers.push(answer);
      };

      ctrl.removeOfferedAnswer = function (answer) {
        var index = ctrl.question.offeredAnswers.indexOf(answer);
        if (index != -1) {
          ctrl.question.offeredAnswers.splice(index, 1);
          hasCorrectAnswer();
        }
      };

      ctrl.addCustomAnswer = function () {
        ctrl.question.otherAnswer = true;
      };
      ctrl.removeCustomAnswer = function () {
        ctrl.question.otherAnswer = false;
      };

      ctrl.keyPressedOnInput = function (keyEvent, answer) {
        delete ctrl.isNewAnswer[answer.id];
        if (keyEvent.which === 13) {
          keyEvent.preventDefault()
          ctrl.addNewOfferedAnswer();
        }


      };

      ctrl.updateMaxCorrectAnswers = function(answer) {
        if(ctrl.question.type === 'radio') {
          ctrl.question.offeredAnswers.forEach(function(offeredAnswer) {
            if(offeredAnswer.id == answer.id) {
              offeredAnswer.correctAnswer = true;
            } else {
              offeredAnswer.correctAnswer = false;
            }
          });
          hasCorrectAnswer();
        }
      };

      ctrl.selectImageButtonClicked = function (answer, image) {
        if (image) {
          var promises = [];
          promises.push(Upload.upload({
            url: ctrl.uploadUrl,
            method: 'POST',
            data: {
              file: image,
              maxWidth: 876,
            },
          })
            .then(function (response) {
              answer.src = response.data.filePath;
              answer.image = response.data.fileName;
            })
            .catch(function (error) {
              return $q.reject(error);
            }));
          return $q.all(promises);
        } else {
          $rootScope.$emit('validateForm');
          return $q.reject('no images or uploadurl defined');
        }
      };

      // Prior to v1.5, we need to call `$onInit()` manually.
      // (Bindings will always be pre-assigned in these versions.)
      if (angular.version.major === 1 && angular.version.minor < 5) {
        this.$onInit();
      }
    },
    link: function (scope, ele, attrs, formQuestionBuilderCtrl) {
      var ctrl = scope.ctrl;
      ctrl.possiblePageFlow = formQuestionBuilderCtrl.possiblePageFlow;
      ctrl.ignoreClose = formQuestionBuilderCtrl.ignoreClose;
    }
  };
});
