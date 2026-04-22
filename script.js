/* ══════════════════════════════════════════
   script.js — Ethical Hacking Cheat Sheet
   Features:
     1. Copy buttons on every command
     2. Real-time search (filters cards + highlights matches)
     3. Scroll-spy active nav link
     4. Mobile drawer open/close
══════════════════════════════════════════ */

// ── SVG icons ────────────────────────────
const ICON_COPY = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2zm2-1a1
    1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6zM2 5a1 1 0 0 0-1
    1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0
    1 2-2h1v1H2z"/>
</svg>COPY`;

const ICON_COPIED = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1
    1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
</svg>COPIED`;

// ════════════════════════════════════════
// 1. COPY BUTTONS
// ════════════════════════════════════════
function initCopyButtons() {
  document.querySelectorAll('code.cmd').forEach(cmd => {
    const wrap = document.createElement('div');
    wrap.className = 'cmd-wrap';
    cmd.parentNode.insertBefore(wrap, cmd);
    wrap.appendChild(cmd);
    cmd.style.margin = '0';

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy command');
    btn.innerHTML = ICON_COPY;
    wrap.appendChild(btn);

    btn.addEventListener('click', () => {
      // Strip the CSS-injected "$ " prompt prefix if present
      const text = cmd.innerText.replace(/^\$ /, '');
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = ICON_COPIED;
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = ICON_COPY;
          btn.classList.remove('copied');
        }, 1800);
      }).catch(err => console.error('Clipboard error:', err));
    });
  });
}

// ════════════════════════════════════════
// 2. SEARCH
// ════════════════════════════════════════
function initSearch() {
  const desktopInput = document.getElementById('searchInputDesktop');
  const mobileInput  = document.getElementById('searchInputMobile');
  const clearDesktop = document.getElementById('clearDesktop');
  const clearMobile  = document.getElementById('clearMobile');
  const resultsCount = document.getElementById('resultsCount');
  const noResults    = document.getElementById('noResults');
  const noResultsQ   = document.getElementById('noResultsQuery');

  // Sync both inputs so they always show the same query
  function syncInputs(value) {
    desktopInput.value = value;
    mobileInput.value  = value;
    clearDesktop.classList.toggle('visible', value.length > 0);
    clearMobile.classList.toggle('visible',  value.length > 0);
  }

  function runSearch(raw) {
    const query = raw.trim().toLowerCase();
    syncInputs(raw);

    const cards   = document.querySelectorAll('.card');
    const banners = document.querySelectorAll('.phase-banner');

    // Remove previous highlights
    document.querySelectorAll('.search-highlight').forEach(el => {
      el.outerHTML = el.textContent;
    });

    if (!query) {
      // Show everything
      cards.forEach(c   => c.classList.remove('search-hidden'));
      banners.forEach(b => b.classList.remove('search-hidden'));
      resultsCount.textContent = '';
      noResults.classList.remove('visible');
      return;
    }

    let visibleCards = 0;

    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (text.includes(query)) {
        card.classList.remove('search-hidden');
        visibleCards++;
        highlightInCard(card, query);
      } else {
        card.classList.add('search-hidden');
      }
    });

    // Hide banners with no visible cards after them
    banners.forEach(banner => {
      // Look for next sibling cards until the next banner
      let next = banner.nextElementSibling;
      let hasVisible = false;
      while (next && !next.classList.contains('phase-banner')) {
        if (next.classList.contains('card') && !next.classList.contains('search-hidden')) {
          hasVisible = true;
          break;
        }
        next = next.nextElementSibling;
      }
      banner.classList.toggle('search-hidden', !hasVisible);
    });

    // Results count
    if (visibleCards > 0) {
      resultsCount.textContent = `${visibleCards} section${visibleCards !== 1 ? 's' : ''} found`;
      noResults.classList.remove('visible');
    } else {
      resultsCount.textContent = '';
      noResultsQ.textContent = raw;
      noResults.classList.add('visible');
    }
  }

  // Highlight matched text inside a card
  function highlightInCard(card, query) {
    // Only highlight in text nodes inside .entry-label and .cmd elements
    const targets = card.querySelectorAll('.entry-label, code.cmd, .tip');
    targets.forEach(el => {
      highlightTextNodes(el, query);
    });
  }

  function highlightTextNodes(el, query) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(textNode => {
      const lower = textNode.textContent.toLowerCase();
      if (!lower.includes(query)) return;

      const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
      const html = textNode.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
      const span = document.createElement('span');
      span.innerHTML = html;
      textNode.parentNode.replaceChild(span, textNode);
    });
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Wire up both inputs
  desktopInput.addEventListener('input', e => runSearch(e.target.value));
  mobileInput.addEventListener('input',  e => runSearch(e.target.value));

  clearDesktop.addEventListener('click', () => runSearch(''));
  clearMobile.addEventListener('click',  () => runSearch(''));

  // Keyboard shortcut: / to focus search
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== desktopInput && document.activeElement !== mobileInput) {
      e.preventDefault();
      const isMobile = window.innerWidth <= 860;
      (isMobile ? mobileInput : desktopInput).focus();
    }
    if (e.key === 'Escape') {
      runSearch('');
      desktopInput.blur();
      mobileInput.blur();
    }
  });
}

// ════════════════════════════════════════
// 3. SCROLL-SPY (active nav link)
// ════════════════════════════════════════
function initScrollSpy() {
  const navLinks = document.querySelectorAll('.nav-link');
  const cardIds  = Array.from(navLinks)
    .map(a => a.getAttribute('href').replace('#', ''))
    .filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) {
          active.classList.add('active');
          // Scroll nav to keep active item visible
          active.scrollIntoView({ block: 'nearest' });
        }
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px', threshold: 0 });

  cardIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  // Smooth scroll + close drawer on nav link click
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const id = link.getAttribute('href').replace('#', '');
      const target = document.getElementById(id);
      if (target) {
        const offset = window.innerWidth <= 860 ? 64 : 16;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
      closeDrawer();
    });
  });
}

// ════════════════════════════════════════
// 4. MOBILE DRAWER
// ════════════════════════════════════════
function initDrawer() {
  const sidebar       = document.getElementById('sidebar');
  const hamburgerBtn  = document.getElementById('hamburgerBtn');
  const sidebarClose  = document.getElementById('sidebarClose');
  const overlay       = document.getElementById('drawerOverlay');

  hamburgerBtn.addEventListener('click', () => {
    const isOpen = document.getElementById('sidebar').classList.contains('open');
    isOpen ? closeDrawer() : openDrawer();
  });
  sidebarClose.addEventListener('click', closeDrawer);
  overlay.addEventListener('click',      closeDrawer);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });
}

function openDrawer() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('visible');
  document.body.style.overflow = '';
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initCopyButtons();
  initSearch();
  initScrollSpy();
  initDrawer();
});