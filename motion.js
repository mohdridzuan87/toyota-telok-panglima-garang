// Kesan skrol ala apple.com dengan GSAP ScrollTrigger.
// Kandungan sentiasa kelihatan tanpa JS; jika GSAP gagal dimuat, laman kekal statik.
(() => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  gsap.ticker.lagSmoothing(0); // ikut masa sebenar: animasi tetap siap tepat masa walaupun peranti perlahan
  document.documentElement.classList.add("gsap");

  // Pecah tajuk kepada perkataan (kekalkan <b>) untuk animasi naik satu demi satu
  const splitWords = el => {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span"); w.className = "w";
            const i = document.createElement("span"); i.textContent = part; w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) walk(n);
      });
    };
    walk(el);
    return el.querySelectorAll(".w > span");
  };

  const mm = gsap.matchMedia();
  mm.add({ motion: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 981px)" }, ctx => {
    const { motion, desktop } = ctx.conditions;
    if (!motion) return;

    /* Bar kemajuan merah di bawah header */
    const bar = document.createElement("div"); bar.className = "scroll-progress"; document.body.appendChild(bar);
    gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });

    /* Hero: masuk semasa buka laman */
    gsap.from(".hero-copy > *", { y: 40, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 });
    gsap.from(".strip > *", { y: 20, opacity: 0, duration: 0.7, ease: "power2.out", stagger: 0.06, delay: 0.5 });

    /* Hero: bila skrol, teks naik & pudar, kereta membesar (desktop: hero dipin seketika) */
    const heroTl = gsap.timeline({
      scrollTrigger: desktop
        ? { trigger: ".hero", start: "top top", end: "+=70%", pin: true, scrub: 0.6, anticipatePin: 1 }
        : { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 }
    });
    heroTl.to(".hero-copy", { y: -110, opacity: 0, ease: "none" }, 0)
      .to(".hero-car", { scale: desktop ? 1.35 : 1.15, xPercent: desktop ? -18 : -6, ease: "none" }, 0)
      .to(".strip", { opacity: 0, y: -30, ease: "none" }, 0)
      .to(".hero-bg", { opacity: 0.4, ease: "none" }, 0);

    /* Pendedahan kandungan: semakan kedudukan sendiri (bukan ScrollTrigger), dijalankan semasa skrol
       DAN setiap 0.5 s, supaya tiada kandungan tertinggal tersembunyi. Elemen yang sudah kelihatan semasa
       laman dibuka tidak disembunyikan langsung. */
    const below = el => el.getBoundingClientRect().top > innerHeight * 0.92;
    const pending = [];
    document.querySelectorAll(".sec h2").forEach(h => {
      const words = splitWords(h);
      if (below(h)) { gsap.set(words, { yPercent: 110, opacity: 0 }); pending.push({ el: h, play: () => gsap.to(words, { yPercent: 0, opacity: 1, duration: 0.9, ease: "power4.out", stagger: 0.045, overwrite: true }) }); }
    });
    const blocks = ".sec .eyebrow,.sec .sub,.trust-item,.tabs,.quiz .q,.pick,.check-card,.step-list li,.step-detail,.faq details,.addr,.map,.calc-in > *,.foot-top,.stage";
    document.querySelectorAll(blocks).forEach(el => {
      if (below(el)) { gsap.set(el, { opacity: 0, y: 44 }); pending.push({ el, play: i => gsap.to(el, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", delay: i * 0.07, overwrite: true }) }); }
    });
    let n = 0;
    const check = () => {
      let i = 0;
      for (let k = pending.length - 1; k >= 0; k--) {
        const p = pending[k];
        if (p.el.getBoundingClientRect().top < innerHeight * 0.92) { pending.splice(k, 1); p.play(Math.min(i++, 6)); }
      }
      if (!pending.length) { clearInterval(timer); removeEventListener("scroll", onScroll); }
    };
    const onScroll = () => { if (!n) n = requestAnimationFrame(() => { n = 0; check(); }); };
    addEventListener("scroll", onScroll, { passive: true });
    const timer = setInterval(check, 500);
    const sync = setInterval(() => ScrollTrigger.update(), 500); // jaga scrub selari walaupun peristiwa skrol terlepas

    /* Pentas model: kad naik, kereta meluncur dari kanan (ikut skrol) */
    gsap.fromTo(".stage-car", { xPercent: 16, scale: 0.88 }, { xPercent: 0, scale: 1, ease: "none", scrollTrigger: { trigger: ".stage", start: "top 85%", end: "top 25%", scrub: 0.6 } });

    /* Panel ansuran gelap: zum masuk */
    gsap.fromTo(".calc-out", { scale: 0.92 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".calc", start: "top 85%", end: "top 40%", scrub: 0.5 } });

    /* Parallax ringan pada imej */
    gsap.fromTo(".map", { yPercent: 6 }, { yPercent: -6, ease: "none", scrollTrigger: { trigger: "#lokasi", start: "top bottom", end: "bottom top", scrub: true } });

    // Kandungan dinamik (cadangan kuiz) & imej lewat dimuat: kira semula kedudukan
    window.addEventListener("load", () => ScrollTrigger.refresh());
    return () => { bar.remove(); clearInterval(timer); clearInterval(sync); removeEventListener("scroll", onScroll); gsap.set([...document.querySelectorAll(blocks + ",.w > span")], { clearProps: "all" }); };
  });
})();
