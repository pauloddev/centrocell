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

  // Cabeçalho e menu
  var header = $(".header");
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 10); };
  onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  var burger = $(".burger"), drawer = $("#drawer");
  var setMenu = function (open) {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    drawer.classList.toggle("is-open", open);
  };
  burger.addEventListener("click", function () { setMenu(burger.getAttribute("aria-expanded") !== "true"); });
  $$("#drawer a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  window.addEventListener("resize", function () { if (window.innerWidth > 1060) setMenu(false); });

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
  var runRating = function () {
    starsEl.classList.add("is-lit");
    if (reduce) return;
    var to = Number(count.dataset.to), t0 = null, dur = 2200;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      count.textContent = fmt(Math.round(to * e)) + (p === 1 ? "+" : "");
      if (p < 1) requestAnimationFrame(step);
    };
    count.textContent = "0";
    requestAnimationFrame(step);
  };
  if (starsEl && count) {
    if (hasIO) {
      var rio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { runRating(); rio.disconnect(); } }, { threshold: 0.45 });
      rio.observe(starsEl);
    } else { runRating(); }
    if (reduce) count.textContent = "3.400+";
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
    $$(".arrow", car).forEach(function (b) { b.addEventListener("click", function () { go(Number(b.dataset.dir)); }); });
    if (dotsBox) slides.forEach(function () { var d = document.createElement("span"); dotsBox.appendChild(d); dots.push(d); });
    if (hasIO) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { var i = slides.indexOf(e.target); if (dots[i]) dots[i].classList.toggle("is-on", e.intersectionRatio > 0.6); });
      }, { root: track, threshold: [0, 0.6, 1] });
      slides.forEach(function (s) { cio.observe(s); });
    }
    var hold = false, visible = false, timer = null;
    ["mouseenter", "focusin", "touchstart", "pointerdown"].forEach(function (ev) { track.addEventListener(ev, function () { hold = true; }, { passive: true }); });
    ["mouseleave", "focusout"].forEach(function (ev) { track.addEventListener(ev, function () { hold = false; }); });
    var tick = function () { if (!hold && visible && !document.hidden) go(1); };
    if (hasIO && !reduce) new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !timer) timer = setInterval(tick, car.querySelector("video") ? 6000 : 3800);
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

  // Aberto agora? (Sorocaba/SP): seg a sáb, 08:00 às 18:30
  var status = $("#status");
  if (status) {
    var parts = {};
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
        .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) {}
    var wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday];
    if (wd === undefined) { var n = new Date(); wd = n.getDay(); parts.hour = n.getHours(); parts.minute = n.getMinutes(); }
    var m = (Number(parts.hour) % 24) * 60 + Number(parts.minute);
    $$(".hours tr").forEach(function (tr) { if (Number(tr.dataset.d) === wd) tr.classList.add("is-today"); });
    var open = wd >= 1 && wd <= 6 && m >= 480 && m < 1110;
    if (open) {
      var left = 1110 - m;
      status.textContent = left <= 60 ? "Aberto agora · fecha em " + left + " min" : "Aberto agora";
      status.classList.add("is-open");
    } else { status.textContent = "Fechado agora"; status.classList.add("is-closed"); }
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
