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
      { title: 'The pages', v: 'translation', tab: 'book', focus: '#tabs [data-tab="book"]',
        text: 'Each page of the source beside the translation; Compare sets the literal beside it, the two held at the same page as either is scrolled.' },
      { title: 'Editing', v: 'translation', tab: 'edit', focus: '#tabs [data-tab="edit"]',
        text: 'The text as the file has it, beside the page’s image. A save writes a change list, which vt_apply applies to the master.' },
      { title: 'The glossary', v: 'translation', tab: 'glossary', focus: '#tabs [data-tab="glossary"]',
        text: 'Each source term and its renderings, and where each falls in the translation, section by section.' },
      { title: 'The changes', v: 'translation', tab: 'changes', focus: '#tabs [data-tab="changes"]',
        text: 'Every change in the change lists, by its origin, and whether it is in the text now.' },
      { title: 'Search the source', v: 'translation', tab: 'search', focus: '#tabs [data-tab="search"]',
        text: 'A source word in the source’s OCR and in the translations.' }
    ] }
  };
})(typeof window !== 'undefined' ? window : globalThis);
