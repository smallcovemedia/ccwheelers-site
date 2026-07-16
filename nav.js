document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.menu-toggle');
  var header = document.querySelector('header');
  if (!toggle || !header) return;
  toggle.addEventListener('click', function () {
    var open = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.textContent = open ? '\u2715' : '\u2630';
  });
  function closeMenu() {
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '\u2630';
  }
  document.querySelectorAll('nav a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
  document.querySelectorAll('.sub-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var li = btn.parentElement;
      var open = li.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.has-sub.open').forEach(function (li) {
      if (!li.contains(e.target)) {
        li.classList.remove('open');
        var b = li.querySelector('.sub-toggle');
        if (b) b.setAttribute('aria-expanded', 'false');
      }
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (header.classList.contains('nav-open')) { closeMenu(); toggle.focus(); }
    document.querySelectorAll('.has-sub.open').forEach(function (li) {
      li.classList.remove('open');
      var b = li.querySelector('.sub-toggle');
      if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
    });
  });
});
