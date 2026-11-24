/* Premier — motion engine (vanilla JS, no libraries).
   Respects prefers-reduced-motion; every section still works as a normal static page without it. */
(function () {
  'use strict';
  var D = document, W = window, root = D.documentElement;
  var RM = root.classList.contains('rm');
  var HAS_IO = 'IntersectionObserver' in W;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function $(s, c) { return (c || D).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); }
  var vh = W.innerHeight, y = W.pageYOffset, lastY = y, ticking = false;


  /* split an element's text into word spans, keeping inline tags such as <em> */
  function splitWords(el, cls, indexed) {
    var out = [], i = 0, label = el.textContent.trim(), frag = D.createDocumentFragment();
    (function walk(node, parent) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { parent.appendChild(D.createTextNode(' ')); return; }
            var sp = D.createElement('span'); sp.className = cls; sp.setAttribute('aria-hidden', 'true');
            if (indexed) sp.style.setProperty('--i', i++);
            sp.textContent = tok; parent.appendChild(sp); out.push(sp);
          });
        } else if (n.nodeType === 1) { var c = n.cloneNode(false); parent.appendChild(c); walk(n, c); }
      });
    })(el, frag);
    el.innerHTML = ''; el.appendChild(frag); el.setAttribute('aria-label', label);
    return out;
  }

  /* ---------- scroll progress bar ---------- */
  var bar = D.createElement('div');
  bar.className = 'pbar'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>';
  D.body.appendChild(bar);
  var barI = bar.firstChild, hdr = $('.hdr');

  /* ---------- auto reveal: tag common elements, stagger siblings ---------- */
  var AUTO = [
    ['.phero .wrap>*', ''], ['.shead>*', ''], ['.split-copy>*', ''], ['.split-media', 'zoom'],
    ['.pillar', ''], ['.attr', ''], ['.feat', ''], ['details.q', ''], ['.faq-grid>.t-l', ''],
    ['.cta-box', 'zoom'], ['.ccard', ''], ['.others a', ''], ['.themes span', 'pop'],
    ['.info>div', ''], ['.form', ''], ['.quote .wrap>*', ''], ['.lc-copy>*', ''], ['.lc-media', 'zoom'],
    ['.stat', ''], ['.chero .wrap>*', ''], ['.cb-copy>*', ''], ['.gal figure', 'zoom'],
    ['.uses>div', 'pop'], ['.swblock', 'zoom'], ['.bands', ''], ['.abt2-l>*:not(h2)', ''], ['.acard', 'zoom'], ['.proc .shead>*', ''], ['.pnode', ''], ['.fact', ''], ['.bcard', 'zoom'], ['.abp-intro>*', ''], ['.abp-banner>div>*', '']
  ];
  AUTO.forEach(function (a) {
    $$(a[0]).forEach(function (el) {
      if (el.hasAttribute('data-r') || el.closest('.abt') || el.closest('.xq-pin') || el.closest('.why-pin')) return;
      el.setAttribute('data-r', a[1]);
    });
  });
  var groups = [];
  $$('[data-r]').forEach(function (el) {
    var p = el.parentElement, g = groups.filter(function (x) { return x.p === p; })[0];
    if (!g) { g = { p: p, n: 0 }; groups.push(g); }
    el.style.setProperty('--d', Math.min(g.n, 6) * 80 + 'ms'); g.n++;
  });
  var pending = $$('[data-r]');
  if (HAS_IO && !RM) {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    pending.forEach(function (el) { rio.observe(el); });
  } else { pending.forEach(function (el) { el.classList.add('in'); }); pending = []; }

  /* ---------- hero: word-by-word headline ---------- */
  var hero = $('.hero2'), heroCopy = hero && $('.hero2-in', hero), heroArt = hero && $('.hero2-bg', hero), cue = null;
  if (hero && !RM) { var h1 = $('h1', hero); if (h1) splitWords(h1, 'wd', true); }

  /* scroll-lit headlines (About, etc.) */
  var lit = [];
  if (!RM) $$('[data-words]').forEach(function (el) { if (!el.closest('.abt')) lit.push({ el: el, words: splitWords(el, 'w', false) }); });

  /* ---------- counters ---------- */
  var cio = HAS_IO && !RM ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 }) : null;
  $$('[data-count]').forEach(function (el) {
    var to = +el.getAttribute('data-count'), s = el.getAttribute('data-since');
    if (s) to = new Date().getFullYear() - (+s);
    el._to = to; el.textContent = String(to);
    if (cio) { el.textContent = '0'; cio.observe(el); }
  });
  function runCount(el) {
    var t0 = null, to = el._to, dur = 1700;
    (function f(t) {
      if (t0 === null) t0 = t;
      var k = clamp((t - t0) / dur, 0, 1); k = 1 - Math.pow(1 - k, 4);
      el.textContent = String(Math.round(to * k));
      if (k < 1) requestAnimationFrame(f);
    })(performance.now());
  }

  /* ---------- About: pinned story (word-light headline, beats, image crossfade) ---------- */
  var abt = $('.abt'), abtFn = null;
  if (abt && !RM) {
    var h2w = $('[data-words]', abt);
    if (h2w) {
      h2w.setAttribute('aria-label', h2w.textContent.trim());
      h2w.innerHTML = h2w.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true">' + w + '</span>'; }).join(' ');
    }
    var beats = $$('.beat', abt), aimgs = $$('.abt-media img', abt), words = $$('.w', abt), dotsA = $$('.abt-steps i', abt), N = beats.length;
    abtFn = function (p) {
      var k = clamp(p / 0.22, 0, 1) * words.length;
      words.forEach(function (w, i) { w.style.opacity = (0.16 + 0.84 * clamp(k - i, 0, 1)).toFixed(3); });
      beats.forEach(function (b, j) {
        var a = j / N, z = (j + 1) / N, f = 0.06, o = 1;
        if (j > 0) o = Math.min(o, clamp((p - a) / f, 0, 1));
        if (j < N - 1) o = Math.min(o, clamp((z - p) / f, 0, 1));
        var dir = p < (a + z) / 2 ? 1 : -1;
        b.style.opacity = o.toFixed(3);
        b.style.transform = 'translate3d(0,' + ((1 - o) * 34 * dir).toFixed(1) + 'px,0)';
        b.style.visibility = o > 0.01 ? 'visible' : 'hidden';
        b.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      });
      aimgs.forEach(function (im, j) {
        var a = j / N, z = (j + 1) / N, f = 0.07;
        var o = j === 0 ? 1 : clamp((p - (a - f / 2)) / f, 0, 1);
        var local = clamp((p - (a - f / 2)) / (z - a + f / 2), 0, 1);
        im.style.opacity = o.toFixed(3);
        im.style.transform = 'scale(' + (1.16 - 0.16 * (j === 0 ? clamp(p / z * 1.4, 0, 1) : local)).toFixed(3) + ')';
      });
      var act = Math.min(N - 1, Math.floor(p * N));
      dotsA.forEach(function (d, i) { d.classList.toggle('on', i === act); });
    };
  }

  /* ---------- Exquisite collection: scroll-driven carousel ---------- */
  var st = $('#xq'), trk = $('.xq-track'), xqPin = trk && $('[data-pin]', trk), xqFn = null;
  if (st && trk) {
    var bgs = $$('.xq-bg', st), covers = $$('.xq-cover', st), copies = $$('.xq-copy .slide-t', st), feats = $$('.xq-feats .slide-t', st), tags = $$('.xq-tag span', st),
        dots = $$('.xq-dots button', st), n = covers.length, cur = 0, count = $('.xq-count', st),
        nextBtn = $('.xq-next', st), data = []; 
    try { data = JSON.parse(st.getAttribute('data-next') || '[]'); } catch (e) { data = []; }
    trk.style.setProperty('--n', n);
    var scrollMode = !RM;
    var show = function (i) {
      i = (i + n) % n; if (i === cur) return;
      var prev = cur; cur = i;
      covers[prev].classList.add('is-leaving');
      setTimeout(function () { covers[prev].classList.remove('is-leaving'); }, 950);
      [bgs, covers, copies, feats, tags, dots].forEach(function (a) { if (a[prev]) a[prev].classList.remove('is-active', 'on'); });
      bgs[cur].classList.add('on');
      [covers, copies, feats, tags, dots].forEach(function (a) { if (a[cur]) a[cur].classList.add('is-active'); });
      if (count) count.textContent = ('0' + (cur + 1)).slice(-2) + ' / ' + ('0' + n).slice(-2);
      if (nextBtn && data.length) {
        var nx = data[(cur + 1) % n];
        nextBtn.querySelector('img').src = nx.img; nextBtn.querySelector('b').textContent = nx.name;
      }
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
    };
    var goTo = function (i) {
      if (!scrollMode) { show(i); return; }
      i = clamp(i, 0, n - 1);
      var total = trk.offsetHeight - xqPin.offsetHeight, top = trk.getBoundingClientRect().top + W.pageYOffset;
      W.scrollTo({ top: top + (i + 0.5) / n * total, behavior: 'smooth' });
    };
    var pv = $('.prev', st), nx2 = $('.next', st);
    if (pv) pv.addEventListener('click', function () { goTo(cur - 1); });
    if (nx2) nx2.addEventListener('click', function () { goTo(cur + 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(cur + 1); });
    dots.forEach(function (d, k) { d.addEventListener('click', function () { goTo(k); }); });
    if (scrollMode) xqFn = function (p) { show(Math.min(n - 1, Math.floor(p * n))); };
  }

  /* ---------- Catalogue band: books fan out as they enter ---------- */
  var cbStage = $('.cb-stage');

  /* ---------- 3D tilt on books (mouse only) ---------- */
  $$('.book').forEach(function (b) {
    var bk = $('.bk', b);
    b.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || RM) return;
      var r = b.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, yy = (e.clientY - r.top) / r.height - 0.5;
      bk.style.setProperty('--ry', (x * 16).toFixed(1) + 'deg');
      bk.style.setProperty('--rx', (-yy * 12).toFixed(1) + 'deg');
      b.classList.add('tilting');
    });
    b.addEventListener('pointerleave', function () {
      bk.style.setProperty('--ry', '0deg'); bk.style.setProperty('--rx', '0deg'); b.classList.remove('tilting');
    });
  });

  /* ---------- parallax images inside clipped frames ---------- */
  var pars = $$('.lc-media img, .gal img');

  /* ---------- video pop-up ---------- */
  var modal = null, vid = null, lastTrigger = null;
  function buildModal() {
    modal = D.createElement('div');
    modal.className = 'vmodal'; modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', 'Collection video');
    modal.innerHTML = '<div class="vbox"><button class="vx" type="button" aria-label="Close video"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button><video playsinline controls preload="none"></video><div class="vmsg"><p>Video coming soon.</p></div></div>';
    D.body.appendChild(modal);
    vid = $('video', modal);
    vid.addEventListener('error', function () { modal.classList.add('err'); });
    $('.vx', modal).addEventListener('click', closeVideo);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeVideo(); });
    D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeVideo(); });
  }
  function openVideo(src, trigger) {
    if (!modal) buildModal();
    lastTrigger = trigger; modal.classList.remove('err'); modal.classList.add('open');
    D.body.style.overflow = 'hidden';
    vid.src = src; vid.load();
    var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
    $('.vx', modal).focus();
  }
  function closeVideo() {
    modal.classList.remove('open'); D.body.style.overflow = '';
    vid.pause(); vid.removeAttribute('src'); vid.load();
    if (lastTrigger) lastTrigger.focus();
  }
  $$('[data-video]').forEach(function (b) {
    b.addEventListener('click', function () { openVideo(b.getAttribute('data-video'), b); });
  });


  /* ---------- Why Premier: tabs open one by one ---------- */
  var why = $('.why-track'), whyPin = why && $('[data-pin]', why), tabs = $$('.why .tab'), wcur = -1;
  function whyShow(i) {
    if (i === wcur) return; wcur = i;
    tabs.forEach(function (t, k) { var on = k === i; t.classList.toggle('on', on); t.setAttribute('aria-expanded', on ? 'true' : 'false'); });
  }
  if (why && tabs.length) {
    why.style.setProperty('--n', tabs.length); whyShow(0);
    tabs.forEach(function (t, k) {
      var go = function () {
        if (RM) { whyShow(k); return; }
        var total = why.offsetHeight - whyPin.offsetHeight, top = why.getBoundingClientRect().top + W.pageYOffset;
        W.scrollTo({ top: top + (k + 0.5) / tabs.length * total, behavior: 'smooth' });
      };
      t.addEventListener('click', go);
      t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  /* ---------- How it works: wave draws itself, nodes light up ---------- */
  var proc = $('.proc-stage'), pnodes = proc ? $$('.pnode', proc) : [];

  /* ---------- Gallery: three rows slide against each other ---------- */
  var g3 = $('.gal3'), g3rows = g3 ? $$('.g3-row', g3) : [];

  /* ---------- the one scroll loop ---------- */
  function seqP(el, pin) {
    var r = el.getBoundingClientRect(), total = el.offsetHeight - pin.offsetHeight;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  }
  function near(el) { var r = el.getBoundingClientRect(); return r.bottom > -vh * 0.5 && r.top < vh * 1.5; }

  function tick() {
    ticking = false; y = W.pageYOffset; vh = W.innerHeight;
    var max = root.scrollHeight - vh;
    barI.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max, 0, 1) : 0).toFixed(4) + ')';

    if (hdr) {
      hdr.classList.toggle('sc', y > 24);
      var dy = y - lastY;
      if (Math.abs(dy) > 6) {
        if (dy > 0 && y > 280 && !$('.nav-dd.open')) hdr.classList.add('hide'); else hdr.classList.remove('hide');
        lastY = y;
      }
      if (y < 120) hdr.classList.remove('hide');
    }
    if (RM) return;

    if (hero) {
      var hr = hero.getBoundingClientRect();
      if (hr.bottom > 0) {
        var hp = clamp(-hr.top / hr.height, 0, 1);
        if (heroCopy) { heroCopy.style.opacity = (1 - hp * 1.2).toFixed(3); heroCopy.style.transform = 'translate3d(0,' + (hp * -56).toFixed(1) + 'px,0)'; }
        if (heroArt) heroArt.style.transform = 'translate3d(0,' + (hp * 70).toFixed(1) + 'px,0) scale(' + (1 + hp * 0.06).toFixed(3) + ')';
        if (cue) cue.style.opacity = (1 - hp * 5).toFixed(2);
      }
    }
    if (why && whyPin && near(why)) whyShow(Math.min(tabs.length - 1, Math.floor(seqP(why, whyPin) * tabs.length)));
    if (proc) {
      var pr = proc.getBoundingClientRect();
      if (pr.bottom > -vh * 0.3 && pr.top < vh * 1.2) {
        var pp = clamp((vh * 0.92 - pr.top) / (pr.height + vh * 0.28), 0, 1);
        proc.style.setProperty('--p', pp.toFixed(3));
        pnodes.forEach(function (nd, k) { nd.classList.toggle('on', pp >= 0.1 + k * 0.24); });
      }
    }
    if (g3 && near(g3)) {
      var gr = g3.getBoundingClientRect(), gp = clamp((vh - gr.top) / (vh + gr.height), 0, 1);
      g3rows.forEach(function (row, k) {
        var tr = row.firstElementChild, mx = Math.max(0, tr.scrollWidth - row.clientWidth);
        tr.style.transform = 'translate3d(' + (-mx * (k % 2 === 0 ? gp : 1 - gp)).toFixed(1) + 'px,0,0)';
      });
    }
    lit.forEach(function (L) {
      var lr = L.el.getBoundingClientRect();
      if (lr.bottom < -50 || lr.top > vh) return;
      var k = clamp((vh * 0.86 - lr.top) / (vh * 0.42), 0, 1) * L.words.length;
      L.words.forEach(function (w, i) { w.style.opacity = (0.16 + 0.84 * clamp(k - i, 0, 1)).toFixed(3); });
    });
    if (abt && abtFn && near(abt)) abtFn(seqP(abt, $('[data-pin]', abt)));
    if (trk && xqFn && near(trk)) xqFn(seqP(trk, xqPin));
    if (cbStage) {
      var cr = cbStage.getBoundingClientRect();
      if (cr.bottom > 0 && cr.top < vh) cbStage.style.setProperty('--p', clamp((vh * 0.95 - cr.top) / (vh * 0.62), 0, 1).toFixed(3));
    }
    for (var i = 0; i < pars.length; i++) {
      var im = pars[i], box = im.parentElement, br = box.getBoundingClientRect();
      if (br.bottom < -50 || br.top > vh + 50) continue;
      var extra = (im.offsetHeight - box.offsetHeight) / 2;
      var off = (br.top + br.height / 2 - vh / 2) / ((vh + br.height) / 2);
      im.style.transform = 'translate3d(0,' + (-extra * clamp(off, -1, 1)).toFixed(1) + 'px,0)';
    }
    if (pending.length) {
      pending = pending.filter(function (el) {
        if (el.classList.contains('in')) return false;
        if (el.getBoundingClientRect().bottom < 0) { el.classList.add('in'); return false; }
        return true;
      });
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  W.addEventListener('scroll', onScroll, { passive: true });
  W.addEventListener('resize', onScroll);
  W.addEventListener('load', onScroll);
  tick();
  lit.forEach(function (L) { L.words.forEach(function (w) { w.style.opacity = '.16'; }); });
  onScroll();
})();
