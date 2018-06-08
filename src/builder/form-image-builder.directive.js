angular.module('mwFormBuilder').factory("FormImageBuilderId", function () {
  var id = 0;
  return {
    next: function () {
      return ++id;
    }
  }
})

  .directive('mwFormImageBuilder', function () {

    return {
      replace: true,
      restrict: 'AE',
      require: '^mwFormPageElementBuilder',
      scope: {
        image: '=',
        formObject: '=',
        onReady: '&',
        isPreview: '=?',
        readOnly: '=?',
        onImageSelection: '&',
        uploadUrl: '=',
      },
      templateUrl: 'mw-form-image-builder.html',
      controllerAs: 'ctrl',
      bindToController: true,
      controller: function ($timeout, FormImageBuilderId, mwFormUuid, Upload, $q) {
        var ctrl = this;
        ctrl.id = FormImageBuilderId.next();
        ctrl.formSubmitted = false;

        ctrl.save = function () {
          ctrl.formSubmitted = true;
          if (ctrl.form.$valid) {
            ctrl.onReady();
          }
        };

        ctrl.selectImageButtonClicked = function (image) {
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
                ctrl.image.src = response.data.filePath;
                //ctrl.execCommand('insertimage', response.data.filePath);
              })
              .catch(function (error) {
                //$rootScope.$broadcast(WysiwygEditorEvents.IMAGE_ERROR, error);
                return $q.reject(error);
              }));
            return $q.all(promises);
          }
          return $q.reject('no images or uploadurl defined');

        };

        ctrl.setAlign = function (align) {
          ctrl.image.align = align;
        }


      },
      link: function (scope, ele, attrs, formPageElementBuilder) {
        var ctrl = scope.ctrl;
      }
    };
  });
