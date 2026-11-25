(() => {
  const header = document.querySelector('.masthead');
  const menuButton = header.querySelector('.menu-toggle');
  const navigation = header.querySelector('.main-nav');
  const smallScreen = matchMedia('(max-width: 700px)');

  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }

  menuButton.hidden = false;
  menuButton.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  smallScreen.addEventListener('change', () => setMenu(false));
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      setMenu(false);
      menuButton.focus();
    }
  });
})();
