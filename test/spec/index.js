requirejs.config({
  paths: {
    src: '../../src'
  }
});

define(
  [
    './spec-index',
    './spec-batcher',
    './spec-binding'
  ],
  function() {
    // start tests!!
    window.JASMINE_HTML_REPORTER.initialize();
    window.JASMINE_ENV.execute();
  }
);
