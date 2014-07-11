define(['src/batcher'], function(batcher) {

  var nextTick = window.requestAnimationFrame || window.setTimeout;


  describe('batcher', function () {

    var subject;
    var counterFoo;
    var counterBar;
    var argsFoo;
    var argsBar;


    beforeEach(function() {
      // we use the naive counter instead of a spy because we only care about
      // how many times it was called
      counterFoo = 0;
      counterBar = 0;
      argsFoo = [];
      argsBar = [];

      subject = {
        foo: function() {
          counterFoo += 1;
          argsFoo.push.apply(argsFoo, arguments);
        },
        bar: function() {
          counterBar += 1;
          argsBar.push.apply(argsBar, arguments);
        }
      };
    });


    // ----


    describe('push', function () {

      it('should call method after rAF', function (done) {
        var task1 = {
          property: 'sit.dolor',
          element: subject,
          id: 'foo',
          execute: subject.foo,
          config: {},
          value: 'lorem ipsum'
        };
        var task2 = {
          property: 'amet',
          element: subject,
          id: 'bar',
          execute: subject.bar,
          config: {},
          value: 'dolor amet'
        };

        batcher.push(task1);
        batcher.push(task2);

        expect(counterFoo).toBe(0);
        expect(counterBar).toBe(0);

        nextTick(function() {
          expect(counterFoo).toBe(1);
          expect(counterBar).toBe(1);
          expect(argsFoo).toEqual([task1]);
          expect(argsBar).toEqual([task2]);
          done();
        });
      });


      it('should override method if same ID and same object', function (done) {
        batcher.push({
          element: subject,
          id: 'foo',
          execute: subject.foo
        });
        batcher.push({
          element: subject,
          id: 'foo',
          execute: subject.bar
        });
        expect(counterFoo).toBe(0);
        expect(counterBar).toBe(0);

        nextTick(function() {
          expect(counterFoo).toBe(0);
          expect(counterBar).toBe(1);
          done();
        });
      });


      it('should not override method if object is different', function (done) {
        batcher.push({
          element: subject,
          id: 'foo',
          execute: subject.foo
        });
        batcher.push({
          element: {},
          id: 'foo',
          execute: subject.bar
        });
        expect(counterFoo).toBe(0);
        expect(counterBar).toBe(0);

        nextTick(function() {
          expect(counterFoo).toBe(1);
          expect(counterBar).toBe(1);
          done();
        });
      });

    });


    // ----


    describe('flush', function () {

      it('should execute handlers on the queue only once', function (done) {
        batcher.push({
          element: subject,
          id: 'foo',
          execute: subject.foo
        });
        batcher.push({
          element: subject,
          id: 'bar',
          execute: subject.bar
        });

        batcher.flush();
        expect(counterFoo).toBe(1);
        expect(counterBar).toBe(1);

        batcher.flush();
        batcher.flush();
        expect(counterFoo).toBe(1);
        expect(counterBar).toBe(1);

        batcher.flush();

        nextTick(function() {
          batcher.flush();
          expect(counterFoo).toBe(1);
          expect(counterBar).toBe(1);
          done();
        });
      });

    });


    // ----


    describe('reset', function () {

      it('should remove actions from the queue', function (done) {
        batcher.push({
          element: subject,
          id: 'dolor',
          execute: subject.foo
        });
        batcher.reset();
        nextTick(function() {
          expect(counterFoo).toBe(0);
          expect(counterBar).toBe(0);
          done();
        });
      });

    });


  });

});
