define(function(require, exports) {

  var Binding = require('./binding');

  exports.create = function(el, config) {
    return new Binding(el, config);
  };

});
