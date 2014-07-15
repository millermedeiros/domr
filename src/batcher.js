define(['exports'], function(exports) {

  // we are using a static instance to avoid unnecessary Function#bind and also
  // to avoid extra closures. less == more

  var _queue = [];
  var _willFlush = false;
  var nextTick = window.requestAnimationFrame || window.setTimeout;

  // ---

  exports.push = push;
  function push(task) {
    var shouldPush = true;
    task.pending = true;

    // we override old actions for same element (only if it wasn't executed yet)
    var item, i = -1, n = _queue.length;
    while (++i < n) {
      item = _queue[i];
      if (item.element === task.element && item.id === task.id && item.pending) {
        _queue[i] = task;
        shouldPush = false;
        break;
      }
    }

    if (shouldPush) {
      _queue.push(task);
    }

    if (!_willFlush) {
      _willFlush = true;
      nextTick(flush);
    }
  }


  exports.flush = flush;
  function flush() {
    // TODO: throttle this loop, it should not block thread for too long
    var task, i = 0;
    while ((task = _queue[i++])) {
      if (task.pending) {
        task.execute(task.arg || task);
        task.pending = false;
      }
    }
    reset();
  }


  exports.reset = reset;
  function reset() {
    _queue = [];
    _willFlush = false;
  }


  exports.cancel = cancel;
  function cancel(group) {
    var task, i = 0;
    while ((task = _queue[i++])) {
      if (task.group === group) {
        task.pending = false;
      }
    }
  }


});
