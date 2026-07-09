/* ============================================
   KASHAWN BROWN — PORTFOLIO · script.js
   ============================================ */

const THEME_KEY = 'kb-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '◐ Dark' : '◑ Light';
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

function initFadeIns() {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    }),
    { threshold: 0.07 }
  );
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function initAnchorFix() {
  const NAV_HEIGHT = 52;
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

function initActiveNav() {
  const sections = document.querySelectorAll('[data-section]');
  const navLinks = document.querySelectorAll('nav .nav-links a');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(a => a.classList.remove('active'));
          const id = entry.target.getAttribute('data-section');
          const active = document.querySelector(`nav .nav-links a[href="#${id}"]`);
          if (active) active.classList.add('active');
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );
  sections.forEach(s => observer.observe(s));
}

function initProjectsCarousel() {
  const slides = Array.from(document.querySelectorAll('.project-slide'));
  if (!slides.length) return;

  const railItems = Array.from(document.querySelectorAll('.rail-item'));
  const dots = Array.from(document.querySelectorAll('.dot'));
  const mobileLabel = document.querySelector('[data-mobile-label]');
  const names = railItems.map(item => item.textContent.trim());

  let activeIndex = -1;
  let ticking = false;

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
    railItems.forEach((r, i) => r.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    if (mobileLabel && names[index]) mobileLabel.textContent = names[index];
  }

  function update() {
    ticking = false;
    const viewportCenter = window.innerHeight / 2;
    const falloff = window.innerHeight * 0.7;
    let closestIndex = 0;
    let closestDist = Infinity;

    slides.forEach((slide, i) => {
      const rect = slide.getBoundingClientRect();
      const slideCenter = rect.top + rect.height / 2;
      const dist = Math.abs(slideCenter - viewportCenter);
      const norm = Math.min(dist / falloff, 1);

      slide.style.opacity = (1 - norm * 0.72).toFixed(3);
      slide.style.transform = `scale(${(1 - norm * 0.1).toFixed(3)})`;
      slide.style.filter = `blur(${(norm * 2).toFixed(2)}px)`;

      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });

    setActive(closestIndex);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function jumpTo(index) {
    const target = slides[index];
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  [...railItems, ...dots].forEach(el => {
    el.addEventListener('click', () => {
      const index = parseInt(el.dataset.target, 10);
      if (!Number.isNaN(index)) jumpTo(index);
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function initProjectGalleries() {
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const images = Array.from(gallery.querySelectorAll('.gallery-image'));
    if (images.length <= 1) return;

    let index = Math.max(images.findIndex(img => img.classList.contains('active')), 0);

    function show(newIndex) {
      images[index].classList.remove('active');
      index = (newIndex + images.length) % images.length;
      images[index].classList.add('active');
    }

    const prevBtn = gallery.querySelector('[data-gallery-prev]');
    const nextBtn = gallery.querySelector('[data-gallery-next]');
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); show(index - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); show(index + 1); });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFadeIns();
  initAnchorFix();
  initActiveNav();
  initProjectsCarousel();
  initProjectGalleries();
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
});