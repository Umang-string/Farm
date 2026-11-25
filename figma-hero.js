(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rotationDelay = 10_000;

  function setupCarousel(slides, { choices, observe } = {}) {
    const buttons = choices ? [...choices.querySelectorAll('button')] : [];
    let activeIndex = 0;
    let inView = !observe;
    let rotationTimer;

    function showSlide(index) {
      activeIndex = index;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        buttons[slideIndex]?.setAttribute('aria-pressed', String(active));
      });
      scheduleRotation();
    }

    function scheduleRotation() {
      window.clearTimeout(rotationTimer);
      if (!inView || reducedMotion.matches || document.hidden) return;

      rotationTimer = window.setTimeout(() => {
        showSlide((activeIndex + 1) % slides.length);
      }, rotationDelay);
    }

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => showSlide(index));
    });
    if (choices) choices.hidden = false;
    if (observe) {
      const visibleThreshold = 0.5;
      new IntersectionObserver(([entry]) => {
        inView = entry.intersectionRatio >= visibleThreshold;
        scheduleRotation();
      }, { threshold: visibleThreshold }).observe(observe);
    }
    reducedMotion.addEventListener('change', scheduleRotation);
    document.addEventListener('visibilitychange', scheduleRotation);
    scheduleRotation();
  }

  const hero = document.querySelector('.hero-carousel');
  setupCarousel(hero.querySelectorAll('.hero'), { choices: hero.querySelector('.hero-choices') });

  const promo = document.querySelector('.promo-pack');
  setupCarousel(promo.querySelectorAll('.promo-slide'), { observe: promo });
})();
