/* SaliX-Z Mobile Portal Layer v3.1 — full chat.z.ai account history sync,
 * smart Persian RTL typography, model thinking stage framing, artifact scanner,
 * scroll-top sync, and zero-flicker mobile responsiveness.
 */
(function () {
  'use strict';
  if (window.__SALIX_SHELL__) return;
  window.__SALIX_SHELL__ = true;

  var PERSIAN_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  var PERSIAN_GLOBAL_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  var LATIN_GLOBAL_RE = /[A-Za-z]/g;

  var state = {
    enhance: true,
    dark: false,
    lastModel: '',
    lastDark: null,
    lastSignedIn: null,
    lastHistorySig: '',
    lastArtifactsSig: '',
    lastAtTop: null,
    syncInFlight: false,
    lastSyncMs: 0,
    artifacts: []
  };

  /* ── CSS Layer (Z.ai Light/Dark + True RTL + Thinking Stages + Mobile) ── */
  var css = [
    'html{-webkit-text-size-adjust:100%}',
    '*{-webkit-tap-highlight-color:transparent}',

    /* Code block wrapper & action bar */
    'pre.salix-pre{position:relative !important;padding-top:42px !important;direction:ltr !important;text-align:left !important;unicode-bidi:isolate !important;border-radius:12px !important;overflow:hidden;animation:salixMsgIn .24s cubic-bezier(.22,1,.36,1) both}',
    '.salix-codebar{position:absolute;top:0;left:0;right:0;height:36px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;z-index:6;border-bottom:1px solid rgba(15,17,21,0.08);background:rgba(247,248,250,0.96);backdrop-filter:blur(8px);direction:ltr}',
    'html.dark .salix-codebar{border-bottom-color:rgba(255,255,255,0.09);background:rgba(20,22,27,0.96)}',
    '.salix-lang{font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;text-transform:uppercase;color:#5B6370}',
    'html.dark .salix-lang{color:#9CA3AF}',
    '.salix-actions{display:flex;align-items:center;gap:6px;direction:rtl}',
    '.salix-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;background:#0F1115;color:#FFFFFF;border:1px solid transparent;border-radius:8px;padding:4px 10px;font:600 11px/1.3 -apple-system,"Segoe UI",Tahoma,sans-serif;cursor:pointer;transition:transform .16s cubic-bezier(.22,1,.36,1),opacity .14s ease,background-color .16s ease}',
    '.salix-btn.ghost{background:#FFFFFF;color:#0F1115;border-color:#E5E7EB}',
    'html.dark .salix-btn{background:#F4F5F7;color:#0B0C0F}',
    'html.dark .salix-btn.ghost{background:#1C1F26;color:#F4F5F7;border-color:#2C313D}',
    '.salix-btn:active{transform:scale(.95)}',
    '.salix-btn.done{background:#16A34A !important;color:#FFFFFF !important;border-color:transparent !important}',

    /* True Persian RTL & Code LTR isolation */
    'html.salix-enhanced body{overflow-x:hidden !important}',
    'html.salix-enhanced .salix-rtl{direction:rtl !important;text-align:right !important;unicode-bidi:plaintext !important;line-height:1.85 !important}',
    'html.salix-enhanced ul.salix-rtl,html.salix-enhanced ol.salix-rtl{padding-inline-start:1.5em !important;padding-inline-end:0 !important}',
    'html.salix-enhanced blockquote.salix-rtl{border-inline-start:3px solid #2563EB !important;border-inline-end:none !important;padding-inline-start:12px !important;padding-inline-end:8px !important}',
    'html.salix-enhanced table.salix-rtl th,html.salix-enhanced table.salix-rtl td{text-align:right !important}',
    'html.salix-enhanced .salix-ltr{direction:ltr !important;text-align:left !important;unicode-bidi:plaintext !important}',
    'html.salix-enhanced pre,html.salix-enhanced code,html.salix-enhanced .katex,html.salix-enhanced .katex-display{unicode-bidi:isolate !important;direction:ltr !important}',
    'html.salix-enhanced p code,html.salix-enhanced li code{unicode-bidi:embed !important;direction:ltr !important;display:inline-block;padding:0 4px;border-radius:4px}',
    'html.salix-enhanced textarea,html.salix-enhanced [contenteditable="true"]{font-size:15.5px !important;line-height:1.65 !important;unicode-bidi:plaintext !important;transition:border-color .16s ease,box-shadow .16s ease}',

    /* Model Thinking Stages card enhancement + smooth reveal */
    '@keyframes salixMsgIn{from{opacity:0;transform:translate3d(0,8px,0)}to{opacity:1;transform:translate3d(0,0,0)}}',
    '@keyframes salixThinkIn{from{opacity:0;transform:translate3d(0,4px,0) scale(.99)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}',
    'html.salix-enhanced .salix-thinking{border:1px solid rgba(15,17,21,0.1) !important;background:#F7F8FA !important;border-radius:12px !important;padding:8px 12px !important;margin:8px 0 12px !important;animation:salixThinkIn .22s cubic-bezier(.22,1,.36,1) both;transition:border-color .18s ease,background-color .18s ease}',
    'html.dark.salix-enhanced .salix-thinking{border-color:rgba(255,255,255,0.1) !important;background:#14161B !important}',
    'html.salix-enhanced .salix-thinking summary{font-weight:600 !important;cursor:pointer !important;list-style-position:inside !important}',
    'html.salix-enhanced .salix-thinking p,html.salix-enhanced .salix-thinking li{font-size:13px !important;opacity:.92}',
    'html.salix-enhanced [data-message-author-role]{animation:salixMsgIn .22s cubic-bezier(.22,1,.36,1) both}',

    /* Fix clipped hero headline on mobile */
    'html.salix-enhanced main h1:not(.prose h1){white-space:normal !important;overflow:visible !important;text-overflow:clip !important;font-size:clamp(1.32rem,5.2vw,1.8rem) !important;line-height:1.35 !important;padding:0 12px !important;text-align:center !important;max-width:100% !important}',

    /* Compact mobile-friendly 2-column capability cards */
    '@media (max-width:768px){',
    '  html.salix-enhanced main ul:has(> li > button){display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:8px !important;padding:0 12px !important;width:100% !important;max-width:440px !important;margin:10px auto 12px !important}',
    '  html.salix-enhanced main ul:has(> li > button) > li{width:100% !important;margin:0 !important}',
    '  html.salix-enhanced main ul:has(> li > button) > li > button{border-radius:14px !important;padding:8px 8px 10px !important;gap:6px !important;border:1px solid rgba(15,17,21,0.08) !important;background:#F7F8FA !important;transition:transform .16s cubic-bezier(.22,1,.36,1),border-color .16s ease,box-shadow .18s ease}',
    '  html.dark.salix-enhanced main ul:has(> li > button) > li > button{border-color:rgba(255,255,255,0.08) !important;background:#16181F !important}',
    '  html.salix-enhanced main ul:has(> li > button) > li > button:active{transform:scale(.965)}',
    '  html.salix-enhanced main ul:has(> li > button) > li > button > div:first-child{max-height:66px !important;overflow:hidden !important;border-radius:10px !important}',
    '  html.salix-enhanced main nav{padding:8px 12px !important}',
    '  html.salix-enhanced main nav button{min-height:36px !important}',
    '  html.salix-enhanced .modelSelectorButton,html.salix-enhanced button[aria-label="Select a model"]{min-height:36px !important;padding-inline:10px !important;border-radius:10px !important;transition:transform .14s ease}',
    '  html.salix-enhanced button[aria-label="More"],html.salix-enhanced button[aria-label="Send Message"]{min-width:38px !important;min-height:38px !important;transition:transform .14s ease}',
    '  html.salix-enhanced button[aria-label="More"]:active,html.salix-enhanced button[aria-label="Send Message"]:active{transform:scale(.93)}',
    '}',
    '@media (prefers-reduced-motion:reduce){pre.salix-pre,.salix-thinking,[data-message-author-role]{animation:none !important}}'
  ].join('\n');

  function injectStyle() {
    try {
      if (document.getElementById('salix-style')) return;
      var st = document.createElement('style');
      st.id = 'salix-style';
      st.textContent = css;
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  function applyEnhanceFlag() {
    try {
      document.documentElement.classList.toggle('salix-enhanced', !!state.enhance);
    } catch (e) {}
  }

  /* ── Smart Persian RTL Classifier ───────────────────────────────── */
  function detectDirection(text) {
    if (!text) return '';
    if (!PERSIAN_RE.test(text)) return '';
    var faCount = (text.match(PERSIAN_GLOBAL_RE) || []).length;
    var enCount = (text.match(LATIN_GLOBAL_RE) || []).length;
    if (faCount >= 2 || faCount * 2 >= enCount) return 'rtl';
    return '';
  }

  function applyInputDirection(el) {
    if (!el || !state.enhance) return;
    try {
      var val = 'value' in el ? el.value : (el.innerText || '');
      if (!val || !val.trim()) {
        el.setAttribute('dir', 'rtl');
        el.style.textAlign = 'right';
        return;
      }
      var dir = detectDirection(val) === 'rtl' ? 'rtl' : 'ltr';
      el.setAttribute('dir', dir);
      el.style.textAlign = dir === 'rtl' ? 'right' : 'left';
    } catch (e) {}
  }

  function applySmartRtl() {
    if (!state.enhance) return;
    try {
      var inputs = document.querySelectorAll('textarea, [contenteditable="true"]');
      for (var i = 0; i < inputs.length; i++) {
        var inp = inputs[i];
        if (!inp.getAttribute('data-salix-rtl-bound')) {
          inp.setAttribute('data-salix-rtl-bound', '1');
          inp.addEventListener('input', function (ev) { applyInputDirection(ev.currentTarget); });
          inp.addEventListener('focus', function (ev) { applyInputDirection(ev.currentTarget); });
        }
        applyInputDirection(inp);
      }

      var blocks = document.querySelectorAll(
        'main p, main li, main h1, main h2, main h3, main h4, main blockquote, main summary, main td, main th, [data-message-author-role] p, [data-message-author-role] li'
      );
      for (var j = 0; j < blocks.length; j++) {
        var el = blocks[j];
        if (el.closest('pre, code, .katex, nav')) continue;
        var text = (el.innerText || el.textContent || '').trim();
        if (!text) continue;
        var dir = detectDirection(text);
        if (dir === 'rtl') {
          if (el.getAttribute('dir') !== 'rtl') el.setAttribute('dir', 'rtl');
          el.classList.add('salix-rtl');
          el.classList.remove('salix-ltr');
          var listParent = el.tagName === 'LI' ? el.parentElement : null;
          if (listParent && (listParent.tagName === 'UL' || listParent.tagName === 'OL')) {
            listParent.setAttribute('dir', 'rtl');
            listParent.classList.add('salix-rtl');
          }
          var tableParent = (el.tagName === 'TD' || el.tagName === 'TH') ? el.closest('table') : null;
          if (tableParent) {
            tableParent.setAttribute('dir', 'rtl');
            tableParent.classList.add('salix-rtl');
          }
        } else if (el.classList.contains('salix-rtl')) {
          el.classList.remove('salix-rtl');
        }
      }
    } catch (e) {}
  }

  /* ── Thinking Stages Framing ────────────────────────────────────── */
  function enhanceThinkingBlocks() {
    if (!state.enhance) return;
    try {
      var candidates = document.querySelectorAll(
        'main details, main [class*="think" i], main [class*="reason" i], main [data-slot*="think" i]'
      );
      for (var i = 0; i < candidates.length; i++) {
        var el = candidates[i];
        if (el.closest('nav, pre, code')) continue;
        if (!el.classList.contains('salix-thinking')) {
          el.classList.add('salix-thinking');
        }
      }
    } catch (e) {}
  }

  /* ── Language Detection & Code Block Decoration ─────────────────── */
  function detectLang(pre) {
    try {
      var code = pre.querySelector('code');
      if (code) {
        var m = (code.className || '').match(/language-([\w+#.-]+)/);
        if (m) return m[1].toLowerCase();
      }
      var m2 = (pre.className || '').match(/language-([\w+#.-]+)/);
      if (m2) return m2[1].toLowerCase();
    } catch (e) {}
    return '';
  }

  function codeOf(pre) {
    try {
      var code = pre.querySelector('code');
      return code ? code.textContent : '';
    } catch (e) {
      return '';
    }
  }

  function extForLang(lang) {
    switch (lang) {
      case 'html': case 'htm': return 'html';
      case 'svg': return 'svg';
      case 'md': case 'markdown': return 'md';
      case 'javascript': case 'js': return 'js';
      case 'typescript': case 'ts': return 'ts';
      case 'python': case 'py': return 'py';
      case 'kotlin': case 'kt': return 'kt';
      case 'java': return 'java';
      case 'json': return 'json';
      case 'css': return 'css';
      case 'sql': return 'sql';
      case 'bash': case 'sh': case 'shell': return 'sh';
      default: return 'txt';
    }
  }

  function makeButton(label, ghost) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'salix-btn' + (ghost ? ' ghost' : '');
    b.textContent = label;
    b.setAttribute('aria-label', label);
    return b;
  }

  function decorateCodeBlocks() {
    var pres = document.querySelectorAll('pre');
    for (var i = 0; i < pres.length; i++) {
      var pre = pres[i];
      if (pre.getAttribute('data-salix')) continue;
      if (!pre.querySelector('code')) continue;
      pre.setAttribute('data-salix', '1');
      pre.classList.add('salix-pre');

      var lang = detectLang(pre) || 'code';
      var bar = document.createElement('div');
      bar.className = 'salix-codebar';

      var langSpan = document.createElement('span');
      langSpan.className = 'salix-lang';
      langSpan.textContent = lang;

      var actions = document.createElement('div');
      actions.className = 'salix-actions';

      var preview = makeButton('پیش‌نمایش', false);
      preview.setAttribute('data-salix-action', 'preview');
      var copy = makeButton('کپی', true);
      copy.setAttribute('data-salix-action', 'copy');

      actions.appendChild(preview);
      actions.appendChild(copy);
      bar.appendChild(langSpan);
      bar.appendChild(actions);
      pre.appendChild(bar);
    }
  }

  /* ── Artifact & Generated File Collector ────────────────────────── */
  function collectArtifacts() {
    try {
      var items = [];
      var pres = document.querySelectorAll('main pre');
      for (var i = 0; i < pres.length; i++) {
        var pre = pres[i];
        var txt = codeOf(pre);
        if (!txt || !txt.trim()) continue;
        var lang = detectLang(pre) || 'text';
        var title = 'file-' + (items.length + 1) + '.' + extForLang(lang);
        items.push({
          index: items.length,
          type: 'code',
          lang: lang,
          name: title,
          size: txt.length,
          content: txt
        });
      }

      var imgs = document.querySelectorAll('main img');
      for (var j = 0; j < imgs.length; j++) {
        var img = imgs[j];
        var src = img.getAttribute('src') || '';
        if (!src || src.indexOf('/static/') !== -1 || src.indexOf('user.png') !== -1) continue;
        if (img.naturalWidth > 0 && img.naturalWidth < 48) continue;
        if (img.closest('nav, button')) continue;
        items.push({
          index: items.length,
          type: 'image',
          lang: 'image',
          name: (img.getAttribute('alt') || ('image-' + (items.length + 1))).slice(0, 48) + '.png',
          size: 0,
          url: src
        });
      }

      state.artifacts = items;
      var compact = items.map(function (it) {
        return { index: it.index, type: it.type, lang: it.lang, name: it.name, size: it.size, url: it.url || '' };
      });
      var sig = JSON.stringify(compact);
      if (sig !== state.lastArtifactsSig) {
        state.lastArtifactsSig = sig;
        if (window.SaliXBridge && SaliXBridge.onArtifactsSync) {
          SaliXBridge.onArtifactsSync(sig);
        }
      }
    } catch (e) {}
  }

  /* ── Hide Desktop Upsell Links on Mobile ────────────────────────── */
  function tidyMobileNav() {
    if (!state.enhance) return;
    try {
      var navBtns = document.querySelectorAll('main nav button');
      for (var i = 0; i < navBtns.length; i++) {
        var txt = (navBtns[i].innerText || '').trim();
        if (txt === 'API' || txt === 'ZCode') {
          navBtns[i].style.display = window.innerWidth <= 768 ? 'none' : '';
        }
      }
    } catch (e) {}
  }

  /* ── Full Account & Chat History Sync with chat.z.ai ────────────── */
  function scrapeSidebarChats() {
    var list = [];
    var seen = {};
    try {
      var links = document.querySelectorAll('a[href*="/c/"]');
      for (var i = 0; i < links.length; i++) {
        var a = links[i];
        var href = a.getAttribute('href') || '';
        var m = href.match(/\/c\/([A-Za-z0-9_-]+)/);
        if (!m) continue;
        var id = m[1];
        if (seen[id]) continue;
        seen[id] = true;
        var title = (a.innerText || a.getAttribute('title') || '').replace(/\s+/g, ' ').trim() || 'گفتگوی Z.ai';
        list.push({ id: id, title: title, updatedAt: 0, pinned: false });
      }
    } catch (e) {}
    return list;
  }

  function syncHistory(force) {
    var now = Date.now();
    if (state.syncInFlight) return;
    if (!force && now - state.lastSyncMs < 8000) return;
    state.syncInFlight = true;
    state.lastSyncMs = now;

    try {
      var token = '';
      try { token = localStorage.getItem('token') || ''; } catch (e) {}
      var headers = token ? { Authorization: 'Bearer ' + token } : {};
      var opts = { headers: headers, credentials: 'include' };

      Promise.all([
        fetch('/api/v1/auths/', opts).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
        fetch('/api/v1/chats/?page=1', opts).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
        fetch('/api/v1/chats/pinned', opts).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
      ]).then(function (results) {
        var auth = results[0];
        var chatsRaw = Array.isArray(results[1]) ? results[1] : [];
        var pinnedRaw = Array.isArray(results[2]) ? results[2] : [];
        var pinnedIds = {};
        for (var p = 0; p < pinnedRaw.length; p++) {
          if (pinnedRaw[p] && pinnedRaw[p].id) pinnedIds[pinnedRaw[p].id] = true;
        }

        var merged = [];
        var seen = {};
        var allApi = pinnedRaw.concat(chatsRaw);
        for (var i = 0; i < allApi.length; i++) {
          var item = allApi[i];
          if (!item || !item.id || seen[item.id]) continue;
          seen[item.id] = true;
          merged.push({
            id: String(item.id),
            title: String(item.title || 'گفتگوی Z.ai').trim(),
            updatedAt: Number(item.updated_at || item.created_at || 0),
            pinned: !!pinnedIds[item.id]
          });
        }

        var domChats = scrapeSidebarChats();
        for (var j = 0; j < domChats.length; j++) {
          if (!seen[domChats[j].id]) {
            seen[domChats[j].id] = true;
            merged.push(domChats[j]);
          }
        }

        var role = (auth && auth.role) ? String(auth.role).toLowerCase() : 'guest';
        var signedIn = !!auth && role !== 'guest' && String(auth.email || '').indexOf('@guest.com') === -1;
        var activeMatch = (window.location.pathname || '').match(/\/c\/([A-Za-z0-9_-]+)/);
        var payload = {
          signedIn: signedIn,
          userName: (auth && auth.name) ? String(auth.name) : '',
          userEmail: (auth && auth.email) ? String(auth.email) : '',
          activeChatId: activeMatch ? activeMatch[1] : '',
          chats: merged
        };
        var sig = JSON.stringify(payload);
        if (force || sig !== state.lastHistorySig) {
          state.lastHistorySig = sig;
          if (window.SaliXBridge && SaliXBridge.onHistorySync) {
            SaliXBridge.onHistorySync(sig);
          }
        }
      }).finally(function () {
        state.syncInFlight = false;
      });
    } catch (e) {
      state.syncInFlight = false;
    }
  }

  /* ── Sync Live Model / Theme / Auth & Scroll State ──────────────── */
  function reportSiteState() {
    try {
      var modelEl = document.querySelector('.modelSelectorButton, button[aria-label="Select a model"]');
      var model = modelEl ? (modelEl.innerText || '').replace(/\s+/g, ' ').trim() : '';
      var isDark = document.documentElement.classList.contains('dark');
      var signInBtn = document.querySelector('main nav button');
      var hasGuestSignIn = false;
      var navBtns = document.querySelectorAll('main nav button');
      for (var i = 0; i < navBtns.length; i++) {
        var t = (navBtns[i].innerText || '').trim();
        if (t === 'Sign in' || t === 'Log in') {
          hasGuestSignIn = true;
          break;
        }
      }
      var isSignedIn = !hasGuestSignIn && !!signInBtn;

      if (model !== state.lastModel || isDark !== state.lastDark || isSignedIn !== state.lastSignedIn) {
        state.lastModel = model;
        state.lastDark = isDark;
        state.lastSignedIn = isSignedIn;
        if (window.SaliXBridge && SaliXBridge.onSiteState) {
          SaliXBridge.onSiteState(model, isDark, isSignedIn);
        }
      }
    } catch (e) {}
  }

  function findScrollableContainer() {
    try {
      var msg = document.querySelector('main [data-message-author-role], main pre, main ul');
      var cur = msg ? msg.parentElement : document.querySelector('main');
      while (cur && cur !== document.body) {
        var st = window.getComputedStyle(cur);
        if ((st.overflowY === 'auto' || st.overflowY === 'scroll') && cur.scrollHeight > cur.clientHeight + 8) {
          return cur;
        }
        cur = cur.parentElement;
      }
    } catch (e) {}
    return document.scrollingElement || document.documentElement;
  }

  function reportScrollTop() {
    try {
      var sc = findScrollableContainer();
      var atTop = !sc || sc.scrollTop <= 3;
      if (atTop !== state.lastAtTop) {
        state.lastAtTop = atTop;
        if (window.SaliXBridge && SaliXBridge.onScrollTop) {
          SaliXBridge.onScrollTop(atTop);
        }
      }
    } catch (e) {}
  }

  function patchFetchForLiveHistory() {
    if (window.__salixFetchPatched || typeof window.fetch !== 'function') return;
    window.__salixFetchPatched = true;
    var origFetch = window.fetch;
    window.fetch = function () {
      var url = '';
      try {
        url = typeof arguments[0] === 'string' ? arguments[0] : (arguments[0] && arguments[0].url) || '';
      } catch (e) {}
      var resPromise = origFetch.apply(this, arguments);
      if (url && (url.indexOf('/api/chat') !== -1 || url.indexOf('/api/v1/chats') !== -1 || url.indexOf('/api/v1/auths') !== -1)) {
        resPromise.then(function () {
          setTimeout(function () { syncHistory(true); }, 650);
        }).catch(function () {});
      }
      return resPromise;
    };
  }

  function decorate() {
    injectStyle();
    applyEnhanceFlag();
    decorateCodeBlocks();
    enhanceThinkingBlocks();
    applySmartRtl();
    tidyMobileNav();
    collectArtifacts();
    reportSiteState();
    reportScrollTop();
  }

  /* ── Native-to-Web Actions Exposed to MainActivity ──────────────── */
  window.__salixActions = {
    configure: function (opts) {
      if (!opts) return;
      if (typeof opts.enhance === 'boolean') state.enhance = opts.enhance;
      if (typeof opts.dark === 'boolean') {
        state.dark = opts.dark;
        this.setTheme(opts.dark);
      }
      applyEnhanceFlag();
      decorate();
      syncHistory(false);
    },

    setTheme: function (dark) {
      state.dark = !!dark;
      try {
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', !!dark);
        document.documentElement.classList.toggle('light', !dark);
        document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
        reportSiteState();
      } catch (e) {}
    },

    setEnhance: function (enabled) {
      state.enhance = !!enabled;
      applyEnhanceFlag();
      decorate();
    },

    refreshHistory: function () {
      syncHistory(true);
    },

    openChat: function (chatId) {
      try {
        var id = String(chatId || '').trim();
        if (!id) return false;
        var link = document.querySelector('a[href*="/c/' + id + '"]');
        if (link) {
          link.click();
          setTimeout(function () { decorate(); }, 400);
          return true;
        }
        window.location.href = 'https://chat.z.ai/c/' + encodeURIComponent(id);
        return true;
      } catch (e) {}
      return false;
    },

    deleteChat: function (chatId) {
      try {
        var id = String(chatId || '').trim();
        if (!id) return false;
        var token = '';
        try { token = localStorage.getItem('token') || ''; } catch (e) {}
        fetch('/api/v1/chats/' + encodeURIComponent(id), {
          method: 'DELETE',
          headers: token ? { Authorization: 'Bearer ' + token } : {},
          credentials: 'include'
        }).then(function () {
          if (window.location.pathname.indexOf('/c/' + id) !== -1) {
            window.location.href = 'https://chat.z.ai/';
          } else {
            syncHistory(true);
          }
        }).catch(function () {});
        return true;
      } catch (e) {}
      return false;
    },

    openSignIn: function () {
      try {
        var btns = document.querySelectorAll('main nav button, button');
        for (var i = 0; i < btns.length; i++) {
          if (btns[i].closest('[inert]')) continue;
          var t = (btns[i].innerText || '').trim();
          if (t === 'Sign in' || t === 'Log in') {
            btns[i].click();
            return true;
          }
        }
      } catch (e) {}
      return false;
    },

    newChat: function () {
      try {
        var btns = document.querySelectorAll(
          'button[aria-label*="New" i], a[aria-label*="New" i], button[aria-label="Home"]'
        );
        for (var i = 0; i < btns.length; i++) {
          if (!btns[i].closest('[inert]') && btns[i].offsetParent !== null) {
            btns[i].click();
            return true;
          }
        }
        if (window.location.pathname !== '/') {
          window.location.href = 'https://chat.z.ai/';
        } else {
          var ta = document.querySelector('textarea, [contenteditable="true"]');
          if (ta) ta.focus();
        }
      } catch (e) {
        window.location.href = 'https://chat.z.ai/';
      }
      return false;
    },

    toggleSidebar: function () {
      try {
        var btns = document.querySelectorAll('button[aria-label="Toggle Sidebar"], button[aria-label="Toggle sidebar"]');
        for (var i = 0; i < btns.length; i++) {
          if (btns[i].closest('[inert]')) continue;
          var rect = btns[i].getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            btns[i].click();
            return true;
          }
        }
      } catch (e) {}
      return false;
    },

    openModelPicker: function () {
      try {
        var btn = document.querySelector('.modelSelectorButton, button[aria-label="Select a model"]');
        if (btn && !btn.closest('[inert]')) {
          btn.click();
          return true;
        }
      } catch (e) {}
      return false;
    },

    openMoreTools: function () {
      try {
        var btn = document.querySelector('button[aria-label="More"]');
        if (btn && !btn.closest('[inert]')) {
          btn.click();
          return true;
        }
      } catch (e) {}
      return false;
    },

    triggerMode: function (modeName) {
      try {
        var btns = document.querySelectorAll('main ul li button, main button');
        var target = String(modeName || '').toLowerCase();
        for (var i = 0; i < btns.length; i++) {
          if (btns[i].closest('[inert]')) continue;
          var txt = (btns[i].innerText || '').toLowerCase();
          if (txt.indexOf(target) !== -1) {
            btns[i].click();
            return true;
          }
        }
        window.location.href = 'https://chat.z.ai/';
      } catch (e) {}
      return false;
    },

    openArtifactByIndex: function (index) {
      try {
        var item = state.artifacts[Number(index)];
        if (!item) return false;
        if (item.type === 'image' && item.url) {
          SaliXBridge.openDownload(item.url, 'image/png', item.name);
          return true;
        }
        SaliXBridge.openCode(item.content || '', item.lang || 'text');
        return true;
      } catch (e) {}
      return false;
    },

    pasteText: function (text) {
      try {
        var ta = document.querySelector('textarea');
        if (ta) {
          ta.focus();
          var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
          var next = (ta.value ? ta.value + '\n' : '') + String(text || '');
          nativeSetter.call(ta, next);
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          applyInputDirection(ta);
          return true;
        }
        var ce = document.querySelector('[contenteditable="true"]');
        if (ce) {
          ce.focus();
          document.execCommand('insertText', false, String(text || ''));
          applyInputDirection(ce);
          return true;
        }
      } catch (e) {}
      return false;
    }
  };

  /* ── Delegated Click Handler for Code Block Actions ─────────────── */
  document.addEventListener('click', function (ev) {
    var target = ev.target;
    var btn = target && target.closest ? target.closest('.salix-btn') : null;
    if (!btn) return;
    ev.preventDefault();
    ev.stopPropagation();

    var pre = btn.closest('pre');
    if (!pre) return;
    var text = codeOf(pre);
    var action = btn.getAttribute('data-salix-action');

    if (action === 'preview') {
      try {
        SaliXBridge.openCode(text, detectLang(pre));
      } catch (e) {}
      return;
    }

    if (action === 'copy') {
      try {
        SaliXBridge.copyText(text);
        var original = btn.textContent;
        btn.classList.add('done');
        btn.textContent = 'کپی شد';
        setTimeout(function () {
          btn.classList.remove('done');
          btn.textContent = original;
        }, 1400);
      } catch (e) {}
    }
  }, true);

  document.addEventListener('scroll', function () {
    reportScrollTop();
  }, { capture: true, passive: true });

  /* ── Observe Streaming DOM Updates (Debounced via rAF) ──────────── */
  var pending = 0;
  function schedule() {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = 0;
      decorate();
    });
  }

  try {
    patchFetchForLiveHistory();
    var boot = function () {
      decorate();
      syncHistory(true);
      var mo = new MutationObserver(schedule);
      mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  } catch (e) {}
})();
