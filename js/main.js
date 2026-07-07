/* =====================================================================
   CYFIELD GROUP — interaction & motion
   GSAP + ScrollTrigger + Lenis smooth scroll
   Everything is progressively enhanced and degrades gracefully.
   ===================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsapReady = typeof window.gsap !== "undefined";

  if (gsapReady && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* --------------------------------------------------- Preloader */
  function preloader() {
    const el = document.querySelector(".preloader");
    if (!el) return Promise.resolve();
    const count = el.querySelector(".preloader__count");
    const bar = el.querySelector(".preloader__bar");
    return new Promise((resolve) => {
      if (prefersReduced || !gsapReady) {
        el.style.display = "none";
        resolve();
        return;
      }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: 100, duration: 1.4, ease: "power2.inOut",
        onUpdate() {
          const n = Math.round(obj.v);
          if (count) count.textContent = String(n).padStart(2, "0");
          if (bar) bar.style.width = n + "%";
        },
        onComplete() {
          gsap.to(el, {
            yPercent: -100, duration: 0.9, ease: "power4.inOut", delay: 0.15,
            onComplete() { el.style.display = "none"; resolve(); }
          });
        }
      });
    });
  }

  /* --------------------------------------------------- Smooth scroll (Lenis) */
  let lenis = null;
  function initSmoothScroll() {
    if (prefersReduced || typeof window.Lenis === "undefined") return;
    lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on("scroll", () => { if (window.ScrollTrigger) ScrollTrigger.update(); });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    // anchor links
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      a.addEventListener("click", (e) => {
        const target = document.querySelector(id);
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -80 }); }
      });
    });
  }

  /* --------------------------------------------------- Nav */
  function initNav() {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      nav.classList.toggle("is-stuck", y > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const toggle = nav.querySelector(".nav__toggle");
    const menu = nav.querySelector(".nav__menu");
    if (toggle && menu) {
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        document.body.style.overflow = open ? "hidden" : "";
        if (lenis) open ? lenis.stop() : lenis.start();
      });
      menu.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          nav.classList.remove("is-open");
          document.body.style.overflow = "";
          if (lenis) lenis.start();
        })
      );
    }
  }

  /* --------------------------------------------------- Custom cursor */
  function initCursor() {
    if (!hasFinePointer || prefersReduced) return;
    const ring = document.querySelector(".cursor");
    const dot = document.querySelector(".cursor-dot");
    if (!ring || !dot) return;
    document.body.classList.add("has-cursor");
    let rx = window.innerWidth / 2, ry = window.innerHeight / 2, dx = rx, dy = ry;
    let tx = rx, ty = ry;
    window.addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    function loop() {
      rx += (tx - rx) * 0.14; ry += (ty - ry) * 0.14;
      dx += (tx - dx) * 0.35; dy += (ty - dy) * 0.35;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      dot.style.transform = `translate(${dx}px,${dy}px)`;
      requestAnimationFrame(loop);
    }
    loop();
    const label = ring.querySelector(".cursor__label");
    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        ring.classList.add("is-hover");
        if (label) label.textContent = el.getAttribute("data-cursor") || "";
      });
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
    document.querySelectorAll('a, button, .card, .filter').forEach((el) => {
      if (el.hasAttribute("data-cursor")) return;
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  }

  /* --------------------------------------------------- Scroll progress */
  function initProgress() {
    const bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      bar.style.transform = `scaleX(${p})`;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* --------------------------------------------------- Reveals */
  function initReveals() {
    const items = gsap.utils ? gsap.utils.toArray("[data-reveal]") : [];
    if (!gsapReady) {
      document.querySelectorAll("[data-reveal]").forEach((el) => (el.style.opacity = 1));
      return;
    }
    items.forEach((el) => {
      const type = el.getAttribute("data-reveal") || "up";
      const delay = parseFloat(el.getAttribute("data-delay") || "0");
      let from = { opacity: 0, y: 40 };
      if (type === "fade") from = { opacity: 0 };
      if (type === "left") from = { opacity: 0, x: -50 };
      if (type === "right") from = { opacity: 0, x: 50 };
      if (type === "scale") from = { opacity: 0, scale: 0.92 };
      if (type === "clip") from = { opacity: 1, clipPath: "inset(0 0 100% 0)" };
      gsap.fromTo(el, from, {
        opacity: 1, x: 0, y: 0, scale: 1, clipPath: "inset(0 0 0% 0)",
        duration: 1, ease: "power3.out", delay,
        scrollTrigger: { trigger: el, start: "top 85%" }
      });
    });

    // Staggered children
    gsap.utils.toArray("[data-stagger]").forEach((group) => {
      const kids = group.children;
      gsap.from(kids, {
        opacity: 0, y: 40, duration: 0.9, ease: "power3.out", stagger: 0.09,
        scrollTrigger: { trigger: group, start: "top 82%" }
      });
    });

    // Split-line headings
    gsap.utils.toArray("[data-splitlines] .line > span, [data-splitlines].line > span").forEach(() => {});
    gsap.utils.toArray("[data-splitlines]").forEach((h) => {
      const spans = h.querySelectorAll(".line > span");
      if (!spans.length) return;
      gsap.from(spans, {
        yPercent: 115, duration: 1.1, ease: "power4.out", stagger: 0.1,
        scrollTrigger: { trigger: h, start: "top 88%" }
      });
    });
  }

  /* --------------------------------------------------- Counters */
  function initCounters() {
    const nums = document.querySelectorAll("[data-count]");
    nums.forEach((el) => {
      const target = parseFloat(el.getAttribute("data-count"));
      const dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      const run = () => {
        if (el.dataset.done) return;
        el.dataset.done = "1";
        if (prefersReduced || !gsapReady) { el.textContent = target.toFixed(dec); return; }
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 2, ease: "power2.out",
          onUpdate() { el.textContent = obj.v.toFixed(dec); }
        });
      };
      if (gsapReady && window.ScrollTrigger) {
        ScrollTrigger.create({ trigger: el, start: "top 90%", onEnter: run });
      } else {
        run();
      }
    });
  }

  /* --------------------------------------------------- Hero slideshow + parallax */
  function initHero() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const slides = hero.querySelectorAll(".hero__slide");
    const cur = hero.querySelector("[data-slide-current]");
    const total = hero.querySelector("[data-slide-total]");
    if (total) total.textContent = String(slides.length).padStart(2, "0");
    let i = 0;
    if (slides.length) {
      slides[0].classList.add("is-active");
      if (gsapReady && !prefersReduced) gsap.to(slides[0], { scale: 1, duration: 7, ease: "none" });
      setInterval(() => {
        slides[i].classList.remove("is-active");
        if (gsapReady) gsap.set(slides[i], { scale: 1.12 });
        i = (i + 1) % slides.length;
        slides[i].classList.add("is-active");
        if (gsapReady && !prefersReduced) gsap.fromTo(slides[i], { scale: 1.12 }, { scale: 1, duration: 7, ease: "none" });
        if (cur) cur.textContent = String(i + 1).padStart(2, "0");
      }, 5000);
    }
    // hero canvas particles
    heroParticles(hero.querySelector(".hero__canvas"));
    // hero entrance
    if (gsapReady && !prefersReduced) {
      const tl = gsap.timeline({ delay: 0.1 });
      tl.from(".hero__eyebrow", { y: 20, opacity: 0, duration: 0.8, ease: "power3.out" })
        .from(".hero__title .line > span", { yPercent: 115, duration: 1.1, stagger: 0.12, ease: "power4.out" }, "-=0.4")
        .from(".hero__meta > *", { y: 30, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }, "-=0.5")
        .from(".hero__count, .hero__scroll", { opacity: 0, duration: 0.8 }, "-=0.6");
    }
  }

  function heroParticles(canvas) {
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext("2d");
    let w, h, pts;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * DPR; canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.min(70, Math.floor(w / 22));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.4
      }));
    }
    size();
    window.addEventListener("resize", size);
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let a = 0; a < pts.length; a++) {
        const p = pts[a];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(224,138,94,0.55)";
        ctx.fill();
        for (let b = a + 1; b < pts.length; b++) {
          const q = pts[b];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(193,85,44,${0.14 * (1 - dist / 120)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* --------------------------------------------------- Marquee */
  function initMarquee() {
    document.querySelectorAll(".marquee").forEach((m) => {
      const track = m.querySelector(".marquee__track");
      if (!track) return;
      // duplicate content for seamless loop
      track.innerHTML += track.innerHTML;
      if (prefersReduced || !gsapReady) return;
      const dir = m.getAttribute("data-dir") === "right" ? 1 : -1;
      const distance = track.scrollWidth / 2;
      let x = dir === -1 ? 0 : -distance;
      const speed = parseFloat(m.getAttribute("data-speed") || "0.5") * dir;
      function tick() {
        x += speed;
        if (dir === -1 && x <= -distance) x = 0;
        if (dir === 1 && x >= 0) x = -distance;
        track.style.transform = `translateX(${x}px)`;
        requestAnimationFrame(tick);
      }
      tick();
    });
  }

  /* --------------------------------------------------- Magnetic buttons */
  function initMagnetic() {
    if (!hasFinePointer || prefersReduced) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = parseFloat(el.getAttribute("data-magnetic") || "0.3");
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = "translate(0,0)"; });
    });
  }

  /* --------------------------------------------------- Card tilt + glow */
  function initTilt() {
    document.querySelectorAll("[data-tilt]").forEach((card) => {
      const img = card.querySelector(".card__img");
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        if (!hasFinePointer || prefersReduced) return;
        const rx = (0.5 - py) * 8;
        const ry = (px - 0.5) * 8;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
      });
    });
  }

  /* --------------------------------------------------- Portfolio filter + lightbox */
  function initPortfolio() {
    const filters = document.querySelectorAll("[data-filter]");
    const cards = Array.from(document.querySelectorAll("[data-cat]"));
    const grid = document.querySelector("[data-cards]");

    function applyFilter(key) {
      cards.forEach((card) => {
        const match = key === "all" || card.getAttribute("data-cat") === key;
        card.classList.toggle("is-hidden", !match);
      });
      if (gsapReady && !prefersReduced) {
        const visible = cards.filter((c) => !c.classList.contains("is-hidden"));
        gsap.fromTo(visible, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.05 });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      }
    }

    filters.forEach((f) => {
      f.addEventListener("click", () => {
        filters.forEach((x) => x.classList.remove("is-active"));
        f.classList.add("is-active");
        applyFilter(f.getAttribute("data-filter"));
      });
    });

    // Category blocks scroll to grid + set filter
    document.querySelectorAll("[data-jump]").forEach((block) => {
      block.addEventListener("click", (e) => {
        e.preventDefault();
        const key = block.getAttribute("data-jump");
        const btn = document.querySelector(`[data-filter="${key}"]`);
        if (btn) btn.click();
        if (grid) {
          if (lenis) lenis.scrollTo(grid, { offset: -100 });
          else grid.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
        }
      });
    });

    // Lightbox
    const lb = document.querySelector(".lightbox");
    if (!lb) return;
    const media = lb.querySelector(".lightbox__media");
    const cat = lb.querySelector(".lightbox__cat");
    const title = lb.querySelector(".lightbox__title");
    const desc = lb.querySelector(".lightbox__desc");
    const mLoc = lb.querySelector("[data-lb='location']");
    const mYear = lb.querySelector("[data-lb='year']");
    const mType = lb.querySelector("[data-lb='type']");
    const mStatus = lb.querySelector("[data-lb='status']");

    function open(card) {
      const d = card.dataset;
      if (media) media.style.backgroundImage = `url('${d.img}')`;
      if (cat) cat.textContent = d.catLabel || "";
      if (title) title.textContent = d.title || "";
      if (desc) desc.textContent = d.desc || "";
      if (mLoc) mLoc.textContent = d.location || "—";
      if (mYear) mYear.textContent = d.year || "—";
      if (mType) mType.textContent = d.type || "—";
      if (mStatus) mStatus.textContent = d.status || "—";
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
    }
    function close() {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lenis) lenis.start();
    }
    cards.forEach((card) => card.addEventListener("click", () => open(card)));
    lb.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* --------------------------------------------------- Parallax images */
  function initParallax() {
    if (!gsapReady || prefersReduced) return;
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.getAttribute("data-parallax") || "12");
      gsap.fromTo(el, { yPercent: -amt }, {
        yPercent: amt, ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  }

  /* --------------------------------------------------- Contact form (front-end only) */
  function initForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = form.querySelector(".form__success");
      const btn = form.querySelector("button[type=submit]");
      if (btn) { btn.querySelector(".btn__label").textContent = "Sent"; }
      if (ok) ok.classList.add("show");
      if (gsapReady) gsap.fromTo(ok, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 });
      form.querySelectorAll("input, textarea, select").forEach((f) => (f.value = ""));
    });
  }

  /* --------------------------------------------------- Footer year */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* --------------------------------------------------- Boot */
  window.addEventListener("DOMContentLoaded", () => {
    initYear();
    preloader().then(() => {
      initSmoothScroll();
      initHero();
      if (gsapReady) { initReveals(); initCounters(); initParallax(); }
      else document.querySelectorAll("[data-reveal]").forEach((el) => (el.style.opacity = 1));
      initMarquee();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    initNav();
    initCursor();
    initProgress();
    initMagnetic();
    initTilt();
    initPortfolio();
    initForm();
  });

  window.addEventListener("load", () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); });
})();
