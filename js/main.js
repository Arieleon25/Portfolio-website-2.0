/* ==========================================================================
   Main JS — Vanilla JavaScript (no jQuery)
   Mobile nav, smooth scroll, filtering, video modal
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---- Mobile Nav Toggle ---- */
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('main-nav--open');
      navToggle.classList.toggle('nav-toggle--active');
      // Lock body scroll when mobile menu is open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close nav when clicking a link (mobile) — but not dropdown toggles
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768 && !this.classList.contains('main-nav__dropdown-toggle')) {
          navToggle.classList.remove('nav-toggle--active');
          mainNav.classList.remove('main-nav--open');
          document.body.style.overflow = '';
        }
      });
    });
  }

  /* ---- Mobile Dropdown Toggle ---- */
  const dropdownToggles = document.querySelectorAll('.main-nav__dropdown-toggle');
  dropdownToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const parent = this.closest('.main-nav__item');
        parent.classList.toggle('main-nav__item--open');
      }
    });
  });

  /* ---- Header scroll shadow ---- */
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  /* ---- Smooth Scroll for anchor links ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ---- Portfolio Filtering ---- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length > 0) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // Update active state
        filterBtns.forEach(function (b) { b.classList.remove('filter-btn--active'); });
        this.classList.add('filter-btn--active');

        const filter = this.getAttribute('data-filter');
        const items = document.querySelectorAll('.grid-item');

        items.forEach(function (item) {
          if (filter === '*' || item.classList.contains(filter)) {
            item.classList.remove('grid-item--hidden');
          } else {
            item.classList.add('grid-item--hidden');
          }
        });
      });
    });
  }

  /* ---- E-Commerce Media Modal with Slider (videos + images) ---- */
  const mediaContainers = document.querySelectorAll('.ecom-video-trigger');
  const mediaModal = document.getElementById('video-modal');
  const videoPlayer = document.getElementById('video-player');
  const imagePlayer = document.getElementById('image-player');
  const mediaPrev = document.getElementById('video-prev');
  const mediaNext = document.getElementById('video-next');
  const mediaCounter = document.getElementById('video-counter');

  var currentMedia = [];
  var currentMediaIndex = 0;
  var currentMediaType = 'video'; // 'video' or 'image'

  function loadMedia(index) {
    if (!currentMedia.length) return;
    currentMediaIndex = index;

    if (currentMediaType === 'image') {
      videoPlayer.style.display = 'none';
      videoPlayer.pause();
      videoPlayer.src = '';
      imagePlayer.src = currentMedia[index];
      imagePlayer.style.display = 'block';
    } else {
      imagePlayer.style.display = 'none';
      imagePlayer.src = '';
      videoPlayer.style.display = 'block';
      videoPlayer.src = currentMedia[index];
      videoPlayer.play();
    }
    updateMediaUI();
  }

  function updateMediaUI() {
    if (!mediaCounter) return;
    if (currentMedia.length > 1) {
      mediaCounter.textContent = (currentMediaIndex + 1) + ' / ' + currentMedia.length;
      mediaCounter.style.display = 'block';
      if (mediaPrev) mediaPrev.style.display = 'flex';
      if (mediaNext) mediaNext.style.display = 'flex';
    } else {
      mediaCounter.style.display = 'none';
      if (mediaPrev) mediaPrev.style.display = 'none';
      if (mediaNext) mediaNext.style.display = 'none';
    }
  }

  function closeModal() {
    if (!mediaModal) return;
    mediaModal.classList.remove('video-modal--open');
    if (videoPlayer) { videoPlayer.pause(); videoPlayer.src = ''; }
    if (imagePlayer) { imagePlayer.src = ''; imagePlayer.style.display = 'none'; }
    currentMedia = [];
    currentMediaIndex = 0;
  }

  if (mediaContainers.length > 0 && mediaModal) {
    mediaContainers.forEach(function (container) {
      container.addEventListener('click', function () {
        var imageAttr = this.getAttribute('data-images');
        var videoAttr = this.getAttribute('data-videos') || this.getAttribute('data-video');

        if (imageAttr) {
          currentMediaType = 'image';
          currentMedia = imageAttr.split(',').map(function (v) { return v.trim(); });
        } else if (videoAttr) {
          currentMediaType = 'video';
          currentMedia = videoAttr.split(',').map(function (v) { return v.trim(); });
        }

        currentMediaIndex = 0;
        mediaModal.classList.add('video-modal--open');
        loadMedia(0);
      });
    });

    // Previous / Next buttons
    if (mediaPrev) {
      mediaPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        if (currentMedia.length > 1) {
          loadMedia((currentMediaIndex - 1 + currentMedia.length) % currentMedia.length);
        }
      });
    }

    if (mediaNext) {
      mediaNext.addEventListener('click', function (e) {
        e.stopPropagation();
        if (currentMedia.length > 1) {
          loadMedia((currentMediaIndex + 1) % currentMedia.length);
        }
      });
    }

    // Close on backdrop click
    mediaModal.addEventListener('click', function (e) {
      if (e.target === mediaModal || e.target.classList.contains('video-modal__close')) {
        closeModal();
      }
    });

    // Close on Escape, arrow keys for prev/next
    document.addEventListener('keydown', function (e) {
      if (!mediaModal.classList.contains('video-modal--open')) return;
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft' && currentMedia.length > 1) {
        loadMedia((currentMediaIndex - 1 + currentMedia.length) % currentMedia.length);
      } else if (e.key === 'ArrowRight' && currentMedia.length > 1) {
        loadMedia((currentMediaIndex + 1) % currentMedia.length);
      }
    });

    // Swipe gesture support for mobile
    var touchStartX = 0;
    var touchStartY = 0;

    mediaModal.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    mediaModal.addEventListener('touchend', function (e) {
      var touchEndX = e.changedTouches[0].screenX;
      var diffX = touchStartX - touchEndX;
      var diffY = Math.abs(touchStartY - e.changedTouches[0].screenY);

      if (Math.abs(diffX) > 50 && Math.abs(diffX) > diffY && currentMedia.length > 1) {
        if (diffX > 0) {
          loadMedia((currentMediaIndex + 1) % currentMedia.length);
        } else {
          loadMedia((currentMediaIndex - 1 + currentMedia.length) % currentMedia.length);
        }
      }
    }, { passive: true });
  }

});
