define(['exports'], function(exports) {

  function isTruthyValue(value) {
    // JSWTF: value is always a string and `"false" == true`
    return value !== 'false' && value;
  }

  function getBooleanName(task) {
    var config = task.config;
    return config.name || config.yes || task.property.split('.').pop();
  }

  // ---

  exports.text = exports.textContent = function(config) {
    return {
      id: 'text',
      execute: text
    };
  };

  function text(task) {
    task.element.textContent = task.value;
  }

  // ---

  exports.attribute = exports.attr = function(config) {
    return {
      id: 'attr-' + config.name,
      execute: attr
    };
  };

  function attr(task) {
    task.element.setAttribute(task.config.name, task.value);
  }

  // ---

  exports.toggleAttribute = exports.toggleAttr = exports.booleanAttribute = function(config) {
    return {
      id: 'toggle-attr-' + config.name,
      execute: toggleAttr
    };
  };

  function toggleAttr(task) {
    var el = task.element;
    var truthyName = getBooleanName(task);
    var falsyName = task.config.no;

    if (isTruthyValue(task.value)) {
      if (falsyName) el.removeAttribute(falsyName);
      el.setAttribute(truthyName, '');
      return;
    }

    el.removeAttribute(truthyName);
    if (falsyName) el.setAttribute(falsyName, '');
  }

  // ---

  exports.html = exports.innerHTML = function(config) {
    return {
      id: 'html',
      execute: innerHTML
    };
  };

  function innerHTML(task) {
    task.element.innerHTML = task.value;
  }

  // ---

  exports.class = exports.className = function(config) {
    return {
      id: 'class',
      execute: className
    };
  };

  function className(task) {
    var el = task.element;
    execClasses(el, 'remove', task.oldValue);
    execClasses(el, 'add', task.value);
  }

  // ---

  var multiClasses = /\s+/g;

  function execClasses(el, methodName, value) {
    if (!value) return;

    var classList = el.classList;

    if (multiClasses.test(value)) {
      var classes = value.split(multiClasses);
      classList[methodName].apply(classList, classes);
    } else {
      classList[methodName](value);
    }
  }

  // ---

  exports.toggleClass = exports.booleanClass = function(config) {
    return {
      id: 'toogleClass',
      execute: toggleClass
    };
  };

  function toggleClass(task) {
    var el = task.element;
    var truthyName = getBooleanName(task);
    var falsyName = task.config.no;

    var toAdd, toRemove;

    if (isTruthyValue(task.value)) {
      toRemove = falsyName;
      toAdd = truthyName;
    } else {
      toRemove = truthyName;
      toAdd = falsyName;
    }

    execClasses(el, 'remove', toRemove);
    execClasses(el, 'add', toAdd);
  }

});
