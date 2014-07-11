define(['src/domr'], function (domr) {

  describe('domr', function () {

    it('should expose expected methods', function () {
      var r = domr.create(document.body, {foo: '.bar'});
      // instanceof is evil, so we check if it returns the expected interface
      // instead, this is more flexible and good enough
      expect(typeof r.render).toBe('function');
    });

  });

});
