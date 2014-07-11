define(['src/binding'], function(Binding) {

  var nextTick = window.requestAnimationFrame || window.setTimeout;

  // ---

  describe('Binding', function() {

    var subject,
      element,
      h1, img, p;

    beforeEach(function() {
      element = document.createElement('div');
      element.id = 'outlet';
      // innerHTML is an anti-pattern, but we use it here since it's simpler
      // and only because element is detached from the DOM and is a "leaf" node
      element.innerHTML = '<h1></h1><img /><p role="description"></p>';
      // PS: it doesn't need to be attached to the document to work
      document.body.appendChild(element);

      h1 = element.querySelector('h1');
      img = element.querySelector('img');
      p = element.querySelector('p');
    });


    afterEach(function() {
      document.body.removeChild(element);
    });


    // ---

    describe('#render', function () {
      beforeEach(function () {
        subject = new Binding(element, {
          title: 'h1'
        });
      });

      it('should update DOM and call callback', function (done) {
        subject.render({
          title: 'lorem ipsum'
        }, function(el) {
          expect( el.querySelector('h1').textContent ).toBe('lorem ipsum');
          done();
        });
      });
    });

    // ---

    describe('textContent', function() {

      beforeEach(function() {
        subject = new Binding(element, {
          title: 'h1',
          // nested properties + [role]
          'foo.bar.description': {
            role: 'description',
            type: 'text'
          }
        });
      });


      it('should set the textContent of the matched elements on nextTick', function(done) {
        var data = {
          title: 'Lorem Ipsum',
          // nested properties
          foo: {
            bar: {
              description: 'dolor sit amet maecennas ullamcor'
            }
          }
        };

        // this flag ensures it was async
        var async = false;

        subject.render(data, function() {
          expect(async).toBe(true);
          expect(h1.textContent).toBe(data.title);
          expect(p.textContent).toBe(data.foo.bar.description);
          done();
        });

        expect(h1.textContent).toBe('');
        expect(p.textContent).toBe('');
        async = true;
      });

    });

    // ---

    describe('html', function () {

      beforeEach(function() {
        subject = new Binding(element, {
          title: {
            type: 'html',
            selector: 'h1'
          },
          description: {
            selector: '[role="description"]',
            type: 'innerHTML'
          }
        });
      });

      it('should insert HTML content', function (done) {
        var data = {
          title: '<strong>lorem</strong> ipsum',
          description: 'this is not <em>safe</em>, could lead to <b>XSS</b>'
        };

        subject.render(data, function() {
          expect(h1.innerHTML).toBe(data.title);
          expect(p.innerHTML).toBe(data.description);
          done();
        });
      });
    });

    // ---

    describe('attr', function() {

      beforeEach(function() {
        subject = new Binding(element, {
          picture: {
            selector: 'img',
            type: 'attr',
            name: 'src'
          },
          label: {
            selector: 'img',
            type: 'attribute',
            name: 'data-label'
          }
        });
      });


      it('should set the attribute of the matched elements on nextTick', function(done) {
        var data = {
          picture: 'lib/doge.jpg',
          label: 'dolor sit amet maecennas ullamcor'
        };

        subject.render(data);
        expect(img.getAttribute('src')).toBe(null);
        expect(img.getAttribute('data-label')).toBe(null);

        nextTick(function() {
          expect(img.getAttribute('src')).toBe(data.picture);
          expect(img.getAttribute('data-label')).toBe(data.label);
          done();
        });
      });

    });

    // ---

    describe('class', function () {

      beforeEach(function () {
        subject = new Binding(element, {
          activeClass: {
            type: 'class',
            // "@" matches the root element
            selector: '@'
          },
          highlight: {
            type: 'className',
            selector: 'p'
          }
        });
      });

      it('should add class to element on nextTick and remove previous one', function (done) {
        var data = {
          activeClass: 'is-active',
          highlight: 'callout callout-2'
        };

        subject.render(data);
        expect( element.className ).not.toContain( data.activeClass );
        expect( p.className ).not.toContain( data.highlight );

        nextTick(function() {
          expect( element.className ).toContain( data.activeClass );
          expect( p.className ).toContain( data.highlight );
          next();
        });

        function next() {
          var data2 = {
            activeClass: 'foo',
            highlight: 'bar'
          };
          subject.render(data2);
          expect( element.className ).toContain( data.activeClass );
          expect( p.className ).toContain( data.highlight );
          expect( element.className ).not.toContain( data2.activeClass );
          expect( p.className ).not.toContain( data2.highlight );

          nextTick(function(){
            expect( element.className ).not.toContain( data.activeClass );
            expect( p.className ).not.toContain( data.highlight );
            expect( element.className ).toContain( data2.activeClass );
            expect( p.className ).toContain( data2.highlight );
            done();
          });
        }
      });
    });

    // ---

    describe('toggleClass', function () {

      beforeEach(function () {
        subject = new Binding(element, {
          active: {
            type: 'booleanClass',
            name: 'is-active',
            // "@" matches the root element
            selector: '@'
          },
          highlight: {
            type: 'toggleClass', // alias
            selector: 'p'
          },
          foo: {
            type: 'booleanClass',
            selector: 'h1',
            yes: 'is-foo',
            no: 'not-foo'
          }
        });
      });


      it('should toggle classes based on property value (add if truthy, remove if falsy)', function (done) {
        subject.render({
          active: true,
          highlight: true,
          foo: '' // falsy
        });
        expect( element.className ).not.toContain( 'is-active' );
        expect( p.className ).not.toContain( 'highlight' );
        expect( h1.className ).not.toContain( 'is-foo' );
        expect( h1.className ).not.toContain( 'not-foo' );

        nextTick(function() {
          expect( element.className ).toContain( 'is-active' );
          expect( p.className ).toContain( 'highlight' );
          expect( h1.className ).not.toContain( 'is-foo' );
          expect( h1.className ).toContain( 'not-foo' );

          subject.render({
            active: false,
            highlight: true,
            foo: 'bar' // truthy
          });

          nextTick(function() {
            expect( element.className ).not.toContain( 'is-active' );
            expect( p.className ).toContain( 'highlight' );
            expect( h1.className ).toContain( 'is-foo' );
            expect( h1.className ).not.toContain( 'not-foo' );
            done();
          });
        });

      });
    });

    // ---

    describe('toggleAttribute', function () {
      beforeEach(function () {
        subject = new Binding(element, {
          active: {
            type: 'toggleAttribute',
            name: 'data-awesome',
            // "@" matches the root element
            selector: '@'
          },
          'aria-hidden': {
            type: 'booleanAttribute', // alias
            // use key as attribute name
            selector: 'p'
          },
          foo: {
            type: 'toggleAttr', // alias
            selector: 'h1',
            yes: 'aria-expanded',
            no: 'aria-disabled'
          }
        });
      });

      it('should toggle attribute based on value', function (done) {
        subject.render({
          active: true,
          'aria-hidden': true,
          foo: '' // falsy
        });

        nextTick(function() {
          expect( element.hasAttribute('data-awesome') ).toBe(true, 'data-awesome');
          expect( p.hasAttribute('aria-hidden') ).toBe(true, 'aria-hidden');
          expect( h1.hasAttribute('aria-expanded') ).toBe(false, 'aria-expanded');
          expect( h1.hasAttribute('aria-disabled') ).toBe(true, 'aria-disabled');

          subject.render({
            active: true,
            'aria-hidden': false,
            foo: 'bar' // truthy
          });

          nextTick(function() {
            expect( element.hasAttribute('data-awesome') ).toBe(true, 'data-awesome 2');
            expect( p.hasAttribute('aria-hidden') ).toBe(false, 'aria-hidden 2');
            expect( h1.hasAttribute('aria-expanded') ).toBe(true, 'aria-expanded 2');
            expect( h1.hasAttribute('aria-disabled') ).toBe(false, 'aria-disabled 2');
            done();
          });
        });
      });

    });

    // ---

    describe('array', function () {
      beforeEach(function () {
        subject = new Binding(element, {
          title: [
            {
              type: 'text',
              selector: 'h1'
            },
            {
              type: 'text',
              selector: 'p'
            },
            {
              type: 'attr',
              name: 'title',
              selector: 'img'
            }
          ],
          image: {
            type: 'attr',
            name: 'src',
            selector: 'img'
          }
        });
      });

      it('should execute multiple bindings at once', function (done) {
        var data = {
          title: 'Wow, Such Awsome Doge.',
          image: 'lib/doge.jpg'
        };
        subject.render(data);

        nextTick(function() {
          expect( h1.textContent ).toEqual( data.title );
          expect( p.textContent ).toEqual( data.title );
          expect( img.getAttribute('title') ).toEqual( data.title );
          expect( img.getAttribute('src') ).toEqual( data.image );
          done();
        });
      });

    });

    // ---

    describe('error handling', function () {

      it('should throw invalid error type', function () {
        subject = new Binding(element, {
          lorem: {
            type: 'invalid',
            selector: 'h1'
          },
          dolor: 'p'
        });

        var data = {
          lorem: 'ipsum',
          dolor: 'sit amet'
        };
        expect(function() {
          subject.render(data);
        }).toThrow(new Error('invalid [type]: "invalid"'));
      });


      it('should throw invalid selector when it can\'t find an element', function () {
        subject = new Binding(element, {
          lorem: '.ipsum',
          dolor: 'p'
        });

        var data = {
          lorem: 'ipsum',
          dolor: 'sit amet'
        };
        expect(function() {
          subject.render(data);
        }).toThrow(new Error('can\'t find element with selector ".ipsum" inside ' + element.outerHTML));
      });

    });

    // ---

    describe('#destroy', function () {
      beforeEach(function (done) {
        subject = new Binding(element, {
          title: 'h1'
        });
        subject.render({
          title: 'Lorem Ipsum'
        });
        nextTick(done);
      });

      it('should delete all the references', function () {
        expect( subject._root ).not.toBeUndefined('_root');
        expect( subject._elements ).not.toBeUndefined('_elements');
        expect( subject._config ).not.toBeUndefined('_config');
        expect( subject._data ).not.toBeUndefined('_data');
        expect( subject._props ).not.toBeUndefined('_props');

        subject.destroy();

        expect( subject._root ).toBeUndefined('_root 2');
        expect( subject._elements ).toBeUndefined('_elements 2');
        expect( subject._config ).toBeUndefined('_config 2');
        expect( subject._data ).toBeUndefined('_data 2');
        expect( subject._props ).toBeUndefined('_props 2');
      });

    });

  });
});
