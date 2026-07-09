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
  const railWrap = document.querySelector('[data-rail-wrap]');
  const trackEl = document.querySelector('.projects-track');
  const ctaEl = document.getElementById('contact');
  const names = railItems.map(item => item.textContent.trim());

  let activeIndex = -1;
  let ticking = false;
  let railLocked = false;
  let snapTimer = null;

  // CSS scroll-snap with `proximity` only pulls toward a slide — it won't
  // force a rest position, so momentum can run out with two slides half
  // in frame. Once scrolling has been idle for a moment, nudge to the
  // nearest slide's center if it isn't already there.
  function scheduleSnap(index) {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const slide = slides[index];
      const rect = slide.getBoundingClientRect();
      const target = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      if (Math.abs(target - viewportCenter) > 12) {
        slide.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 140);
  }

  function resetGallery(slide) {
    const gallery = slide.querySelector('.project-gallery');
    if (gallery && gallery.resetGallery) gallery.resetGallery();
    const overlayCard = slide.querySelector('.project-card--overlay');
    if (overlayCard && overlayCard.resetPanelVisibility) overlayCard.resetPanelVisibility();
  }

  function setActive(index) {
    if (index === activeIndex) return;
    const previous = activeIndex;
    activeIndex = index;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
    railItems.forEach((r, i) => r.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    if (mobileLabel && names[index]) mobileLabel.textContent = names[index];
    if (previous >= 0 && previous !== index) resetGallery(slides[previous]);
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

    if (railWrap) {
      const railOpacity = Math.max(0, 1 - closestDist / (window.innerHeight * 0.6));
      railWrap.style.opacity = railOpacity.toFixed(3);
      railWrap.style.pointerEvents = railOpacity > 0.4 ? 'auto' : 'none';

      // Track the first card's own center while it's still scrolling into
      // view; once it's fully inside the viewport, latch to dead-center and
      // stay there through every later project. Unlatches (and resumes
      // tracking the card's real position) only at the two ends: scrolling
      // back above the first project, or the last project exiting past
      // center on the way out — so it travels in with Career-Tracker and
      // back out with WS-PASS instead of just fading in place at the end.
      // Computed by hand since position:fixed needs a plain
      // viewport-relative `top` and doesn't otherwise track scroll.
      const activeCard = slides[closestIndex].querySelector('.project-card');
      if (activeCard) {
        const cardRect = activeCard.getBoundingClientRect();
        const lockY = window.innerHeight / 2;
        const fullyInFrame = cardRect.top >= 0 && cardRect.bottom <= window.innerHeight;
        const lastIndex = slides.length - 1;

        if (fullyInFrame) railLocked = true;
        else if (closestIndex === 0 && cardRect.top > lockY) railLocked = false;
        else if (closestIndex === lastIndex && cardRect.top < 0) railLocked = false;

        const targetY = railLocked ? lockY : cardRect.top + cardRect.height / 2;
        railWrap.style.top = `${targetY}px`;
      }
    }

    // Only correct-snap when the viewport's center is actually inside the
    // track's own bounds — otherwise reading the About section or the
    // footer gets yanked into a project the instant scrolling pauses,
    // since some slide is always "closest" even from far away. The CTA
    // section is short enough that its top can already be on screen while
    // the viewport's center is still technically over the track's tail
    // end, so also bail out once the Contact section starts coming into
    // view at all.
    //
    // Career-Tracker/WS-PASS only skip the forced snap on first arrival
    // (before `railLocked` has ever engaged this trip) — once you're
    // genuinely navigating within the carousel (e.g. back up from MicroFlix,
    // or down from Circle Accountability), snapping onto them works
    // normally, since `railLocked` is already true by then.
    const trackRect = trackEl ? trackEl.getBoundingClientRect() : null;
    const insideTrack = trackRect && trackRect.top < viewportCenter && trackRect.bottom > viewportCenter;
    const ctaShowing = ctaEl && ctaEl.getBoundingClientRect().top < window.innerHeight * 0.9;
    const isEndSlide = closestIndex === 0 || closestIndex === slides.length - 1;
    const blockEndSnap = isEndSlide && !railLocked;
    if (insideTrack && !ctaShowing && !blockEndSnap && closestDist < window.innerHeight * 0.5) {
      scheduleSnap(closestIndex);
    } else {
      clearTimeout(snapTimer);
    }
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
    const prevBtn = gallery.querySelector('[data-gallery-prev]');
    const nextBtn = gallery.querySelector('[data-gallery-next]');

    function render() {
      images.forEach((img, i) => img.classList.toggle('active', i === index));
    }

    if (prevBtn) prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      index = (index - 1 + images.length) % images.length;
      render();
    });
    if (nextBtn) nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      index = (index + 1) % images.length;
      render();
    });

    gallery.resetGallery = () => {
      if (index !== 0) { index = 0; render(); }
    };

    render();
  });
}

function initOverlayToggles() {
  document.querySelectorAll('.project-card--overlay').forEach(card => {
    const btn = card.querySelector('[data-overlay-toggle]');
    if (!btn) return;

    function setHidden(hidden) {
      card.classList.toggle('panel-hidden', hidden);
      btn.setAttribute('aria-pressed', hidden ? 'true' : 'false');
      btn.setAttribute('aria-label', hidden ? 'Show project details' : 'Hide project details');
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setHidden(!card.classList.contains('panel-hidden'));
    });

    card.resetPanelVisibility = () => setHidden(false);
  });
}

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  const SHOW_AFTER = 500;
  let ticking = false;

  function update() {
    ticking = false;
    btn.classList.toggle('visible', window.scrollY > SHOW_AFTER);
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFadeIns();
  initAnchorFix();
  initActiveNav();
  initProjectsCarousel();
  initProjectGalleries();
  initOverlayToggles();
  initBackToTop();
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
});