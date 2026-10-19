/*
 * md.js - rich text in annotations: Markdown shown (SW.md), as plain text (SW.mdPlain), rich
 * text back to Markdown (SW.htmlToMd), and the editor over a note's text box (SW.mdTools).
 * Part of bench-kit (github.com/critical-code-studies/bench-kit).
 */
(function (root) {
  'use strict';
  var SW = root.SW;

  // Notes are Markdown, as Hypothesis stores and shows them, so a note written
  // here reads the same in Hypothesis's own client and the other way round.
  // SW.md renders the subset people use in a note: paragraphs and line breaks,
  // **bold**, *italic*, ~~struck~~, `code`, ``` code blocks ```, > quotations,
  // - and 1. lists, # headings, [links](https://…) and bare URLs. Everything is
  // escaped first, and a link must be http, https or mailto; links open in a new tab.
  var MD_URL = /^(https?:\/\/|mailto:)/i;
  function mdLink(href, label, bare) {
    var own = SW.internalLink && SW.internalLink(href, label, bare);   // a link within the bench (notes.js)
    if (own) return own;
    return '<a href="' + href + '" target="_blank" rel="noopener noreferrer"' + (bare ? ' data-bare="1"' : '') + '>' + label + '</a>';
  }
  function mdInline(s) {
    var keep = [];
    function stash(h) { keep.push(h); return '\u0000' + (keep.length - 1) + '\u0000'; }
    function emph(t) {
      return t.replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<b>$1</b>').replace(/__(?=\S)([\s\S]*?\S)__/g, '<b>$1</b>')
        .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<s>$1</s>')
        .replace(/(^|[^\w*])\*(?=\S)([^*\n]*?\S)\*(?!\w)/g, '$1<i>$2</i>')
        .replace(/(^|[^\w])_(?=\S)([^_\n]*?\S)_(?!\w)/g, '$1<i>$2</i>');
    }
    s = s.replace(/`([^`\n]+)`/g, function (m, c) { return stash('<code>' + c + '</code>'); });
    // a web address takes no Markdown escapes (an editor may have put \_ in one)
    function unesc(u) { return u.replace(/\\([\\`*_\[\]~#+\-.!()])/g, '$1'); }
    s = s.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      u = unesc(u);
      return MD_URL.test(u.replace(/&amp;/g, '&')) ? stash(mdLink(u, emph(t))) : m;
    });
    s = s.replace(/(^|[\s(])((?:https?:\/\/)[^\s<]+?)(?=[.,;:!?)]*(?:\s|$|&lt;))/g, function (m, pre, u) { u = unesc(u); return pre + stash(mdLink(u, u, true)); });
    s = s.replace(/\\(&gt;|&lt;|&amp;|[\\`*_\[\]~#+\-.!()])/g, function (m, c) { return stash(c); });   // \* is a plain *
    // A-…, R-…, C-…, P-…, I-… (an implementation): a code of the bench's, a link to what it names
    s = s.replace(/(^|[\s(>\[,;])([ARCPI]-[0-9A-Z]{5})(?![\w-])/g, function (m, pre, code) {
      if (code.charAt(0) === 'P') {   // a paratext: by its title once the catalogue is read (the code until then, or without access)
        var PT = SW.paratexts, t = PT && PT.titleOf(code);
        if (!t && PT) PT.want();
        return pre + stash('<a class="swlink swcode pxlink" data-pcode="' + code + '" href="?code=' + code + '" title="Paratext ' + code + ': read it here">Paratext: ' + SW.esc(t || code) + '</a>');
      }
      return pre + stash('<a class="swlink swcode mono" href="?code=' + code + '" title="Go to ' + code + '">' + code + '</a>');
    });
    // @DMB: a mention of someone by their initials
    s = s.replace(/(^|[\s(>])@([A-Z][A-Za-z]{1,5})\b/g, function (m, pre, who) { return pre + stash('<span class="mention" title="A mention of ' + who + '">@' + who + '</span>'); });
    s = emph(s);
    return s.replace(/\u0000(\d+)\u0000/g, function (m, i) { return keep[+i]; });
  }
  SW.md = function (text) {
    var fences = [];
    var src = String(text == null ? '' : text).replace(SW.markRE('[\\s\\S]*?-->', 'g'), '').replace(/\r\n?/g, '\n')
      .replace(/^```[^\n]*\n([\s\S]*?)\n?```[ \t]*$/gm, function (m, code) { fences.push(code); return '\n\u0001' + (fences.length - 1) + '\u0001\n'; });
    return mdBlocks(src.split('\n'), fences);
  };
  function mdBlocks(lines, fences) {
    var out = [], para = [], i = 0, m, items;
    function line(l) { var h = /^#{1,4}\s+(.*)$/.exec(l); return h ? '<b class="md-h">' + mdInline(SW.esc(h[1])) + '</b>' : mdInline(SW.esc(l)); }
    function flush() { if (para.length) out.push('<p>' + para.map(line).join('<br>') + '</p>'); para = []; }
    function run(re) { items = []; while (i < lines.length && re.test(lines[i])) items.push(lines[i++].replace(re, '')); return items; }
    while (i < lines.length) {
      var l = lines[i];
      if (!l.trim()) { flush(); i++; }
      else if ((m = /^\u0001(\d+)\u0001$/.exec(l.trim()))) { flush(); out.push('<pre class="md-pre"><code>' + SW.esc(fences[+m[1]]) + '</code></pre>'); i++; }
      else if (/^\s*>/.test(l)) { flush(); out.push('<blockquote>' + mdBlocks(run(/^\s*>\s?/), fences) + '</blockquote>'); }
      else if (/^\s*[-*+]\s+/.test(l)) { flush(); out.push('<ul>' + run(/^\s*[-*+]\s+/).map(function (t) { return '<li>' + line(t) + '</li>'; }).join('') + '</ul>'); }
      else if (/^\s*\d+[.)]\s+/.test(l)) { flush(); out.push('<ol>' + run(/^\s*\d+[.)]\s+/).map(function (t) { return '<li>' + line(t) + '</li>'; }).join('') + '</ol>'); }
      else { para.push(l); i++; }
    }
    flush();
    return out.join('');
  }
  // The same text without its marks, for a line of news or a Word export:
  // links kept as "text (url)".
  SW.mdPlain = function (text) {
    return String(text == null ? '' : text).replace(SW.markRE('[\\s\\S]*?-->', 'g'), '')
      .replace(/^```[^\n]*\n?|```$/gm, '')
      .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, '$1 ($2)')
      .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, '$1$2').replace(/~~([^~]+)~~/g, '$1')
      .replace(/(^|[^\w*])\*([^*\n]+)\*(?!\w)/g, '$1$2').replace(/(^|[^\w])_([^_\n]+)_(?!\w)/g, '$1$2')
      .replace(/`([^`\n]+)`/g, '$1').replace(/^\s*>\s?/gm, '').replace(/^#{1,4}\s+/gm, '')
      .replace(/\\([\\`*_\[\]~#>+\-.!()])/g, '$1');
  };

  // Rich text back to Markdown, for the rich editor: what is stored and shared
  // stays Markdown. Marks typed as text are escaped, so they stay text.
  function mdText(s) {
    // web addresses as they are; marks elsewhere escaped
    return s.replace(/\u00a0/g, ' ').split(/((?:https?:\/\/|mailto:)[^\s<>]+)/).map(function (part, k) {
      if (k % 2) return part;
      return part.replace(/([\\`*\[\]~])/g, '\\$1')
        .replace(/_/g, function (m, i, all) { return /\w/.test(all.charAt(i - 1)) && /\w/.test(all.charAt(i + 1)) ? '_' : '\\_'; });
    }).join('');
  }
  function mdWrap(mark, inner) {
    var m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner);
    return m[2] ? m[1] + mark + m[2] + mark + m[3] : inner;
  }
  SW.htmlToMd = function (root) {
    function kids(n) { var s = ''; for (var c = n.firstChild; c; c = c.nextSibling) s += ser(c); return s; }
    function ser(n) {
      if (n.nodeType === 3) return mdText(n.nodeValue);
      if (n.nodeType !== 1) return '';
      var t = n.tagName, st = n.style || {};
      if (t === 'BR') return '\n';
      if (/^H[1-6]$/.test(t) || (t === 'B' && n.classList.contains('md-h'))) return '\n\n# ' + kids(n).trim() + '\n\n';
      if (t === 'B' || t === 'STRONG') return mdWrap('**', kids(n));
      if (t === 'I' || t === 'EM') return mdWrap('*', kids(n));
      if (t === 'S' || t === 'STRIKE' || t === 'DEL') return mdWrap('~~', kids(n));
      if (t === 'CODE') return n.textContent ? '`' + n.textContent.replace(/`/g, '') + '`' : '';
      if (t === 'A' && n.getAttribute('data-bare') && MD_URL.test(n.getAttribute('href') || '')) return n.getAttribute('href');   // written bare, kept bare
      if (t === 'A') { var h = n.getAttribute('href') || '', k = kids(n); return MD_URL.test(h) && k.trim() ? '[' + k.replace(/\n/g, ' ') + '](' + h.replace(/[()\s]/g, encodeURIComponent) + ')' : k; }
      if (t === 'PRE') return '\n\n```\n' + n.textContent.replace(/\n$/, '') + '\n```\n\n';
      if (t === 'UL' || t === 'OL') {
        var i = 0;
        return '\n\n' + Array.prototype.filter.call(n.children, function (c) { return c.tagName === 'LI'; }).map(function (li) {
          return (t === 'OL' ? (++i) + '. ' : '- ') + kids(li).trim().replace(/\n+/g, ' ');
        }).join('\n') + '\n\n';
      }
      if (t === 'BLOCKQUOTE') return '\n\n' + tidy(kids(n)).split('\n').map(function (l) { return l ? '> ' + l : '>'; }).join('\n') + '\n\n';
      if (t === 'P' || t === 'DIV') return '\n\n' + kids(n) + '\n\n';
      var s = kids(n);
      if (t === 'SPAN') {
        if (/bold|[6-9]00/.test(st.fontWeight || '')) s = mdWrap('**', s);
        if (st.fontStyle === 'italic') s = mdWrap('*', s);
      }
      return s;
    }
    function tidy(s) { return s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+|\s+$/g, ''); }
    return tidy(kids(root));
  };

  // The editor over a note's text box, in two modes, chosen with the switch at
  // the right of its toolbar and kept for next time: rich text (formatting shown
  // as it will look) or Markdown (the marks typed, with a preview). The text box
  // underneath always holds the Markdown, so saving works the same either way.
  // Cmd/Ctrl+B, I and K; pasting a URL over selected words makes a link.
  SW.mdTools = function (ta) {
    if (!ta || ta._mdTools) return;
    ta._mdTools = true;
    var mode = SW.store.get('noteMode', 'rich');
    var bar = SW.el('div', { class: 'md-tools' });
    bar.innerHTML = [['b', '<b>B</b>', 'Bold (⌘B)'], ['i', '<i>I</i>', 'Italic (⌘I)'], ['code', '<code>`</code>', 'Code'],
      ['link', '🔗', 'Link (⌘K): select the words first'], ['ann', '↪', 'Link to another annotation, in this version or any other'], ['quote', '❝', 'Quotation'], ['list', '•', 'List']]
      .map(function (b) { return '<button type="button" data-md="' + b[0] + '" title="' + b[2] + '">' + b[1] + '</button>'; }).join('') +
      '<span class="md-link" hidden><input type="url" placeholder="https://…" spellcheck="false"><button type="button" data-md="link-ok">Link</button></span>' +
      '<span class="md-sep"></span><button type="button" data-md="preview" class="md-prev" title="See it as it will be shown">Preview</button>' +
      '<button type="button" data-md="help" class="md-help" title="How to format and link annotations (Help ▸ Advanced annotation)">?</button>' +
      '<span class="md-mode" role="group" aria-label="Edit as"><button type="button" data-mode="rich" title="Edit with the formatting shown">Rich text</button><button type="button" data-mode="md" title="Edit the Markdown itself">Markdown</button></span>';
    var rich = SW.el('div', { class: 'md-rich note-md', contenteditable: 'true', role: 'textbox', 'aria-multiline': 'true' });
    rich.style.minHeight = (Math.max(3, ta.rows || 3) * 1.5) + 'em';
    if (ta.placeholder) rich.dataset.placeholder = ta.placeholder;
    var prev = SW.el('div', { class: 'md-preview note-md', hidden: '' });
    ta.parentNode.insertBefore(bar, ta);
    ta.insertAdjacentElement('afterend', rich);
    rich.insertAdjacentElement('afterend', prev);
    var linkBox = bar.querySelector('.md-link'), linkIn = linkBox.querySelector('input'), saved = null;
    var taFocus = HTMLTextAreaElement.prototype.focus;
    ta.focus = function () { if (mode === 'rich') rich.focus(); else taFocus.call(ta); };

    // ---- Markdown mode: marks inserted into the text box
    function sel() { return { a: ta.selectionStart, b: ta.selectionEnd, t: ta.value.slice(ta.selectionStart, ta.selectionEnd) }; }
    function put(a, b, text, s0, s1) {
      taFocus.call(ta); ta.setSelectionRange(a, b);
      if (!document.execCommand || !document.execCommand('insertText', false, text)) ta.setRangeText(text, a, b, 'end');
      ta.setSelectionRange(a + s0, a + s1);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function wrap(m, ph) { var s = sel(), t = s.t || ph; put(s.a, s.b, m + t + m, m.length, m.length + t.length); }
    function lines(fn) {
      var v = ta.value, a = v.lastIndexOf('\n', ta.selectionStart - 1) + 1, e = v.indexOf('\n', ta.selectionEnd); if (e < 0) e = v.length;
      var t = v.slice(a, e).split('\n').map(fn).join('\n'); put(a, e, t, 0, t.length);
    }
    function mdLinkIn(url) {
      var s = sel(), t = s.t || 'link';
      if (url) put(s.a, s.b, '[' + t + '](' + url + ')', 1, 1 + t.length);
      else put(s.a, s.b, '[' + t + '](https://)', t.length + 3, t.length + 11);
    }

    // ---- rich mode: the browser's own editing commands, kept in step with the text box
    function sync() { ta.value = SW.htmlToMd(rich); ta.dispatchEvent(new Event('input', { bubbles: true })); }
    function cmd(c, v) { rich.focus(); document.execCommand(c, false, v); sync(); }
    function within(tag) { var s = window.getSelection(); var n = s.rangeCount ? s.getRangeAt(0).commonAncestorContainer : null; for (; n && n !== rich; n = n.parentNode) if (n.nodeType === 1 && n.tagName === tag) return n; return null; }
    function fixUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (!MD_URL.test(u) && /^[\w-]+(\.[\w-]+)+/.test(u)) u = 'https://' + u; return MD_URL.test(u) ? u : ''; }
    function richLink(url) {
      var s = window.getSelection();
      if (saved) { rich.focus(); s.removeAllRanges(); s.addRange(saved); }
      if (s.isCollapsed) cmd('insertHTML', '<a href="' + SW.esc(url) + '">' + SW.esc(url) + '</a>&nbsp;');
      else cmd('createLink', url);
    }
    function askLink() {
      var s = window.getSelection();
      saved = s.rangeCount && rich.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null;
      var a = within('A'); linkIn.value = a ? a.getAttribute('href') : '';
      linkBox.hidden = false; linkIn.focus(); linkIn.select();
    }
    function doneLink() {
      var u = fixUrl(linkIn.value); linkBox.hidden = true;
      if (u) richLink(u); else if (linkIn.value.trim() === '' && saved) { rich.focus(); var s = window.getSelection(); s.removeAllRanges(); s.addRange(saved); cmd('unlink'); }
      else rich.focus();
    }
    linkIn.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); doneLink(); }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); linkBox.hidden = true; rich.focus(); }
    });

    function annLink() {
      var s = window.getSelection(), m = sel();
      var keep = mode === 'rich' && s.rangeCount && rich.contains(s.anchorNode) ? s.getRangeAt(0).cloneRange() : null;
      SW.notes.pick(function (url, label) {
        label = label.replace(/[\[\]\n]/g, '');
        if (mode === 'rich') {
          rich.focus();
          if (keep) { s.removeAllRanges(); s.addRange(keep); }
          if (!keep || keep.collapsed) cmd('insertHTML', '<a href="' + SW.esc(url) + '">' + SW.esc(label) + '</a>&nbsp;');
          else cmd('createLink', url);
        } else {
          var t = m.t && !/\n/.test(m.t) ? m.t : label;
          put(m.a, m.b, '[' + t + '](' + url + ')', 1, 1 + t.length);
        }
      });
    }
    function act(k) {
      if (k === 'link-ok') return doneLink();
      if (k === 'ann') return annLink();
      if (k === 'help') return SW.notes.help();
      if (k === 'preview') {
        var on = prev.hidden;
        prev.hidden = !on; ta.hidden = on;
        bar.querySelector('.md-prev').classList.toggle('on', on);
        bar.querySelector('.md-prev').textContent = on ? 'Write' : 'Preview';
        if (on) prev.innerHTML = SW.md(ta.value) || '<p class="hint">Nothing yet.</p>'; else taFocus.call(ta);
        return;
      }
      if (mode === 'rich') {
        if (k === 'b') cmd('bold');
        else if (k === 'i') cmd('italic');
        else if (k === 'code') {
          var s = window.getSelection(), t = s.toString();
          var c = within('CODE');
          if (c) { c.replaceWith(document.createTextNode(c.textContent)); sync(); }
          else if (t.indexOf('\n') >= 0) cmd('insertHTML', '<pre>' + SW.esc(t) + '</pre><p><br></p>');
          else cmd('insertHTML', '<code>' + SW.esc(t || 'code') + '</code>&nbsp;');
        }
        else if (k === 'link') askLink();
        else if (k === 'quote') cmd('formatBlock', within('BLOCKQUOTE') ? 'P' : 'BLOCKQUOTE');
        else if (k === 'list') cmd('insertUnorderedList');
      } else {
        if (k === 'b') wrap('**', 'bold');
        else if (k === 'i') wrap('*', 'italic');
        else if (k === 'code') { var m = sel(); if (m.t.indexOf('\n') >= 0) put(m.a, m.b, '```\n' + m.t + '\n```', 4, 4 + m.t.length); else wrap('`', 'code'); }
        else if (k === 'link') mdLinkIn();
        else if (k === 'quote') lines(function (l) { return '> ' + l; });
        else if (k === 'list') lines(function (l) { return '- ' + l; });
      }
    }
    function setMode(m, keep) {
      if (m === 'rich' && mode !== 'rich') rich.innerHTML = SW.md(ta.value);
      mode = m;
      if (!keep) SW.store.set('noteMode', m);
      if (!prev.hidden) { prev.hidden = true; bar.querySelector('.md-prev').classList.remove('on'); bar.querySelector('.md-prev').textContent = 'Preview'; }
      rich.hidden = m !== 'rich'; ta.hidden = m === 'rich';
      bar.querySelector('.md-prev').hidden = m === 'rich';
      linkBox.hidden = true;
      SW.$$('[data-mode]', bar).forEach(function (b) { b.classList.toggle('on', b.dataset.mode === m); b.setAttribute('aria-pressed', b.dataset.mode === m); });
    }
    bar.addEventListener('mousedown', function (e) { if (e.target.closest('[data-md], [data-mode]')) e.preventDefault(); });   // keep the selection
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-md]'), md = e.target.closest('[data-mode]');
      if (b) { e.preventDefault(); e.stopPropagation(); act(b.dataset.md); }
      else if (md) { e.preventDefault(); e.stopPropagation(); setMode(md.dataset.mode); ta.focus(); }
    });
    function keys(e) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      var k = { b: 'b', i: 'i', k: 'link' }[e.key.toLowerCase()];
      if (k) { e.preventDefault(); act(k); }
    }
    ta.addEventListener('keydown', keys);
    rich.addEventListener('keydown', function (e) {
      // Cmd/Ctrl+Enter (save) and Escape (cancel) go to whatever listens on the text box
      if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey)) || e.key === 'Escape') {
        e.preventDefault();
        ta.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, metaKey: e.metaKey, ctrlKey: e.ctrlKey, bubbles: true, cancelable: true }));
        return;
      }
      keys(e);
    });
    rich.addEventListener('input', sync);
    ta.addEventListener('paste', function (e) {
      var s = sel(), u = (e.clipboardData && e.clipboardData.getData('text/plain') || '').trim();
      if (s.t && !/\n/.test(s.t) && MD_URL.test(u) && !/\s/.test(u)) { e.preventDefault(); mdLinkIn(u); }
    });
    // pasted or dropped into the rich editor: plain text, or a link over selected words
    function plainIn(e, dt) {
      if (!dt) return;
      e.preventDefault();
      var t = dt.getData('text/plain') || '', s = window.getSelection();
      if (!s.isCollapsed && MD_URL.test(t.trim()) && !/\s/.test(t.trim())) { saved = null; cmd('createLink', t.trim()); return; }
      cmd('insertText', t);
    }
    rich.addEventListener('paste', function (e) { plainIn(e, e.clipboardData); });
    rich.addEventListener('drop', function (e) { plainIn(e, e.dataTransfer); });
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (x) { /* older browsers */ }
    // @: the people who have annotated, offered as you type their initials
    var menu = SW.el('div', { class: 'md-mention', hidden: '' });
    rich.insertAdjacentElement('afterend', menu);
    function mentionAt() {
      if (mode === 'rich') {
        var sl = window.getSelection(); if (!sl.rangeCount || !rich.contains(sl.anchorNode) || sl.anchorNode.nodeType !== 3) return null;
        var before = sl.anchorNode.nodeValue.slice(0, sl.anchorOffset), m = /(?:^|\s)@([A-Za-z]{0,6})$/.exec(before);
        return m ? { q: m[1], node: sl.anchorNode, end: sl.anchorOffset } : null;
      }
      var mm = /(?:^|\s)@([A-Za-z]{0,6})$/.exec(ta.value.slice(0, ta.selectionStart));
      return mm ? { q: mm[1], end: ta.selectionStart } : null;
    }
    function people() { return (SW.notes && SW.notes.people ? SW.notes.people() : []); }
    function offer() {
      var at = mentionAt();
      if (!at) { menu.hidden = true; return; }
      var q = at.q.toLowerCase(), ps = people().filter(function (p) { return !q || p.by.toLowerCase().indexOf(q) === 0 || (p.name || '').toLowerCase().indexOf(q) === 0; }).slice(0, 8);
      if (!ps.length) { menu.hidden = true; return; }
      menu.innerHTML = ps.map(function (p) { return '<button type="button" data-who="' + SW.esc(p.by) + '"><b>@' + SW.esc(p.by) + '</b>' + (p.name ? ' <span class="faint">' + SW.esc(p.name) + '</span>' : '') + '</button>'; }).join('');
      menu.hidden = false;
    }
    function pick(who) {
      var at = mentionAt(); menu.hidden = true; if (!at) return;
      if (mode === 'rich') {
        var r = document.createRange(); r.setStart(at.node, at.end - at.q.length - 1); r.setEnd(at.node, at.end);
        var sl = window.getSelection(); sl.removeAllRanges(); sl.addRange(r);
        cmd('insertText', '@' + who + ' ');
      } else put(at.end - at.q.length - 1, at.end, '@' + who + ' ', who.length + 2, who.length + 2);
    }
    menu.addEventListener('mousedown', function (e) { e.preventDefault(); });
    menu.addEventListener('click', function (e) { var b = e.target.closest('[data-who]'); if (b) { e.stopPropagation(); pick(b.dataset.who); } });
    ta.addEventListener('input', offer);
    rich.addEventListener('input', offer);
    function mentionKeys(e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); menu.hidden = true; }
      else if (e.key === 'Tab' || e.key === 'Enter') { var first = menu.querySelector('[data-who]'); if (first) { e.preventDefault(); e.stopPropagation(); pick(first.dataset.who); } }
    }
    ta.addEventListener('keydown', mentionKeys, true);
    rich.addEventListener('keydown', mentionKeys, true);
    // reopened for a fresh note, or the text set from outside: show it again
    ta._mdReset = function () { rich.innerHTML = SW.md(ta.value); setMode(SW.store.get('noteMode', 'rich'), true); };
    rich.innerHTML = SW.md(ta.value);
    setMode(mode, true);
  };
})(this);
