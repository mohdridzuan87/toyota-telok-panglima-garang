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

    /* Halaman bertindan: setiap seksyen jadi "halaman"; halaman seterusnya meluncur naik menutup halaman semasa,
       yang kekal di tempat & menjadi gelap. Seksyen lebih tinggi daripada skrin diskrol habis dahulu (pin pada bawah).
       pinSpacing:false = tinggi dokumen & pautan menu (#kalkulator dll.) tidak berubah. */
    ScrollTrigger.config({ ignoreMobileResize: true });
    const all = [...document.querySelectorAll("main > section, footer.foot")];
    all.forEach((s, i) => { s.classList.add("panel"); s.style.zIndex = String(i + 1); });
    const panels = all.filter(s => !s.classList.contains("trust")); // jalur trust terlalu nipis untuk dipin; ia meluncur bersama
    // Tinggi sebenar kandungan (bukan tinggi tetap yang GSAP letak semasa dipin)
    const contentH = p => Math.max(p.scrollHeight, [...p.children].reduce((a, c) => a + c.offsetHeight, 0));
    // Bila kandungan halaman berubah tinggi (buka jawapan FAQ, keputusan kuiz, langkah lain), kira semula pin:
    // halaman yang kini lebih tinggi daripada skrin akan diskrol habis dahulu sebelum halaman seterusnya menutupnya
    let roT, lastH = new Map();
    const ro = new ResizeObserver(() => {
      clearTimeout(roT);
      roT = setTimeout(() => {
        const changed = panels.some(p => { const h = contentH(p); const c = Math.abs(h - (lastH.get(p) || h)) > 4; lastH.set(p, h); return c; });
        if (changed) ScrollTrigger.refresh();
      }, 120);
    });
    panels.forEach(p => { lastH.set(p, contentH(p)); [...p.children].forEach(c => ro.observe(c)); });
    document.querySelectorAll(".faq details").forEach(d => d.addEventListener("toggle", () => setTimeout(() => ScrollTrigger.refresh(), 60)));
    panels.forEach((p, i) => {
      const next = panels[i + 1]; if (!next) return;
      const cover = all[all.indexOf(p) + 1];
      ScrollTrigger.create({ trigger: p, start: () => (contentH(p) <= innerHeight ? "top top" : "bottom bottom"),
        endTrigger: next, end: "top top", pin: true, pinSpacing: false, anticipatePin: 1, invalidateOnRefresh: true });
      gsap.fromTo(p, { "--dim": 0 }, { "--dim": 0.62, ease: "none",
        scrollTrigger: { trigger: cover, start: "top bottom", endTrigger: next, end: "top top", scrub: true, invalidateOnRefresh: true } });
    });

    /* Hero: semasa halaman seterusnya menutup, teks naik & pudar, kereta membesar */
    const heroTl = gsap.timeline({
      scrollTrigger: { trigger: all[1], start: "top bottom", endTrigger: panels[1], end: "top top", scrub: 0.6, invalidateOnRefresh: true }
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
    return () => { ro.disconnect(); bar.remove(); clearInterval(timer); clearInterval(sync); removeEventListener("scroll", onScroll); gsap.set([...document.querySelectorAll(blocks + ",.w > span")], { clearProps: "all" }); };
  });
})();
