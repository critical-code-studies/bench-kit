/*
 * read.js - Read: bench-kit's Read view (kit/read.js) for a translation's lines. The file picker
 * remembers its place; the kit's highlighting is left plain.
 */
(function (root) {
  'use strict';
  root.SW.readView({ files: { remember: true } });
})(this);
