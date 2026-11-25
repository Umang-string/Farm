(() => {
  const categories = document.querySelector('#products');
  const detail = categories.querySelector('.category-detail');
  const art = detail.querySelector('.category-detail-art');
  const title = detail.querySelector('#category-title');
  const story = detail.querySelector('#category-story');
  const panel = categories.querySelector('.products-panel');
  const lineup = categories.querySelector('.category-lineup');
  const controls = categories.querySelector('.category-controls');
  const previous = controls.querySelector('.category-prev');
  const next = controls.querySelector('.category-next');
  const viewAll = controls.querySelector('.category-view-all');
  const catalog = categories.querySelector('#full-catalog');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const settleSpace = 96;
  let scrollShowcaseComplete = false;
  let travel = 0;
  let pinnedTop = 0;
  let target = 0;
  let position = 0;
  let frame;
  let lastFrameTime;

  function scrollProgress() {
    return pinnedTop - categories.getBoundingClientRect().top;
  }

  function renderLineup(time) {
    frame = undefined;
    const progress = scrollProgress();
    const elapsed = Math.max(0, Math.min(time - lastFrameTime, 50));
    lastFrameTime = time;

    if (progress <= 0 || progress >= travel + settleSpace || Math.abs(target - position) < 1) {
      position = target;
    } else {
      position += (target - position) * (1 - Math.exp(-elapsed / 70));
      frame = requestAnimationFrame(renderLineup);
    }
    lineup.scrollLeft = position;
  }

  function updateControls() {
    previous.disabled = lineup.scrollLeft <= 1;
    next.disabled = lineup.scrollLeft + lineup.clientWidth >= lineup.scrollWidth - 1;
  }

  function moveLineup(direction) {
    const [first, second] = lineup.children;
    const step = second.offsetLeft - first.offsetLeft;
    const visibleSteps = Math.max(1, Math.floor(lineup.clientWidth / step) - 1);
    const distance = direction * step * visibleSteps;
    const behavior = reducedMotion.matches ? 'instant' : 'smooth';
    const progress = scrollProgress();
    const panelIsVisible = panel.getBoundingClientRect().bottom <= window.innerHeight + 1;
    if (travel && panelIsVisible && progress <= travel + settleSpace + 1) {
      const destination = Math.min(travel, Math.max(0, lineup.scrollLeft + distance));
      window.scrollBy({ top: destination - progress, behavior });
    } else {
      lineup.scrollBy({ left: distance, behavior });
    }
  }

  function measureLineup() {
    const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--masthead-height')) || 0;
    pinnedTop = Math.min(headerHeight, window.innerHeight - panel.offsetHeight);
    categories.style.setProperty('--category-pin-top', pinnedTop + 'px');
    const overflow = lineup.scrollWidth - lineup.clientWidth;
    const lineupTop = lineup.getBoundingClientRect().top - panel.getBoundingClientRect().top;
    // On phones, leave horizontal browsing to the swipeable row.
    const canPin = panel.clientWidth > 700 && (pinnedTop >= headerHeight - 1 ||
      (window.innerWidth >= 1024 && pinnedTop + lineupTop >= headerHeight));
    travel = !scrollShowcaseComplete && !reducedMotion.matches && canPin && overflow > 1 ? overflow : 0;
    categories.style.setProperty('--category-travel', (travel ? travel + settleSpace : 0) + 'px');
    categories.classList.toggle('is-scroll-pinned', travel > 0);
    cancelAnimationFrame(frame);
    frame = undefined;
    target = Math.min(travel, Math.max(0, scrollProgress()));
    if (travel) lineup.scrollLeft = target;
    updateControls();
  }

  function completeScrollShowcase() {
    const previousBottom = categories.getBoundingClientRect().bottom;
    lineup.scrollLeft = travel;
    scrollShowcaseComplete = true;
    measureLineup();

    // Hold the next section in place while removing the extra scroll distance.
    const shift = categories.getBoundingClientRect().bottom - previousBottom;
    const scrollTop = window.scrollY + shift;
    if (shift) window.scrollTo({ top: scrollTop, behavior: 'instant' });
    window.dispatchEvent(new CustomEvent('scroll-position-adjusted', { detail: scrollTop }));
  }

  previous.addEventListener('click', () => moveLineup(-1));
  next.addEventListener('click', () => moveLineup(1));
  viewAll.addEventListener('click', () => catalog.showModal());
  viewAll.hidden = false;
  lineup.addEventListener('scroll', updateControls, { passive: true });
  window.addEventListener('scroll', () => {
    if (!travel) return;

    const progress = scrollProgress();
    if (progress >= travel + settleSpace) {
      completeScrollShowcase();
      return;
    }

    const destination = Math.min(travel, Math.max(0, progress));
    if (destination === target) return;
    target = destination;
    if (frame !== undefined) return;

    position = lineup.scrollLeft;
    lastFrameTime = performance.now();
    frame = requestAnimationFrame(renderLineup);
  }, { passive: true });
  window.addEventListener('resize', measureLineup);
  reducedMotion.addEventListener('change', measureLineup);
  previous.hidden = false;
  next.hidden = false;
  new ResizeObserver(measureLineup).observe(panel);
  measureLineup();

  const retailerButtons = categories.querySelectorAll('.product-retailer-buttons button');
  retailerButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const select = button.getAttribute('aria-pressed') === 'false';
      retailerButtons.forEach((retailer) => {
        retailer.setAttribute('aria-pressed', String(select && retailer === button));
      });
    });
  });

  categories.querySelectorAll('.category-card').forEach((card) => {
    card.addEventListener('click', () => {
      art.src = card.querySelector('img').src;
      art.style.setProperty('--category-paper', getComputedStyle(card).getPropertyValue('--category-paper'));
      title.textContent = card.querySelector('.category-name').textContent;
      story.textContent = card.dataset.story;
      detail.showModal();
    });
  });
})();
