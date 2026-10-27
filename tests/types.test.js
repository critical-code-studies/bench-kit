/*
 * tests/types.test.js - checks of the annotation types in kit/notes.js, run by tests/run.js: an
 * annotation's type read from its tags (type:<id>, or ccs:<id> as 0.83.0 wrote it), and its name.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, N = window.SW.notes;
  T.group('Annotation types');
  eq('the type read from the tags', [N.typeOf({ tags: ['test', 'type:metaphor'] }), N.typeOf({ tags: ['ccs:context'] }), N.typeOf({ tags: ['provenance'] }), N.typeOf({})],
     ['metaphor', 'context', null, null]);
  eq('a type shown by name, or by its id where the bench gives no types', N.typeName('critique'), (N.types().length ? 'Critique' : 'critique'));
})();
