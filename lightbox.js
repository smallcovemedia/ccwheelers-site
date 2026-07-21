document.addEventListener('DOMContentLoaded', function () {
  var items = document.querySelectorAll('[data-lightbox]');
  if (!items.length) return;

  var lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Enlarged photo');
    lb.innerHTML = '<button class="close" aria-label="Close">✕</button><img src="" alt=""><p></p>';
    document.body.appendChild(lb);
  }

  var lbImg = lb.querySelector('img');
  var cap = lb.querySelector('p');

  function open(item) {
    var thumb = item.tagName === 'IMG' ? item : item.querySelector('img');
    lbImg.src = item.getAttribute('data-lightbox') || (thumb ? thumb.src : '');
    lbImg.alt = thumb ? thumb.alt : '';
    cap.textContent = item.getAttribute('data-cap') || '';
    lb.classList.add('open');
  }
  function close() { lb.classList.remove('open'); lbImg.src = ''; }

  items.forEach(function (item) {
    if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');
    item.classList.add('lightbox-trigger');
    item.addEventListener('click', function () { open(item); });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(item); }
    });
  });

  lb.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
});
