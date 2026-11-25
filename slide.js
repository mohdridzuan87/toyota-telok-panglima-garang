// Seksyen meluncur MENDATAR ikut skrol (Wan, 25 Nov 2026): berselang kiri->kanan, kanan->kiri.
// Untuk gaya Stripe, Apple & Racing. Gaya asal (GSAP) buat kesan sama dalam motion.js.
// Hero & jalur model bergerak tidak diluncur. Tanpa JS / reduced motion: tiada kesan.
(() => {
  const root = document.documentElement;
  if (!root.matches(".theme-stripe,.theme-apple,.theme-racing")) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // ambil selepas skrip tema lain menambah seksyen (Apple "Lihat lebih dekat", jalur petikan Racing)
  const items = [...document.querySelectorAll("main > section")]
    .filter(s => !s.matches(".hero, .marquee"))
    .map((el, i) => ({ el, dir: i % 2 ? 1 : -1, done: false })); // genap: dari kiri; ganjil: dari kanan
  if (!items.length) return;
  const ease = t => 1 - Math.pow(1 - t, 3);
  let raf = 0;
  const frame = () => {
    raf = 0; const vh = innerHeight;
    for (const it of items) {
      const top = it.el.getBoundingClientRect().top;
      // mula bila bucu atas seksyen di bawah skrin, siap bila sampai 20% dari atas skrin
      const p = Math.min(1, Math.max(0, (vh - top) / (vh * 0.8)));
      if (p >= 1) { if (!it.done) { it.el.style.transform = ""; it.el.style.opacity = ""; it.done = true; } continue; }
      it.done = false;
      const e = ease(p);
      it.el.style.transform = `translate3d(${(it.dir * (1 - e) * 100).toFixed(2)}vw,0,0)`;
      it.el.style.opacity = (0.35 + 0.65 * e).toFixed(3);
    }
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(frame); }, { passive: true });
  addEventListener("resize", frame);
  frame();
})();
