(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  /* Header shadow on scroll */
  function onScroll() {
    if (window.scrollY > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  function closeNav() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '메뉴 열기');
  }

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });

  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') closeNav();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) closeNav();
  });

  /* Reveal on scroll */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Highlight the current section in the nav */
  var sections = ['about', 'programs', 'procurement', 'live', 'gallery', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        nav.querySelectorAll('a').forEach(function (a) {
          var href = a.getAttribute('href');
          if (href === '#' + entry.target.id) a.style.color = 'var(--blue)';
          else if (!a.classList.contains('nav-cta')) a.style.color = '';
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Gallery ---------- */
  var galleryGrid = document.getElementById('galleryGrid');
  var galleryFilters = document.getElementById('galleryFilters');
  var galleryCount = document.getElementById('galleryCount');
  var galleryEmpty = document.getElementById('galleryEmpty');

  if (galleryGrid) {
    var galleryItems = [];
    var visibleItems = [];
    var activeCategory = 'all';

    var lightbox = document.getElementById('galleryLightbox');
    var lbImage = document.getElementById('lbImage');
    var lbTitle = document.getElementById('lbTitle');
    var lbDesc = document.getElementById('lbDesc');
    var lbCount = document.getElementById('lbCount');
    var lbPrev = document.getElementById('lbPrev');
    var lbNext = document.getElementById('lbNext');
    var lbClose = document.getElementById('lbClose');
    var lbIndex = 0;

    function setCount() {
      if (!galleryCount) return;
      var label = '';
      if (activeCategory !== 'all') {
        for (var i = 0; i < galleryItems.length; i++) {
          if (galleryItems[i].category === activeCategory) {
            label = galleryItems[i].categoryLabel || activeCategory;
            break;
          }
        }
      }
      galleryCount.textContent = (label ? label + ' · ' : '') + visibleItems.length + '장';
    }

    function renderFilters() {
      if (!galleryFilters) return;
      var seen = {};
      var groups = [];
      galleryItems.forEach(function (item) {
        if (!item.category) return;
        if (!seen[item.category]) {
          seen[item.category] = { key: item.category, label: item.categoryLabel || item.category, n: 0 };
          groups.push(seen[item.category]);
        }
        seen[item.category].n++;
      });
      groups.unshift({ key: 'all', label: '전체', n: galleryItems.length });

      galleryFilters.innerHTML = '';
      groups.forEach(function (group) {
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = group.label + ' ' + group.n;
        button.setAttribute('data-category', group.key);
        button.setAttribute('aria-pressed', group.key === activeCategory ? 'true' : 'false');
        button.addEventListener('click', function () {
          activeCategory = group.key;
          var all = galleryFilters.querySelectorAll('button');
          for (var i = 0; i < all.length; i++) {
            all[i].setAttribute('aria-pressed', all[i] === button ? 'true' : 'false');
          }
          renderGallery();
        });
        galleryFilters.appendChild(button);
      });
    }

    function renderGallery() {
      visibleItems = galleryItems.filter(function (item) {
        return activeCategory === 'all' || item.category === activeCategory;
      });

      galleryGrid.innerHTML = '';
      visibleItems.forEach(function (item, index) {
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'gallery-card';
        card.setAttribute('aria-label', item.title + ' 크게 보기');

        var thumb = document.createElement('div');
        thumb.className = 'gallery-thumb';
        var img = document.createElement('img');
        img.src = item.path;
        img.alt = item.title;
        img.loading = 'lazy';
        img.decoding = 'async';
        thumb.appendChild(img);
        if (item.date) {
          var tag = document.createElement('span');
          tag.className = 'gallery-tag';
          tag.textContent = item.date;
          thumb.appendChild(tag);
        }

        var body = document.createElement('div');
        body.className = 'gallery-body';
        var title = document.createElement('h3');
        title.textContent = item.title;
        body.appendChild(title);
        if (item.desc) {
          var desc = document.createElement('p');
          desc.textContent = item.desc;
          body.appendChild(desc);
        }

        card.appendChild(thumb);
        card.appendChild(body);
        card.addEventListener('click', function () { openLightbox(index); });
        galleryGrid.appendChild(card);
      });

      if (galleryEmpty) galleryEmpty.hidden = visibleItems.length !== 0;
      setCount();
    }

    function showSlide(index) {
      var total = visibleItems.length;
      if (!total) return;
      lbIndex = ((index % total) + total) % total;
      var item = visibleItems[lbIndex];
      if (lbImage) {
        lbImage.src = item.path;
        lbImage.alt = item.title;
      }
      if (lbTitle) lbTitle.textContent = item.title;
      if (lbDesc) lbDesc.textContent = item.desc || '';
      if (lbCount) lbCount.textContent = (lbIndex + 1) + ' / ' + total;
      if (lbPrev) lbPrev.hidden = total < 2;
      if (lbNext) lbNext.hidden = total < 2;
    }

    function openLightbox(index) {
      if (!visibleItems.length) return;
      if (!lightbox || typeof lightbox.showModal !== 'function') {
        window.location.href = visibleItems[index].path;
        return;
      }
      showSlide(index);
      if (typeof lightbox.showModal === 'function') lightbox.showModal();
    }

    if (lightbox) {
      if (lbClose) lbClose.addEventListener('click', function () { lightbox.close(); });
      if (lbPrev) lbPrev.addEventListener('click', function () { showSlide(lbIndex - 1); });
      if (lbNext) lbNext.addEventListener('click', function () { showSlide(lbIndex + 1); });

      /* 배경(백드롭) 클릭 시 닫기 */
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) lightbox.close();
      });

      /* 좌우 방향키로 이동 */
      lightbox.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); showSlide(lbIndex - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); showSlide(lbIndex + 1); }
      });
    }

    fetch('gallery.json', { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        galleryItems = (Array.isArray(data) ? data : []).filter(function (item) {
          return item && item.path && item.title;
        });
        renderFilters();
        renderGallery();
      })
      .catch(function () {
        if (galleryEmpty) {
          galleryEmpty.hidden = false;
          galleryEmpty.textContent = '갤러리를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.';
        }
        if (galleryCount) galleryCount.textContent = '';
      });
  }

  /* ---------- Quick inquiry form (FormSubmit) ---------- */
  var inquiryForm = document.getElementById('inquiryForm');
  var inquiryStatus = document.getElementById('inquiryStatus');

  if (inquiryForm) {
    var submitButton = inquiryForm.querySelector('.inquiry-submit');

    /* FormSubmit 전송 후 ?sent=1 로 돌아오면 접수 안내 표시 */
    if (inquiryStatus && /(?:^|[?&])sent=1(?:&|$)/.test(window.location.search)) {
      inquiryStatus.textContent = '문의가 접수되었습니다. 확인 후 남겨주신 연락처로 회신드리겠습니다.';
      inquiryStatus.className = 'inquiry-status is-ok';
      inquiryStatus.hidden = false;
    }

    inquiryForm.addEventListener('submit', function () {
      if (submitButton) submitButton.textContent = '보내는 중…';
    });

    window.addEventListener('pageshow', function () {
      if (submitButton) submitButton.textContent = '문의 보내기';
    });
  }
})();
