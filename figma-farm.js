(() => {
  const farm = document.querySelector('#farm');
  const collage = farm.querySelector('.farm-art');
  const image = collage.querySelector('.farm-art-source');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const precisePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      farm.classList.add('is-in-view');
      observer.disconnect();
    }
  }, { threshold: .05 });
  farm.classList.add('has-scroll-reveal');
  observer.observe(farm.querySelector('.farm-layout'));

  // Keep the original image in the layout and expose its alt text only once.
  // Each decorative window samples one photograph from that same cached image.
  function prepareTiles() {
    if (!image.naturalWidth) return;
    collage.style.setProperty('--collage-image', 'url("' + image.currentSrc + '")');
    for (const part of ['worker', 'herd', 'market']) {
      const tile = document.createElement('span');
      tile.className = 'farm-photo farm-photo-' + part;
      tile.setAttribute('aria-hidden', 'true');
      collage.append(tile);
    }
    collage.classList.add('is-tracking');
    schedule();
  }

  let visible = false;
  let pointer = null;
  let frame = 0;
  const clamp = value => Math.max(-1, Math.min(1, value));

  function render() {
    frame = 0;
    if (!visible || reduced.matches) return;
    const box = collage.getBoundingClientRect();
    const height = document.documentElement.clientHeight;
    const scroll = clamp((height - box.height - 2 * box.top) / (height + box.height));
    const over = pointer && precisePointer.matches &&
      pointer.x >= box.left && pointer.x <= box.right && pointer.y >= box.top && pointer.y <= box.bottom;
    collage.style.setProperty('--scroll-y', scroll.toFixed(4));
    collage.style.setProperty('--pointer-x', over ? clamp(2 * (pointer.x - box.left) / box.width - 1).toFixed(4) : 0);
    collage.style.setProperty('--pointer-y', over ? clamp(2 * (pointer.y - box.top) / box.height - 1).toFixed(4) : 0);
  }

  function schedule() {
    if (visible && !reduced.matches && !frame) frame = requestAnimationFrame(render);
  }

  function releasePointer() {
    pointer = null;
    schedule();
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) pointer = null;
    schedule();
  }).observe(collage);
  collage.addEventListener('pointermove', event => {
    if (reduced.matches || !precisePointer.matches || event.pointerType === 'touch') return;
    pointer = { x: event.clientX, y: event.clientY };
    schedule();
  });
  collage.addEventListener('pointerleave', releasePointer);
  collage.addEventListener('pointercancel', releasePointer);
  window.addEventListener('blur', releasePointer);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  reduced.addEventListener('change', releasePointer);

  if (image.complete) prepareTiles();
  else image.addEventListener('load', prepareTiles, { once: true });
})();

(() => {
  const scene = document.querySelector('.harvest-scene');
  const section = scene.parentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;
  let frame;

  function updateParallax() {
    frame = undefined;
    const { top, height } = section.getBoundingClientRect();
    const viewportHeight = document.documentElement.clientHeight;
    const pinnedTop = parseFloat(getComputedStyle(scene).top);
    const halfPinDistance = (height - scene.offsetHeight) / 2;
    const progress = Number.isFinite(pinnedTop)
      ? (pinnedTop - halfPinDistance - top) / (halfPinDistance + viewportHeight * .11)
      : (viewportHeight - height - 2 * top) / (viewportHeight + height);
    section.style.setProperty('--harvest-progress', Math.max(-1, Math.min(1, progress)));
  }

  function scheduleUpdate() {
    if (inView && !reducedMotion.matches && frame === undefined) {
      frame = requestAnimationFrame(updateParallax);
    }
  }

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    scheduleUpdate();
  }).observe(section);
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      cancelAnimationFrame(frame);
      frame = undefined;
      section.style.removeProperty('--harvest-progress');
    } else {
      scheduleUpdate();
    }
  });
})();
