let isOpen = false;
let currentSpread = 1;
let totalSpreads = 20;
let pageContents = {};

// Check if device is mobile or iPad
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
    window.matchMedia("(max-width: 1024px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

document.addEventListener('DOMContentLoaded', function () {
  // Block mobile devices
  if (isMobileDevice()) {
    document.getElementById('mobileBlocker').style.display = 'flex';
    document.querySelector('.scene').style.display = 'none';
    return;
  }

  initializeBook();
  loadSavedContent();
  attachTextareaListeners();
});

// Check on resize
window.addEventListener('resize', function () {
  if (isMobileDevice()) {
    document.getElementById('mobileBlocker').style.display = 'flex';
    document.querySelector('.scene').style.display = 'none';
  } else {
    document.getElementById('mobileBlocker').style.display = 'none';
    document.querySelector('.scene').style.display = 'flex';
  }
});

// Initialize book with multiple spreads
function initializeBook() {
  const pagesContainer = document.getElementById('pagesContainer');

  // Spreads 
  for (let i = 2; i <= totalSpreads; i++) {
    const spread = document.createElement('div');
    spread.className = 'spread';
    spread.dataset.spread = i;

    // Page numbers
    const leftPageNum = i * 2 - 2;
    const rightPageNum = i * 2 - 1;

    const leftPage = createPage(leftPageNum, 'left-page');
    const rightPage = createPage(rightPageNum, 'right-page');

    spread.appendChild(leftPage);
    spread.appendChild(rightPage);
    pagesContainer.appendChild(spread);
  }
}

// Single page
function createPage(pageNumber, pageClass) {
  const page = document.createElement('div');
  page.className = `page ${pageClass}`;

  const pageContent = document.createElement('div');
  pageContent.className = 'page-content';

  const pageLines = document.createElement('div');
  pageLines.className = 'page-lines';

  const textarea = document.createElement('textarea');
  textarea.className = 'page-textarea';
  textarea.dataset.page = pageNumber;
  textarea.placeholder = '';

  const pageNum = document.createElement('div');
  pageNum.className = 'page-number';
  pageNum.textContent = pageNumber;

  pageContent.appendChild(pageLines);
  pageContent.appendChild(textarea);
  page.appendChild(pageContent);
  page.appendChild(pageNum);

  return page;
}

// Open the book
function openBook() {
  if (isOpen || isMobileDevice()) return;

  const book = document.getElementById('book');
  const frontCover = document.querySelector('.front-cover');
  const pagesContainer = document.getElementById('pagesContainer');
  const controls = document.getElementById('controls');

  // Start opening animation
  book.classList.add('open');
  book.classList.remove('closed');
  frontCover.classList.add('opening');

  // Show pages and controls after cover opens
  setTimeout(() => {
    pagesContainer.classList.add('visible');
    controls.classList.remove('hidden');
    showSpread(1);
    isOpen = true;

    const firstTextarea = document.querySelector('[data-page="1"]');
    if (firstTextarea) {
      firstTextarea.focus();
    }
  }, 750);
}

// Close the book
function closeBook() {
  if (!isOpen) return;

  const book = document.getElementById('book');
  const frontCover = document.querySelector('.front-cover');
  const pagesContainer = document.getElementById('pagesContainer');
  const controls = document.getElementById('controls');

  // Save all content before closing
  saveAllContent();

  // Hide pages first
  pagesContainer.classList.remove('visible');
  controls.classList.add('hidden');

  // Close the book
  setTimeout(() => {
    frontCover.classList.remove('opening');
    book.classList.remove('open');
    book.classList.add('closed');
    isOpen = false;

    // Hide all spreads
    document.querySelectorAll('.spread').forEach(spread => {
      spread.classList.remove('active');
    });
  }, 300);
}

// Show a specific spread
function showSpread(spreadNumber) {
  // Hide all spreads
  document.querySelectorAll('.spread').forEach(spread => {
    spread.classList.remove('active');
  });

  // Show the requested spread
  const targetSpread = document.querySelector(`[data-spread="${spreadNumber}"]`);
  if (targetSpread) {
    targetSpread.classList.add('active');
    currentSpread = spreadNumber;
    updatePageIndicator();
    updateNavigationButtons();
  }
}

// Navigation between spreads
function navigateSpread(direction) {
  const newSpread = currentSpread + direction;

  if (newSpread < 1 || newSpread > totalSpreads) {
    return;
  }

  saveCurrentSpreadContent();
  showSpread(newSpread);
}

// Update page indicator
function updatePageIndicator() {
  const indicator = document.getElementById('pageIndicator');

  if (currentSpread === 1) {
    indicator.textContent = 'Cover - Page 1';
  } else {
    const leftPageNum = currentSpread * 2 - 2;
    const rightPageNum = currentSpread * 2 - 1;
    indicator.textContent = `Pages ${leftPageNum}-${rightPageNum}`;
  }
}

// Update navigation buttons
function updateNavigationButtons() {
  const prevBtn = document.querySelector('.nav-btn:first-child');
  const nextBtn = document.querySelector('.nav-btn:nth-child(3)');

  prevBtn.disabled = currentSpread === 1;
  nextBtn.disabled = currentSpread === totalSpreads;
}

// Save content of current spread
function saveCurrentSpreadContent() {
  const currentSpreadElement = document.querySelector(`[data-spread="${currentSpread}"]`);
  if (currentSpreadElement) {
    const textareas = currentSpreadElement.querySelectorAll('.page-textarea');
    textareas.forEach(textarea => {
      const pageNum = textarea.dataset.page;
      pageContents[pageNum] = textarea.value;
    });
  }
}

// Save all content
function saveAllContent() {
  document.querySelectorAll('.page-textarea').forEach(textarea => {
    const pageNum = textarea.dataset.page;
    pageContents[pageNum] = textarea.value;
  });

  // Save to localStorage
  localStorage.setItem('deathNotePages', JSON.stringify(pageContents));
}

// Load saved content
function loadSavedContent() {
  const saved = localStorage.getItem('deathNotePages');
  if (saved) {
    pageContents = JSON.parse(saved);

    // Apply saved content to textareas
    document.querySelectorAll('.page-textarea').forEach(textarea => {
      const pageNum = textarea.dataset.page;
      if (pageContents[pageNum]) {
        textarea.value = pageContents[pageNum];
      }
    });
  }
}

// Attach auto-save listeners to textareas
function attachTextareaListeners() {
  document.querySelectorAll('.page-textarea').forEach(textarea => {
    textarea.addEventListener('input', function () {
      const pageNum = this.dataset.page;
      pageContents[pageNum] = this.value;

      // Auto-save with debounce
      clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => {
        localStorage.setItem('deathNotePages', JSON.stringify(pageContents));
      }, 1000);
    });

    // Writing effect
    textarea.addEventListener('input', function (e) {
      if (e.target.value.length > 0) {
        const lastChar = e.target.value[e.target.value.length - 1];
        if (lastChar === '\n') {
          e.target.style.textShadow = '0 0 5px rgba(139, 0, 0, 0.3)';
          setTimeout(() => {
            e.target.style.textShadow = 'none';
          }, 300);
        }
      }
    });
  });
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
  if (!isOpen || isMobileDevice()) return;

  // Check if user is typing in textarea
  const isTyping = document.activeElement.classList.contains('page-textarea');

  // Arrow keys for navigation (only when not typing)
  if (!isTyping) {
    if (e.key === 'ArrowLeft') {
      navigateSpread(-1);
    } else if (e.key === 'ArrowRight') {
      navigateSpread(1);
    }
  }

  // Escape to close (always available)
  if (e.key === 'Escape') {
    closeBook();
  }

  // Ctrl/Cmd + Arrow for navigation even while typing
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateSpread(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateSpread(1);
    }
  }
});

// Auto-save on page unload
window.addEventListener('beforeunload', function () {
  if (!isMobileDevice()) {
    saveAllContent();
  }
});

// Add click-to-open hint
document.addEventListener('DOMContentLoaded', function () {
  if (isMobileDevice()) return;

  const frontCover = document.querySelector('.front-cover');

  frontCover.addEventListener('mouseenter', function () {
    this.style.cursor = 'pointer';
  });
});