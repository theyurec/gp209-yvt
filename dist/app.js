const REPORT_COUNT = 14;
const SLIDE_COUNT = 35;
let currentSlide = 1;
let viewer = sessionStorage.getItem('uvt-viewer') || '';

const reportPages = document.getElementById('report-pages');
for (let n = 1; n <= REPORT_COUNT; n += 1) {
  const page = document.createElement('figure');
  page.className = 'report-page';
  page.dataset.page = n;
  page.innerHTML = `<img loading="${n < 3 ? 'eager' : 'lazy'}" src="./assets/report/page-${String(n).padStart(2, '0')}.webp" alt="Страница ${n} доклада"><figcaption class="page-label">${n}</figcaption>`;
  reportPages.append(page);
}

const slideStrip = document.getElementById('slide-strip');
for (let n = 1; n <= SLIDE_COUNT; n += 1) {
  const button = document.createElement('button');
  button.className = `slide-thumb${n === 1 ? ' active' : ''}`;
  button.dataset.slide = n;
  button.setAttribute('aria-label', `Открыть слайд ${n}`);
  button.innerHTML = `<img loading="lazy" src="./assets/slides/slide-${String(n).padStart(2, '0')}.webp" alt=""><span>${n}</span>`;
  slideStrip.append(button);
}

function safeText(value) {
  return value.replace(/[<>"'&]/g, '').trim().slice(0, 80);
}

function watermarkSvg(name) {
  const line = encodeURIComponent(`${name} · ДЕМО · ${new Date().toLocaleDateString('ru-RU')}`);
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='180'%3E%3Ctext x='24' y='100' transform='rotate(-22 24 100)' font-family='Arial' font-size='17' font-weight='700' fill='%23101a33'%3E${line}%3C/text%3E%3C/svg%3E")`;
}

function applyViewer(name) {
  viewer = safeText(name) || 'Гость';
  sessionStorage.setItem('uvt-viewer', viewer);
  document.querySelectorAll('.report-page').forEach((page) => {
    if (!page.querySelector('.live-watermark')) {
      page.insertAdjacentHTML('beforeend', '<div class="live-watermark" aria-hidden="true"></div>');
    }
  });
  document.querySelectorAll('.live-watermark').forEach((mark) => { mark.style.backgroundImage = watermarkSvg(viewer); });
  document.getElementById('identity-modal').classList.add('hidden');
}

document.getElementById('identity-form').addEventListener('submit', (event) => {
  event.preventDefault();
  applyViewer(document.getElementById('viewer-name').value);
});
if (viewer) applyViewer(viewer);

document.querySelectorAll('.file-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.file-tab').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.viewer-view').forEach((view) => view.classList.remove('active'));
    document.getElementById(`${tab.dataset.view}-view`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
});

function showSlide(number) {
  currentSlide = Math.max(1, Math.min(SLIDE_COUNT, number));
  const main = document.getElementById('main-slide');
  main.src = `./assets/slides/slide-${String(currentSlide).padStart(2, '0')}.webp`;
  main.alt = `Слайд ${currentSlide}`;
  document.getElementById('slide-counter').textContent = `Слайд ${currentSlide} из ${SLIDE_COUNT}`;
  document.querySelectorAll('.slide-thumb').forEach((thumb) => thumb.classList.toggle('active', Number(thumb.dataset.slide) === currentSlide));
  document.querySelector('.slide-thumb.active')?.scrollIntoView({ block: 'nearest' });
}

slideStrip.addEventListener('click', (event) => {
  const thumb = event.target.closest('.slide-thumb');
  if (thumb) showSlide(Number(thumb.dataset.slide));
});
document.getElementById('prev-slide').addEventListener('click', () => showSlide(currentSlide - 1));
document.getElementById('next-slide').addEventListener('click', () => showSlide(currentSlide + 1));
document.getElementById('fullscreen').addEventListener('click', async () => {
  const stage = document.getElementById('slide-stage');
  try { await stage.requestFullscreen(); } catch { document.body.classList.toggle('presentation-mode'); }
});
document.addEventListener('fullscreenchange', () => document.body.classList.toggle('presentation-mode', Boolean(document.fullscreenElement)));
document.addEventListener('keydown', (event) => {
  const slidesActive = document.getElementById('slides-view').classList.contains('active');
  if (slidesActive && ['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); showSlide(currentSlide + 1); }
  if (slidesActive && ['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); showSlide(currentSlide - 1); }
  if ((event.ctrlKey || event.metaKey) && ['c', 's', 'p', 'u'].includes(event.key.toLowerCase())) { event.preventDefault(); showToast(); }
});

function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
['copy', 'cut', 'contextmenu', 'dragstart'].forEach((name) => document.addEventListener(name, (event) => { event.preventDefault(); showToast(); }));

const observer = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visible) document.getElementById('report-position').textContent = `Страница ${visible.target.dataset.page} из ${REPORT_COUNT}`;
}, { threshold: [0.2, 0.5, 0.8] });
document.querySelectorAll('.report-page').forEach((page) => observer.observe(page));
