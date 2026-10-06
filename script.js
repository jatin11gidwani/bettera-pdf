// Config
var PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
var FREE_PAGES = 3;

// State
var pdfDoc = null;
var totalPageCount = 0;
var unlocked = false;
var gateShown = false;

// Elements
var pdfPages     = document.getElementById('pdfPages');
var pdfLoading   = document.getElementById('pdfLoading');
var gateOverlay  = document.getElementById('gateOverlay');
var gateCard     = document.getElementById('gateCard');
var gateClose    = document.getElementById('gateClose');
var gateForm     = document.getElementById('gateForm');
var unlockBtn    = document.getElementById('unlockBtn');
var btnLoading   = document.getElementById('btnLoading');
var successBanner= document.getElementById('successBanner');
var downloadBtn  = document.getElementById('downloadBtn');

// PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Init
async function init() {
  try {
    pdfLoading.style.display = 'flex';
    pdfPages.style.display   = 'none';

    var loadingTask = pdfjsLib.getDocument(PDF_URL);
    pdfDoc = await loadingTask.promise;
    totalPageCount = pdfDoc.numPages;

    pdfLoading.style.display = 'none';
    pdfPages.style.display   = 'flex';

    await renderPages(1, FREE_PAGES);

    // Listen for scroll to trigger gate
    window.addEventListener('scroll', onScroll, { passive: true });
    // Check immediately in case page is short
    onScroll();
  } catch (err) {
    pdfLoading.innerHTML = '<p style="color:#cc0000;">Failed to load PDF. Please refresh.</p>';
    console.error(err);
  }
}

// Trigger gate when user scrolls to bottom of preview pages
function onScroll() {
  if (unlocked || gateShown) return;
  var container = document.getElementById('viewerContainer');
  if (!container) return;
  var rect = container.getBoundingClientRect();
  // Show when bottom of the container is within viewport
  if (rect.bottom <= window.innerHeight + 80) {
    showGate();
  }
}

// Render pages start..end
async function renderPages(start, end) {
  var scale = getScale();
  for (var i = start; i <= Math.min(end, totalPageCount); i++) {
    var page = await pdfDoc.getPage(i);
    var viewport = page.getViewport({ scale: scale });

    var wrap = document.createElement('div');
    wrap.className = 'pdf-page-wrap';
    wrap.id = 'page-' + i;

    var canvas = document.createElement('canvas');
    canvas.width  = viewport.width;
    canvas.height = viewport.height;

    var ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    wrap.appendChild(canvas);
    pdfPages.appendChild(wrap);
  }
}

function getScale() {
  var containerWidth = document.querySelector('.viewer-container').clientWidth;
  return Math.min(1.8, containerWidth / 612);
}

// Show gate modal with dark blur overlay
function showGate() {
  if (gateShown) return;
  gateShown = true;
  document.body.style.overflow = 'hidden';
  gateOverlay.classList.add('visible');
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      gateCard.classList.add('animate-in');
    });
  });
}

function hideGate() {
  gateCard.classList.remove('animate-in');
  setTimeout(function() {
    gateOverlay.classList.remove('visible');
    document.body.style.overflow = '';
  }, 300);
}

// Close button
gateClose.addEventListener('click', function() {
  hideGate();
});

// Click backdrop to close
gateOverlay.addEventListener('click', function(e) {
  if (e.target === gateOverlay) hideGate();
});

// Validate email
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// Form submit
gateForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  var emailInput = document.getElementById('email');
  var emailError = document.getElementById('emailError');

  if (!isValidEmail(emailInput.value)) {
    emailInput.classList.add('error');
    emailError.classList.add('visible');
    return;
  }

  emailInput.classList.remove('error');
  emailError.classList.remove('visible');

  unlockBtn.classList.add('loading');
  btnLoading.classList.add('visible');

  // Simulate API - replace with real fetch() later
  await new Promise(function(r) { setTimeout(r, 1200); });

  await unlockPDF();
});

document.getElementById('email').addEventListener('input', function() {
  this.classList.remove('error');
  document.getElementById('emailError').classList.remove('visible');
});

async function unlockPDF() {
  unlocked = true;
  window.removeEventListener('scroll', onScroll);
  hideGate();
  await renderPages(FREE_PAGES + 1, totalPageCount);
  downloadBtn.href = PDF_URL;
  showSuccess();
  setTimeout(function() {
    var nextPage = document.getElementById('page-' + (FREE_PAGES + 1));
    if (nextPage) nextPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 500);
}

function showSuccess() {
  successBanner.classList.add('visible');
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      successBanner.classList.add('slide-in');
    });
  });
  setTimeout(function() {
    successBanner.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
    successBanner.style.opacity = '0';
    successBanner.style.transform = 'translateX(-50%) translateY(100px)';
    setTimeout(function() { successBanner.classList.remove('visible'); }, 400);
  }, 8000);
}

init();
