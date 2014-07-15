define(function(require) {

  var batcher = require('./batcher');
  var actions = require('./actions');

  var EMPTY_OBJECT = {};
  var EMPTY_ARRAY = [];

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
    if (this._destroyed) {
      return;
    }

    batcher.cancel(this);

    // we do not `delete` the properties (or set it to null) to avoid JIT
    // deoptimization; so we reset the values to same "type".
    this._root = document.documentElement;
    this._elements = EMPTY_OBJECT;
    this._config = EMPTY_OBJECT;
    this._data = EMPTY_OBJECT;
    this._props = EMPTY_ARRAY;
    this._destroyed = true;
  };


  Binding.prototype._destroyed = false;


  Binding.prototype.render = function(data, callback) {
    if (!data || this._destroyed) {
      return;
    }

    // we are not using forEach on pupose (micro-optimization)
    var prop,
      i = 0;
    while ((prop = this._props[i++])) {
      var value = get(data, prop);
      var oldValue = this._data[prop];
      // undefined, null and NaN are converted to empty string
      value = (value == null || value !== value) ? '' : value.toString();

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
        group: this,
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
    task.group = this;
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
