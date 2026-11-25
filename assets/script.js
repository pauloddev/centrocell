(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasIO = "IntersectionObserver" in window;

  // Intro
  var intro = $("#intro");
  if (intro) {
    var hide = function () { intro.classList.add("is-done"); };
    if (reduce) hide(); else window.addEventListener("load", function () { setTimeout(hide, 500); });
    setTimeout(hide, 2400);
  }

  // Vídeo do topo só depois que a página carregou
  var heroVid = $("video[data-hero]");
  if (heroVid) {
    var saver = navigator.connection && navigator.connection.saveData;
    var startHero = function () { if (saver || reduce) return; heroVid.preload = "auto"; var p = heroVid.play(); if (p && p.catch) p.catch(function () {}); };
    if (document.readyState === "complete") setTimeout(startHero, 300); else window.addEventListener("load", function () { setTimeout(startHero, 300); });
  }

  // Cabeçalho e menu
  var header = $(".header");
  var scrolled = null, ticking = false;
  var onScroll = function () { ticking = false; var s = window.scrollY > 10; if (s !== scrolled) { scrolled = s; header.classList.toggle("is-scrolled", s); } };
  onScroll(); window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // WhatsApp flutuante
  var wa = $("#wa"), waBtn = $(".wa__btn");
  waBtn.addEventListener("click", function () {
    var o = !wa.classList.contains("is-open");
    wa.classList.toggle("is-open", o); waBtn.setAttribute("aria-expanded", o);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    setMenu(false); wa.classList.remove("is-open"); waBtn.setAttribute("aria-expanded", false);
  });
  document.addEventListener("click", function (e) { if (!wa.contains(e.target)) { wa.classList.remove("is-open"); waBtn.setAttribute("aria-expanded", false); } });

  // Revelar ao rolar
  $$("[data-stagger]").forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (el, i) { el.style.setProperty("--i", i); });
  });
  var items = $$("[data-reveal]");
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
    $$("[data-stagger]").forEach(function (el) { if (!el.closest("[data-reveal]")) io.observe(el); });
  } else {
    items.concat($$("[data-stagger]")).forEach(function (el) { el.classList.add("is-in"); });
  }

  // Google: estrelas + contador
  var starsEl = $("#stars"), count = $("#count");
  var fmt = function (n) { return n.toLocaleString("pt-BR"); };
  var runRating = function () { starsEl.classList.add("is-lit"); };
  if (starsEl && count) {
    if (hasIO) {
      var rio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { runRating(); rio.disconnect(); } }, { threshold: 0.45 });
      rio.observe(starsEl);
    } else { runRating(); }
  }

  // Marca selecionada vai junto na mensagem do orçamento
  var cta = $("#brand-cta");
  if (cta) {
    var label = $("span", cta), baseLabel = label ? label.textContent : "", picked = "";
    var upd = function () {
      var msg = cta.dataset.msg + (picked ? " Marca do aparelho: " + picked + "." : "") + " Modelo e defeito: ";
      cta.href = "https://wa.me/" + cta.dataset.num + "?text=" + encodeURIComponent(msg);
      if (label) label.textContent = picked ? baseLabel + " · " + picked : baseLabel;
    };
    var opts = $$(".brand-opt");
    opts.forEach(function (b) {
      b.addEventListener("click", function () {
        var on = b.getAttribute("aria-pressed") === "true";
        opts.forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        picked = on ? "" : b.dataset.brand;
        if (!on) b.setAttribute("aria-pressed", "true");
        upd();
      });
    });
    upd();
  }

  // Vídeos: tocam só quando visíveis
  var videos = $$("video");
  var userPaused = new WeakSet();
  if (hasIO) {
    var vio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && e.intersectionRatio > 0.55 && !reduce && !userPaused.has(v)) {
          if (v.preload === "none") v.preload = "auto";
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else { v.pause(); }
      });
    }, { threshold: [0, 0.55, 1] });
    videos.forEach(function (v) { vio.observe(v); });
  }
  $$(".vbtn").forEach(function (b) {
    var v = b.parentNode.querySelector("video");
    var sync = function () {
      b.classList.toggle("is-paused", v.paused);
      b.setAttribute("aria-label", v.paused ? "Reproduzir vídeo" : "Pausar vídeo");
    };
    sync(); v.addEventListener("play", sync); v.addEventListener("pause", sync);
    b.addEventListener("click", function () {
      if (v.paused) { userPaused.delete(v); v.play(); } else { userPaused.add(v); v.pause(); }
    });
  });

  // Carrosséis
  $$("[data-car]").forEach(function (car) {
    var track = $(".track", car), slides = $$(".slide", track), dotsBox = $(".dots", car), dots = [];
    if (!track || !slides.length) return;
    var gap = function () { return parseFloat(getComputedStyle(track).columnGap) || 16; };
    var step = function () { return slides[0].getBoundingClientRect().width + gap(); };
    var go = function (dir) {
      var max = track.scrollWidth - track.clientWidth - 4;
      var bh = reduce ? "auto" : "smooth";
      if (dir > 0 && track.scrollLeft >= max) track.scrollTo({ left: 0, behavior: bh });
      else if (dir < 0 && track.scrollLeft <= 4) track.scrollTo({ left: max + 4, behavior: bh });
      else track.scrollBy({ left: step() * dir, behavior: bh });
    };
    var hydrated = false;
    var hydrate = function () {
      if (hydrated) return; hydrated = true;
      $$("img[data-src]", track).forEach(function (im) {
        if (im.dataset.srcset) im.srcset = im.dataset.srcset;
        im.src = im.dataset.src; im.removeAttribute("data-src"); im.removeAttribute("data-srcset");
      });
    };
    track.addEventListener("scroll", hydrate, { once: true, passive: true });
    car.addEventListener("pointerdown", hydrate, { once: true, passive: true });
    $$(".arrow", car).forEach(function (b) { b.addEventListener("click", hydrate, { once: true }); });
    var fit = function () { car.classList.toggle("is-fit", track.scrollWidth <= track.clientWidth + 2); };
    fit(); window.addEventListener("resize", fit); window.addEventListener("load", fit);
    $$(".arrow", car).forEach(function (b) { b.addEventListener("click", function () { go(Number(b.dataset.dir)); }); });
    if (dotsBox) slides.forEach(function () { var d = document.createElement("span"); dotsBox.appendChild(d); dots.push(d); });
    if (hasIO) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { var i = slides.indexOf(e.target); if (dots[i]) dots[i].classList.toggle("is-on", e.intersectionRatio > 0.6); if (i > -1) slides[i].classList.toggle("is-on", e.intersectionRatio > 0.6); });
      }, { root: track, threshold: [0, 0.6, 1] });
      slides.forEach(function (s) { cio.observe(s); });
    }
    var hold = false, visible = false, timer = null;
    ["mouseenter", "focusin", "touchstart", "pointerdown"].forEach(function (ev) { track.addEventListener(ev, function () { hold = true; }, { passive: true }); });
    ["mouseleave", "focusout"].forEach(function (ev) { track.addEventListener(ev, function () { hold = false; }); });
    var tick = function () { if (!hold && visible && !document.hidden) go(1); };
    if (hasIO && !reduce) new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !timer) timer = setInterval(tick, car.querySelector("video") ? 6000 : 2900);
    }, { threshold: 0.3 }).observe(track);
  });

  // Avaliações: pausar movimento
  var rv = $("#reviews"), rb = $(".reviews__pause");
  if (rv && rb) rb.addEventListener("click", function () {
    var p = rb.getAttribute("aria-pressed") !== "true";
    rb.setAttribute("aria-pressed", p);
    rb.querySelector("span").textContent = p ? "Retomar avaliações" : "Pausar avaliações";
    rv.classList.toggle("is-paused", p);
  });

  // Horário dinâmico (Sorocaba/SP): seg a sex 08:00 às 18:30; sábado 08:00 às 15:00; domingo fechado
  var status = $("#status"), dayBar = $("#daybar");
  if (status) {
    var HRS = { 0: null, 1: [480, 1110], 2: [480, 1110], 3: [480, 1110], 4: [480, 1110], 5: [480, 1110], 6: [480, 900] };
    var DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    var fmt = function (m) { var h = Math.floor(m / 60), mm = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm; };
    var dur = function (m) { var h = Math.floor(m / 60), mm = m % 60; return (h ? h + "h " : "") + (mm || !h ? mm + "min" : "").trim(); };
    var now = function () {
      var parts = {};
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
          .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
      } catch (e) {}
      var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday];
      if (wd === undefined) { var n = new Date(); wd = n.getDay(); parts.hour = n.getHours(); parts.minute = n.getMinutes(); }
      return { wd: wd, m: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
    };
    var nextOpen = function (wd, m) {
      for (var i = 0; i < 7; i++) {
        var d = (wd + i) % 7, h = HRS[d];
        if (h && (i > 0 || m < h[0])) return { i: i, d: d, at: h[0] };
      }
      return null;
    };
    var paint = function () {
      var t = now(), wd = t.wd, m = t.m, h = HRS[wd];
      $$(".hours tr").forEach(function (tr) { tr.classList.toggle("is-today", Number(tr.dataset.d) === wd); });
      status.classList.remove("is-open", "is-closed", "is-soon");
      if (h && m >= h[0] && m < h[1]) {
        var left = h[1] - m;
        status.textContent = "Aberto agora · fecha às " + fmt(h[1]) + " (faltam " + dur(left) + ")";
        status.classList.add("is-open"); if (left <= 60) status.classList.add("is-soon");
        if (dayBar) { dayBar.hidden = false; dayBar.firstElementChild.style.width = Math.round((m - h[0]) / (h[1] - h[0]) * 100) + "%"; dayBar.setAttribute("aria-label", "Dia de atendimento: " + fmt(h[0]) + " às " + fmt(h[1])); var s = $("span", dayBar); if (s) s.textContent = fmt(h[0]) + "|" + fmt(h[1]); }
      } else {
        var nx = nextOpen(wd, m), txt = "Fechado agora";
        if (nx) txt += nx.i === 0 ? " · abre hoje às " + fmt(nx.at) : nx.i === 1 ? " · abre amanhã às " + fmt(nx.at) : " · abre " + DIAS[nx.d] + " às " + fmt(nx.at);
        status.textContent = txt; status.classList.add("is-closed");
        if (dayBar) dayBar.hidden = true;
      }
    };
    paint(); setInterval(paint, 30000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) paint(); });
  }

  // Mapa: carrega quando chega perto
  var mf = $(".map__frame");
  if (mf) {
    var load = function () {
      if (mf.firstChild) return;
      var f = document.createElement("iframe");
      f.src = mf.dataset.src; f.loading = "lazy"; f.title = "Mapa da Centro Cell no Centro de Sorocaba";
      f.referrerPolicy = "no-referrer-when-downgrade"; f.allowFullscreen = true;
      mf.appendChild(f);
    };
    if (hasIO) {
      var mio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { load(); mio.disconnect(); } }, { rootMargin: "500px" });
      mio.observe(mf);
    } else load();
  }

  var ano = $("#ano"); if (ano) ano.textContent = new Date().getFullYear();
})();
