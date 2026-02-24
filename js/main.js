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
      navToggle.classList.toggle('nav-toggle--active');
      mainNav.classList.toggle('main-nav--open');
    });

    // Close nav when clicking a link (mobile)
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          navToggle.classList.remove('nav-toggle--active');
          mainNav.classList.remove('main-nav--open');
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

  /* ---- E-Commerce Video Modal with Slider ---- */
  const videoContainers = document.querySelectorAll('.ecom-video-trigger');
  const videoModal = document.getElementById('video-modal');
  const videoPlayer = document.getElementById('video-player');
  const videoPrev = document.getElementById('video-prev');
  const videoNext = document.getElementById('video-next');
  const videoCounter = document.getElementById('video-counter');

  var currentVideos = [];
  var currentVideoIndex = 0;

  function loadVideo(index) {
    if (!videoPlayer || !currentVideos.length) return;
    currentVideoIndex = index;
    videoPlayer.src = currentVideos[index];
    videoPlayer.play();
    updateSliderUI();
  }

  function updateSliderUI() {
    if (!videoCounter) return;
    if (currentVideos.length > 1) {
      videoCounter.textContent = (currentVideoIndex + 1) + ' / ' + currentVideos.length;
      videoCounter.style.display = 'block';
      if (videoPrev) videoPrev.style.display = 'flex';
      if (videoNext) videoNext.style.display = 'flex';
    } else {
      videoCounter.style.display = 'none';
      if (videoPrev) videoPrev.style.display = 'none';
      if (videoNext) videoNext.style.display = 'none';
    }
  }

  function closeModal() {
    if (!videoModal || !videoPlayer) return;
    videoModal.classList.remove('video-modal--open');
    videoPlayer.pause();
    videoPlayer.src = '';
    currentVideos = [];
    currentVideoIndex = 0;
  }

  if (videoContainers.length > 0 && videoModal && videoPlayer) {
    videoContainers.forEach(function (container) {
      container.addEventListener('click', function () {
        var videoAttr = this.getAttribute('data-videos') || this.getAttribute('data-video');
        currentVideos = videoAttr.split(',').map(function (v) { return v.trim(); });
        currentVideoIndex = 0;
        videoModal.classList.add('video-modal--open');
        loadVideo(0);
      });
    });

    // Previous / Next buttons
    if (videoPrev) {
      videoPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        if (currentVideos.length > 1) {
          loadVideo((currentVideoIndex - 1 + currentVideos.length) % currentVideos.length);
        }
      });
    }

    if (videoNext) {
      videoNext.addEventListener('click', function (e) {
        e.stopPropagation();
        if (currentVideos.length > 1) {
          loadVideo((currentVideoIndex + 1) % currentVideos.length);
        }
      });
    }

    // Close on backdrop click
    videoModal.addEventListener('click', function (e) {
      if (e.target === videoModal || e.target.classList.contains('video-modal__close')) {
        closeModal();
      }
    });

    // Close on Escape, arrow keys for prev/next
    document.addEventListener('keydown', function (e) {
      if (!videoModal.classList.contains('video-modal--open')) return;
      if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === 'ArrowLeft' && currentVideos.length > 1) {
        loadVideo((currentVideoIndex - 1 + currentVideos.length) % currentVideos.length);
      } else if (e.key === 'ArrowRight' && currentVideos.length > 1) {
        loadVideo((currentVideoIndex + 1) % currentVideos.length);
      }
    });
  }

});
