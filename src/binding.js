define(function(require) {

  var batcher = require('./batcher');
  var actions = require('./actions');

  // ---

  function Binding(el, config) {
    this._root = el;
    // store elements reference based on selector
    this._elements = {
      '@': el
    };
    // "bindings" config
    this._config = config;
    // cache old data to compare it later
    this._data = {};
    // cache the properties that we care about to speed up process
    this._props = Object.keys(config);
  }


  Binding.prototype.destroy = function() {
    delete this._root;
    delete this._elements;
    delete this._config;
    delete this._data;
    delete this._props;
  };


  Binding.prototype.render = function(data, callback) {
    if (!data) {
      return;
    }

    // we are not using forEach on pupose (micro-optimization)
    var prop,
      i = 0;
    while ((prop = this._props[i++])) {
      var value = get(data, prop);
      var oldValue = this._data[prop];

      if (value === oldValue) {
        continue;
      }

      this._data[prop] = value;

      var config = this._config[prop];

      if (typeof config === 'string') {
        config = {
          selector: config,
          type: 'text'
        };
      }

      if (Array.isArray(config)) {
        // we are not using forEach on pupose (micro-optimization)
        var conf, k = 0;
        while ((conf = config[k++])) {
          this._process(prop, conf, value, oldValue);
        }
      } else {
        this._process(prop, config, value, oldValue);
      }
    }

    if (callback) {
      batcher.push({
        element: this._root,
        id: 'callback',
        execute: callback,
        arg: this._root
      });
    }
  };


  function get(obj, prop) {
    var parts = prop.split('.');
    var last = parts.pop();

    while ((prop = parts.shift())) {
      obj = obj[prop];
      if (typeof obj !== 'object' || !obj) return;
    }

    return obj[last];
  }


  Binding.prototype._process = function(prop, config, value, oldValue) {
    // undefined, null and NaN are converted to empty string
    value = (value == null || value !== value) ? '' : value.toString();

    var selector = config.selector;
    if (!selector && config.role) {
      selector = '[role="' + config.role + '"]';
    }
    var el = this._elements[selector] = (
      this._elements[selector] || this._root.querySelector(selector)
    );

    if (!el) {
      throw new Error(
      'can\'t find element with selector "' + selector + '" inside ' +
        this._root.outerHTML
      );
    }

    var type = config.type || 'text';
    var getTask = actions[type];

    if (!getTask) {
      throw new Error('invalid [type]: "' + type + '"');
    }

    var task = getTask(config);
    task.element = el;
    task.config = config;
    task.value = value;
    task.oldValue = oldValue;
    task.property = prop;

    batcher.push(task);
  };


  // ---

  return Binding;

});
