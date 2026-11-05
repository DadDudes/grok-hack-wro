(() => {
  const book = document.querySelector('.book');
  const d = book ? book.dataset : {};
  if (window.lucide) window.lucide.createIcons();
  const pages = [...document.querySelectorAll('section.page')];
  pages.forEach((p) => {
    if (p.classList.contains('nofoot')) return;
    const f = document.createElement('footer');
    f.className = 'pf';
    f.innerHTML = `<span>${d.product || ''} · ${d.doc || 'Brand Guidelines'} ${d.version || ''}</span><span class="mid">${d.credit || ('Concept and design by ' + (d.author || 'Bart Szczepanski'))} © ${d.year || new Date().getFullYear()}</span><span class="no"></span>`;
    p.appendChild(f);
  });
  document.querySelectorAll('[data-goto]').forEach((el) => {
    const i = pages.findIndex((p) => p.dataset.sec === el.dataset.goto);
    if (i >= 0) el.textContent = String(i + 1).padStart(2, '0');
  });
  document.querySelectorAll('.bleed .img').forEach((el) => {
    const url = getComputedStyle(el).backgroundImage.match(/url\("?(.*?)"?\)/);
    if (!url) return;
    const probe = new Image();
    probe.onload = () => { const w = el.querySelector('.wait'); if (w) w.remove(); };
    probe.src = url[1];
  });
  const fit = () => document.documentElement.style.setProperty('--z', Math.min(1, (window.innerWidth - 48) / 1600));
  fit();
  window.addEventListener('resize', fit);
})();
