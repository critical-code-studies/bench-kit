/*
 * versions.js - the texts this bench holds: the translation, the literal translation, and the
 * source as OCR. Their files are listed here, in reading order, at the commit the bench holds them
 * (a snapshot of the translation's repository, in text/, glossary.csv, checks/ and source/).
 * roles: 'program' (the text itself), 'doc' (shown in Read, never compared).
 *
 * The texts here are an invented example. Replace them with your translation's (EDIT).
 */
(function (root) {
  'use strict';

  var SRC = '';   // the files are beside the page, under text/ and source/

  // the list's machinery (links, descent, loading) is bench-kit's kit/versionlist.js
  var L = root.SWVersionList || require('../kit/versionlist.js'), files = L.files;

  var VERSIONS = [
    { id: 'literal', label: 'Literal translation', date: '2026', sort: 20260001, authors: 'A. Translator',   // EDIT
      fork: 'translation', status: 'recovered', medium: 'Markdown',
      summary: 'The literal translation: close to the source, its terms as the glossary fixes them, the source’s words in brackets.',
      build: files('text/literal/', ['01.md']) },                                                            // EDIT: the files, in order
    { id: 'translation', label: 'Translation', date: '2026', sort: 20260002, authors: 'A. Translator',  // EDIT
      fork: 'translation', status: 'recovered', medium: 'Markdown',
      summary: 'The translation, made from the literal and revised by the change lists.',
      build: files('text/translation/', ['01.md']) },                                                           // EDIT
    { id: 'ocr', label: 'The source (OCR)', date: '1935', sort: 19350001, authors: 'The author',            // EDIT
      fork: 'source', status: 'recovered', medium: 'OCR of the page images',
      summary: 'The source as the library’s OCR reads it, page image by page image: for search, not for reading.',
      build: files('source/', ['ocr.txt']) }
  ];

  var DIALECTS = { text: { label: 'Text (read, not run)', options: {} } };
  VERSIONS.forEach(function (v) { v.dialect = 'text'; v.buildNotes = []; });

  // descent: the translation is made from the literal, the literal from the source
  var PARENT = { literal: 'ocr', translation: 'literal' };
  var LINES = [{ id: 'main', label: 'Source, literal, translation', tip: 'translation' }];

  var api = L({ versions: VERSIONS, src: SRC, dialects: DIALECTS, lines: LINES, parent: PARENT, witness: {}, also: {}, influence: {} });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SWVersions = api;
})(this);
