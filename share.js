/* Shared page-share row. Works off the page's own <link rel="canonical">,
   <title>, and meta description, so the same markup and script work on
   every page with zero per-page hardcoding.

   Native share hands off to the user's actual installed, already-logged-in
   apps (Messages, Facebook, Snapchat, WhatsApp, Mail, etc.) via the OS share
   sheet -- no web login involved. Where it's not supported (mainly desktop
   browsers without Web Share API), fall back to the plain Facebook/X links. */
document.addEventListener('DOMContentLoaded', function () {
  var nativeBtn = document.getElementById('nativeShareBtn');
  var fbBtn = document.getElementById('fbShareBtn');
  var xBtn = document.getElementById('xShareBtn');
  var copyBtn = document.getElementById('copyLinkBtn');
  if (!nativeBtn && !fbBtn && !xBtn && !copyBtn) return;

  var canonical = document.querySelector('link[rel="canonical"]');
  var pageUrl = canonical ? canonical.href : location.href;
  var pageTitle = (document.title.split('|')[0] || document.title).trim();
  var descTag = document.querySelector('meta[name="description"]');
  var shareText = descTag ? descTag.content : pageTitle;

  if (fbBtn) fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl);
  if (xBtn) xBtn.href = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(pageTitle);

  if (nativeBtn) {
    if (navigator.share) {
      var fallbacks = document.querySelectorAll('.share-fallback');
      for (var i = 0; i < fallbacks.length; i++) { fallbacks[i].style.display = 'none'; }
      nativeBtn.addEventListener('click', function () {
        navigator.share({ title: pageTitle, text: shareText, url: pageUrl }).catch(function () {});
        if (typeof gtag === 'function') gtag('event', 'page_share_native', { page_path: location.pathname });
      });
    } else {
      nativeBtn.style.display = 'none';
    }
  }

  if (copyBtn) {
    var original = copyBtn.textContent;
    copyBtn.addEventListener('click', function () {
      var done = function () {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = original; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pageUrl).then(done, done);
      } else {
        var tmp = document.createElement('input');
        tmp.value = pageUrl;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(tmp);
        done();
      }
      if (typeof gtag === 'function') gtag('event', 'page_share_copy_link', { page_path: location.pathname });
    });
  }
});
