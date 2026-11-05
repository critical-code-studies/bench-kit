/*
 * tour.js - this bench's guided tour (bench-kit's kit/tours.js). A stop: title, text, and where to
 * go: v (version), tab, find (a pattern for the line to select in Read), focus (a selector). EDIT.
 */
(function (root) {
  'use strict';
  var B = root.SW.BENCH;
  B.tourOffer = 'A short tour shows the pages, the glossary and the changes (five stops, about a minute).';
  B.tours = {
    welcome: { title: 'Welcome to the bench', stops: [
      { title: 'The pages', v: 'literal', tab: 'book', focus: '#tabs [data-tab="book"]',
        text: 'Each page of the source beside the literal and the readable translations, held at the same page as either is scrolled.' },
      { title: 'Reading line by line', v: 'readable', tab: 'read', find: /^\[p\. 1\]/, focus: '.ln.sel',
        text: 'Read gives each version’s files line by line. Select a line to annotate it, or to cite it.' },
      { title: 'The glossary', v: 'readable', tab: 'glossary', focus: '#tabs [data-tab="glossary"]',
        text: 'Each source term and its renderings, and where each falls in the translation, section by section.' },
      { title: 'The changes', v: 'readable', tab: 'changes', focus: '#tabs [data-tab="changes"]',
        text: 'Every change in the change lists, by its origin, and whether it is in the text now.' },
      { title: 'Search the source', v: 'readable', tab: 'search', focus: '#tabs [data-tab="search"]',
        text: 'A source word in the source’s OCR and in the translations.' }
    ] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
