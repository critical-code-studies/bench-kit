/*
 * main.js - this bench's views, in the order of its tabs (bench-kit's kit/shell.js). The kit adds
 * Topics and Library itself where config.js turns them on.
 */
(function (root) {
  'use strict';
  root.SW.BENCH.shell = {
    views: ['read', 'book', 'glossary', 'changes', 'search', 'compare', 'genealogy', 'about', 'findings', 'notes', 'paratexts']
  };
})(this);
