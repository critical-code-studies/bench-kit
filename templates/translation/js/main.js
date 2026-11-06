/*
 * main.js - this bench's views, in the order of its tabs (bench-kit's kit/shell.js). The kit adds
 * Topics and Library itself where config.js turns them on.
 */
(function (root) {
  'use strict';
  root.SW.BENCH.shell = {
    home: 'book',
    alias: { read: 'edit' },                               // a link to a line opens Edit (kit/vt-edit.js)
    views: ['book', 'edit', 'glossary', 'changes', 'search', 'compare', 'genealogy', 'about', 'findings', 'notes', 'paratexts']
  };
})(this);
