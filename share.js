/* Shared page-share row. Works off the page's own <link rel="canonical">,
   <title>, and meta description, so the same markup and script work on
   every page with zero per-page hardcoding.

   Native share hands off to the user's actual installed, already-logged-in
   apps (Messages, Facebook, Snapchat, WhatsApp, Mail, etc.) via the OS share
   sheet -- no web login involved. Where it's not supported (mainly desktop
   browsers without Web Share API), fall back to the plain Facebook/X links. */
document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('dgusa-network-styles')) {
    var badgeStyles = document.createElement('style');
    badgeStyles.id = 'dgusa-network-styles';
    badgeStyles.textContent = '.dgusa-network-mark{box-sizing:border-box;background:#f3ede1;border-top:1px solid rgba(9,48,52,.18);overflow:hidden;padding:26px 20px;text-align:center;width:100%}.dgusa-network-mark *{box-sizing:border-box}.dgusa-network-mark>a{align-items:center;color:#07343a!important;display:flex!important;flex-direction:column!important;gap:6px;justify-content:center;margin:0 auto!important;max-width:460px;min-width:0;padding:0 12px!important;position:static!important;text-align:center!important;text-decoration:none!important;transform:none;width:100%}.dgusa-network-mark>a:hover{transform:translateY(-2px)}.dgusa-network-mark span,.dgusa-network-mark strong,.dgusa-network-mark small{display:block!important;margin:0!important;max-width:100%;position:static!important;text-align:center!important;white-space:normal!important}.dgusa-network-mark span{color:#d85836!important;font-size:.68rem!important;font-weight:800!important;letter-spacing:.16em!important}.dgusa-network-mark img{display:block!important;height:auto!important;margin:2px auto!important;max-height:none!important;max-width:220px!important;object-fit:contain!important;position:static!important;width:60%!important}.dgusa-network-mark strong{color:#07343a!important;font-family:Georgia,serif!important;font-size:1rem!important;letter-spacing:.06em!important;line-height:1.25!important}.dgusa-network-mark small{color:#456469!important;font-size:.82rem!important;line-height:1.4!important}@media(max-width:560px){.dgusa-network-mark{padding:22px 14px}.dgusa-network-mark>a{padding:0 8px!important}.dgusa-network-mark img{max-width:200px!important;width:68%!important}}';
    badgeStyles.textContent += '.dgusa-network-actions{display:flex;flex-wrap:wrap;gap:8px 18px;justify-content:center;margin:16px auto 0;max-width:560px}.dgusa-network-actions a{color:#07343a!important;font-size:.76rem!important;font-weight:800!important;text-decoration:underline!important;text-decoration-color:#d85836!important;text-underline-offset:4px!important}@media(max-width:560px){.dgusa-network-actions{align-items:center;flex-direction:column}}';
    document.head.appendChild(badgeStyles);
  }
  var footer = document.querySelector('footer');
  if (footer && !document.querySelector('.dgusa-network-mark')) {
    var mark = document.createElement('aside');
    mark.className = 'dgusa-network-mark';
    mark.setAttribute('aria-label', 'Dune Guide USA network');
    mark.innerHTML = '<a href="https://duneguideusa.com/?utm_source=ccwheelers.com&utm_medium=network_badge&utm_campaign=branch_network" target="_blank" rel="noopener"><span>PART OF THE</span><img src="images/network/duneguideusa-network-logo.png" alt="Dune Guide USA"><strong>DUNE GUIDE USA NETWORK</strong><small>Locally built dune guides. One place to start.</small></a><div class="dgusa-network-actions"><a href="mailto:Michael@DuneGuideUSA.com">Network contact</a><a href="https://duneguideusa.com/advertise.html?utm_source=ccwheelers.com&utm_medium=network_footer&utm_campaign=advertising" target="_blank" rel="noopener">Advertise across the network</a></div>';
    footer.parentNode.insertBefore(mark, footer);
  }

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

  if (!document.getElementById('ccw-share-dialog-styles')) {
    var shareStyles = document.createElement('style');
    shareStyles.id = 'ccw-share-dialog-styles';
    shareStyles.textContent = '.ccw-share-dialog{width:min(92vw,520px);border:0;border-top:5px solid #ec6737;padding:0;background:#fff;color:#092f35;box-shadow:0 26px 80px rgba(0,0,0,.34)}.ccw-share-dialog::backdrop{background:rgba(4,30,34,.72)}.ccw-share-dialog form{position:relative;padding:30px}.ccw-share-dialog .share-close{position:absolute;right:16px;top:12px;border:0;background:transparent;font-size:28px;cursor:pointer}.ccw-share-dialog p{margin:0;color:#ec6737;font-size:11px;font-weight:900;letter-spacing:.14em}.ccw-share-dialog h2{margin:8px 0 22px;font-family:Georgia,serif;font-size:31px}.ccw-share-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ccw-share-options a,.ccw-share-options button{display:flex;align-items:center;justify-content:center;min-height:48px;border:1px solid rgba(9,47,53,.23);background:#f5efe3;color:#092f35;font:800 13px Inter,Arial,sans-serif;cursor:pointer}.ccw-share-options [hidden]{display:none}.ccw-share-options a:hover,.ccw-share-options button:hover{border-color:#ec6737}.ccw-share-status{min-height:18px!important;margin-top:14px!important;color:#48656a!important;font-size:12px!important;letter-spacing:0!important}@media(max-width:480px){.ccw-share-dialog form{padding:27px 18px 22px}.ccw-share-options{grid-template-columns:1fr}}';
    document.head.appendChild(shareStyles);
  }

  var dialog = document.createElement('dialog');
  dialog.className = 'ccw-share-dialog';
  dialog.innerHTML = '<form method="dialog"><button class="share-close" value="cancel" aria-label="Close share options">&times;</button><p>SHARE THIS PAGE</p><h2>Choose how to send it.</h2><div class="ccw-share-options"><button type="button" data-share="device">Share with an app</button><a data-share="email">Email</a><a data-share="text">Text</a><a data-share="facebook" target="_blank" rel="noopener">Facebook</a><a data-share="x" target="_blank" rel="noopener">X</a><button type="button" data-share="copy">Copy link</button></div><p class="ccw-share-status" role="status" aria-live="polite"></p></form>';
  document.body.appendChild(dialog);
  var dialogBody = shareText + '\n\n' + pageUrl;
  dialog.querySelector('[data-share="email"]').href = 'mailto:?subject=' + encodeURIComponent(pageTitle) + '&body=' + encodeURIComponent(dialogBody);
  dialog.querySelector('[data-share="text"]').href = 'sms:?body=' + encodeURIComponent(dialogBody);
  dialog.querySelector('[data-share="facebook"]').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl);
  dialog.querySelector('[data-share="x"]').href = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(pageTitle);
  var dialogDevice = dialog.querySelector('[data-share="device"]');
  dialogDevice.hidden = !navigator.share;
  dialogDevice.addEventListener('click', function () {
    navigator.share({ title: pageTitle, text: shareText, url: pageUrl }).then(function () { dialog.close(); }).catch(function (error) {
      if (!error || error.name !== 'AbortError') dialog.querySelector('.ccw-share-status').textContent = 'Your device could not open its app chooser. Use one of the options below.';
    });
  });
  dialog.querySelector('[data-share="copy"]').addEventListener('click', function () {
    var status = dialog.querySelector('.ccw-share-status');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(pageUrl).then(function () { status.textContent = 'Link copied.'; }, function () { status.textContent = 'Copy the address from your browser.'; });
    else status.textContent = 'Copy the address from your browser.';
  });

  if (fbBtn) fbBtn.href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(pageUrl);
  if (xBtn) xBtn.href = 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(pageUrl) + '&text=' + encodeURIComponent(pageTitle);

  if (nativeBtn) {
    nativeBtn.addEventListener('click', function () {
      dialog.showModal();
      if (typeof gtag === 'function') gtag('event', 'page_share_open', { page_path: location.pathname });
    });
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
