// scripts/markdown.js
// Minimal, safe markdown renderer.
// Universal module: works in browser (window.MD) and Node (module.exports).
// Supports: headings, paragraphs, fenced code, inline code, blockquotes,
// unordered/ordered lists, hr, links, bold, italic.
// Inputs are HTML-escaped before parsing — XSS-safe by design.

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.MD = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  function escHtml(s) {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(s) {
    return s
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60);
  }

  function inline(s) {
    s = s.replace(/`([^`]+)`/g, function (_, t) { return '<code>' + t + '</code>'; });
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) {
      var safe = /^(https?:|mailto:|\.\.?\/|#|\/)/.test(u) ? u : '#';
      var ext = /^https?:/.test(u);
      return '<a href="' + safe + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    return s;
  }

  function render(raw) {
    var lines = raw.replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    var headings = [];
    var title = null;
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      var fence = line.match(/^```(\w*)\s*$/);
      if (fence) {
        var lang = fence[1];
        var buf = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) {
          buf.push(lines[i]);
          i++;
        }
        i++;
        out.push('<pre class="code"' + (lang ? ' data-lang="' + escHtml(lang) + '"' : '') + '><code>' + escHtml(buf.join('\n')) + '</code></pre>');
        continue;
      }

      var h = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (h) {
        var lvl = h[1].length;
        var text = h[2];
        var id = slugify(text);
        if (lvl === 1 && !title) title = text;
        if (lvl >= 2 && lvl <= 3) headings.push({ id: id, text: text, lvl: lvl });
        out.push('<h' + lvl + ' id="' + id + '">' + inline(escHtml(text)) + '</h' + lvl + '>');
        i++;
        continue;
      }

      if (/^---+\s*$/.test(line)) {
        out.push('<hr>');
        i++;
        continue;
      }

      if (/^>\s?/.test(line)) {
        var bq = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          bq.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        out.push('<blockquote><p>' + inline(escHtml(bq.join(' ').trim())) + '</p></blockquote>');
        continue;
      }

      if (/^\s*[-*]\s+/.test(line)) {
        var ul = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          ul.push(lines[i].replace(/^\s*[-*]\s+/, ''));
          i++;
        }
        out.push('<ul>' + ul.map(function (b) { return '<li>' + inline(escHtml(b)) + '</li>'; }).join('') + '</ul>');
        continue;
      }

      if (/^\s*\d+\.\s+/.test(line)) {
        var ol = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          ol.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
          i++;
        }
        out.push('<ol>' + ol.map(function (b) { return '<li>' + inline(escHtml(b)) + '</li>'; }).join('') + '</ol>');
        continue;
      }

      if (/^\s*$/.test(line)) {
        i++;
        continue;
      }

      var p = [];
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^#{1,6}\s/.test(lines[i]) &&
        !/^```/.test(lines[i]) &&
        !/^>\s?/.test(lines[i]) &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^---+\s*$/.test(lines[i])
      ) {
        p.push(lines[i]);
        i++;
      }
      out.push('<p>' + inline(escHtml(p.join(' '))) + '</p>');
    }

    return { html: out.join('\n'), headings: headings, title: title };
  }

  function readTime(raw) {
    var words = raw.replace(/```[\s\S]*?```/g, '').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  }

  function summarize(raw, max) {
    max = max || 200;
    var stripped = raw
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^#{1,6}\s+.+$/gm, '')
      .replace(/^>\s+.+$/gm, '')
      .replace(/[*_`>#-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (stripped.length <= max) return stripped;
    return stripped.slice(0, max).replace(/\s+\S*$/, '') + '…';
  }

  return { render: render, slugify: slugify, escHtml: escHtml, readTime: readTime, summarize: summarize };
}));
