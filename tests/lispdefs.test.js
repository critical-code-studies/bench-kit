/*
 * tests/lispdefs.test.js - checks of kit/lispdefs.js, run by tests/run.js: each dialect's reader
 * (escapes, comments, strings, BBN-LISP's super-parentheses, Common Lisp's #' and #| |#), the
 * defining forms, and a comparison across dialects. The collations of whole programs (ELIZA's
 * Lisp line, SHRDLU's copies) are in tests/lispdefs-collations.json, run by tools/collate-lisp.js.
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function () {
  'use strict';
  var T = window.T, eq = T.eq, L = window.SWLispDefs;
  function toks(s, d) { return L.read(s, d).map(function (t) { return t.t; }).join(' '); }
  function defs(s, d) { return L.defs(s, d).list.map(function (x) { return [x.key, x.kind, x.tokens.join(' ')]; }); }

  T.group('Lisp definitions: readers');
  eq('Maclisp: / escapes, ; comments, |…| symbols, case folded', toks('(defun f (x) ; a note\n (list /( |a b| \'x))', 'maclisp'), '( DEFUN F ( X ) ( LIST ( A B QUOTE X ) )');
  eq('Maclisp: a " that does not close on its line is a letter', toks('(setq q ")\n(a "b")', 'maclisp'), '( SETQ Q " ) ( A "B" )');
  eq('BBN-LISP: % escapes, ; is a letter, ] closes to the last [', toks('(a %( b;c [d (e] f)', 'bbn'), '( A ( B;C ( D ( E ) ) F )');
  eq('BBN-LISP: ] with no [ closes to the top', toks('(defineq (f (lambda (x) (g x]', 'bbn'), '( DEFINEQ ( F ( LAMBDA ( X ) ( G X ) ) ) )');
  eq('Common Lisp: #\', #| |#, \\ in strings, backquote', toks('(f #| x #| y |# |# #\'g "a\\"b" `(,c ,@d))', 'cl'), '( F FUNCTION G "A"B" ` ( , C ,@ D ) )');
  eq('PDP-6 Lisp: ; is a letter', toks('(QUOTE (/. ! ? : ;)) (A)', 'pdp6'), '( QUOTE ( . ! ? : ; ) ) ( A )');
  eq('Maclisp: " after a quote mark is a letter, so a " in a comment opens nothing', toks('(F \'") (G) ;IF " FOLLOWS', 'maclisp'), '( F QUOTE " ) ( G )');
  eq('PDP-6 Lisp and BBN-LISP: \' is a letter', [toks("(DEFPROP YOU'RE I'M TRANSLATION)", 'pdp6'), toks("(DON'T 'X)", 'bbn')], ["( DEFPROP YOU'RE I'M TRANSLATION )", "( DON'T 'X )"]);
  eq('Maclisp: \' is QUOTE, and /\' a letter', toks("(DON/'T 'X)", 'maclisp'), "( DON'T QUOTE X )");
  eq('Interlisp: \' is QUOTE at the start of an atom, a letter inside one', toks("(YOU DON'T 'X)", 'interlisp'), "( YOU DON'T QUOTE X )");
  eq('the lines', L.read('(a\n b)', 'maclisp').map(function (t) { return t.line; }), [1, 1, 2, 2]);
  eq('a dialect guessed', [L.detect('(DEFINEQ (F (LAMBDA NIL NIL)))'), L.detect('(DEFUN F () NIL)'), L.detect("(defun f (&key x) #'car)")], ['bbn', 'maclisp', 'cl']);

  T.group('Lisp definitions: defining forms');
  eq('DEFINEQ, LAMBDA and NLAMBDA', defs('(DEFINEQ (F (LAMBDA (X) X)) (G (NLAMBDA (Y) Y)))', 'bbn'), [['F', 'function', 'X X'], ['G', 'fexpr', 'Y Y']]);
  eq('DEFPROP: a function, a theorem, a property', defs('(DEFPROP F (LAMBDA (X) X) EXPR) (DEFPROP TC-A (THCONSE (X) (P X)) THEOREM) (DEFPROP W (A) FEATURES)', 'maclisp'),
     [['F', 'function', 'X X'], ['TC-A', 'theorem', 'THCONSE X P X'], ['W FEATURES', 'property', 'A']]);
  eq('DEFUN with FEXPR, DE, DF, DM, DEFMACRO', defs('(DEFUN F FEXPR (L) L) (DE G (X) X) (DF H (L) L) (DM M (L) L) (DEFMACRO N (X) X)', 'maclisp').map(function (d) { return d[1]; }),
     ['fexpr', 'function', 'fexpr', 'macro', 'macro']);
  eq('PDEFINE, DEFS, DEFLIST', defs('(PDEFINE NG (A) B) (DEFS RED FEATURES (ADJ)) (DEFLIST CONTRAST (RED #COLOR))', 'maclisp'),
     [['NG', 'grammar', 'A B'], ['RED (word)', 'word', 'FEATURES ADJ'], ['RED CONTRAST', 'property', '#COLOR']]);
  eq('Common Lisp variables, structures and methods', defs('(defvar *x* 1) (defstruct (pt (:type list)) x y) (defmethod area ((s square)) 1)', 'cl').map(function (d) { return d[0]; }),
     ['*X* (variable)', 'PT (structure)', 'AREA (SQUARE)']);
  eq('a name defined twice: the later stands', defs('(DEFUN F () 1) (DEFUN F () 2)', 'maclisp'), [['F', 'function', '2']]);
  var dmg = L.defs('(DEFUN F (X)\n  (G (H X)\n(DEFUN K () 1)\n(DEFUN M () (', 'maclisp');
  eq('a damaged form closes where the next definition begins, and is marked', [dmg.list.map(function (d) { return [d.key, d.line, d.end, !!d.broken]; }), dmg.broken],
     [[['F', 1, 2, true], ['K', 3, 3, false], ['M', 4, 4, true]], ['F', 'M']]);
  eq('a DEFINEQ entry at the margin named like a defining form is an entry', L.defs('(DEFINEQ\n(DEFPROP (LAMBDA (X) X))\n(G (LAMBDA NIL NIL)))', 'bbn').list.map(function (d) { return d.key; }), ['DEFPROP', 'G']);
  eq('PUTPROPS and RPLQQ: properties, as DEFPROP', [defs('(PUTPROPS MY PRIORITY 2 RULES (A))', 'interlisp'), defs('(RPLQQ MY RULES (A))', 'bbn')],
     [[['MY PRIORITY', 'property', '2'], ['MY RULES', 'property', 'A']], [['MY RULES', 'property', 'A']]]);
  eq('Interlisp: font changes in a pretty-printed file left out', toks('(PUTPROPS \u0006\u0002SORRY PRIORITY\u0006\u0001 2)', 'interlisp'), '( PUTPROPS SORRY PRIORITY 2 )');
  eq('forms that define nothing are counted', L.defs('(DECLARE (SPECIAL X)) (SETQ X 1) (DEFUN F () X)', 'maclisp').other, 2);

  T.group('Lisp definitions: comparing');
  var r = L.compare({ texts: '(defineq (f (lambda (x) (g x))) (h (lambda nil "Hi")))', dialect: 'bbn' },
                    { texts: '(DEFPROP F (LAMBDA (X) (G X)) EXPR) (DEFUN H () "HI" 2) (DEFUN K () 3)', dialect: 'maclisp' });
  eq('across dialects: DEFINEQ and DEFPROP read alike', [r.matched, r.identical, r.changed, r.onlyA, r.onlyB], [2, 1, 1, 0, 1]);
  eq('the rows', r.rows.map(function (x) { return [x.key, x.status]; }), [['F', 'identical'], ['H', 'changed'], ['K', 'only in B']]);
  eq('similarity', [L.similarity(['A', 'B', 'C', 'D'], ['A', 'C', 'D']), L.similarity([], [])], [6 / 7, 1]);
  var k = L.compare('(DEFUN F (X) X)', '(DEFMACRO F (X) X)');
  eq('a function that became a macro pairs, and differs', [k.rows[0].kind, k.rows[0].status], ['function → macro', 'changed']);
})();
