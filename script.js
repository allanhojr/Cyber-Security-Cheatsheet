/* ══════════════════════════════════════════
   script.js — Ethical Hacking Cheat Sheet
   Features:
     1. Copy buttons on every command
     2. Real-time search (all text OR commands only)
     3. Match count badge per card
     4. Search highlight
     5. Collapsible cards (click title to toggle)
     6. Difficulty badges (beginner / intermediate / advanced)
     7. Scroll-spy active nav link
     8. Dark / Light mode toggle (persisted in localStorage)
     9. Back to top button
    10. Mobile drawer open / close
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
// 2. DIFFICULTY BADGES
// ════════════════════════════════════════
function initDifficultyBadges() {
  document.querySelectorAll('.entry[data-level]').forEach(entry => {
    const level = entry.getAttribute('data-level');
    if (!level) return;
    const label = entry.querySelector('.entry-label');
    if (!label) return;

    const badge = document.createElement('span');
    badge.className = `level-badge ${level}`;
    badge.textContent = level === 'intermediate' ? 'MED' : level.toUpperCase().slice(0, 3);
    badge.title = level.charAt(0).toUpperCase() + level.slice(1);
    label.appendChild(badge);
  });
}

// ════════════════════════════════════════
// 3. COLLAPSIBLE CARDS
// ════════════════════════════════════════
function initCollapsibleCards() {
  document.querySelectorAll('.card').forEach(card => {
    const title = card.querySelector('.card-title');
    if (!title) return;

    // Wrap all sibling elements after the title into .card-body
    const body = document.createElement('div');
    body.className = 'card-body';

    // Move everything after the title into body
    let next = title.nextElementSibling;
    while (next) {
      const after = next.nextElementSibling;
      body.appendChild(next);
      next = after;
    }
    card.appendChild(body);

    // Add chevron to title
    const chevron = document.createElement('span');
    chevron.className = 'collapse-chevron';
    chevron.textContent = '▼';
    title.appendChild(chevron);

    // Toggle on title click
    title.addEventListener('click', () => {
      card.classList.toggle('collapsed');

      // Persist state per card id
      const id = card.id;
      if (id) {
        const collapsed = JSON.parse(sessionStorage.getItem('collapsed') || '{}');
        collapsed[id] = card.classList.contains('collapsed');
        sessionStorage.setItem('collapsed', JSON.stringify(collapsed));
      }
    });

    // Restore collapsed state
    const id = card.id;
    if (id) {
      const collapsed = JSON.parse(sessionStorage.getItem('collapsed') || '{}');
      if (collapsed[id]) card.classList.add('collapsed');
    }
  });
}

// ════════════════════════════════════════
// 4. SEARCH
// ════════════════════════════════════════
let searchMode = 'all'; // 'all' | 'cmd'

function initSearch() {
  const desktopInput = document.getElementById('searchInputDesktop');
  const mobileInput  = document.getElementById('searchInputMobile');
  const clearDesktop = document.getElementById('clearDesktop');
  const clearMobile  = document.getElementById('clearMobile');
  const resultsCount = document.getElementById('resultsCount');
  const noResults    = document.getElementById('noResults');
  const noResultsQ   = document.getElementById('noResultsQuery');
  const modeAll      = document.getElementById('modeAll');
  const modeCmds     = document.getElementById('modeCmds');

  // Mode toggle buttons
  if (modeAll && modeCmds) {
    modeAll.addEventListener('click', () => {
      searchMode = 'all';
      modeAll.classList.add('active');
      modeCmds.classList.remove('active');
      runSearch(desktopInput.value || mobileInput.value);
    });

    modeCmds.addEventListener('click', () => {
      searchMode = 'cmd';
      modeCmds.classList.add('active');
      modeAll.classList.remove('active');
      runSearch(desktopInput.value || mobileInput.value);
    });
  }

  function syncInputs(value) {
    if (desktopInput) desktopInput.value = value;
    if (mobileInput)  mobileInput.value  = value;
    if (clearDesktop) clearDesktop.classList.toggle('visible', value.length > 0);
    if (clearMobile)  clearMobile.classList.toggle('visible',  value.length > 0);
  }

  function runSearch(raw) {
    const query = raw.trim().toLowerCase();
    syncInputs(raw);

    const cards   = document.querySelectorAll('.card');
    const banners = document.querySelectorAll('.phase-banner');

    // Remove previous highlights and match badges
    document.querySelectorAll('.search-highlight').forEach(el => {
      el.outerHTML = el.textContent;
    });
    document.querySelectorAll('.match-badge').forEach(el => el.remove());

    if (!query) {
      cards.forEach(c   => c.classList.remove('search-hidden'));
      banners.forEach(b => b.classList.remove('search-hidden'));
      if (resultsCount) resultsCount.textContent = '';
      if (noResults)    noResults.classList.remove('visible');
      return;
    }

    let visibleCards = 0;

    cards.forEach(card => {
      // Determine what text to search based on mode
      let searchText;
      if (searchMode === 'cmd') {
        searchText = Array.from(card.querySelectorAll('code.cmd'))
          .map(c => c.textContent).join(' ').toLowerCase();
      } else {
        searchText = card.textContent.toLowerCase();
      }

      if (searchText.includes(query)) {
        card.classList.remove('search-hidden');
        visibleCards++;

        // Count matches and add badge
        const matchCount = countMatches(card, query);
        if (matchCount > 0) {
          const cardTitle = card.querySelector('.card-title');
          if (cardTitle) {
            const badge = document.createElement('span');
            badge.className = 'match-badge';
            badge.textContent = `${matchCount} match${matchCount !== 1 ? 'es' : ''}`;
            // Insert before the chevron if it exists
            const chevron = cardTitle.querySelector('.collapse-chevron');
            if (chevron) cardTitle.insertBefore(badge, chevron);
            else cardTitle.appendChild(badge);
          }
        }

        // Expand collapsed card so results are visible
        if (card.classList.contains('collapsed')) {
          card.classList.remove('collapsed');
        }

        highlightInCard(card, query);
      } else {
        card.classList.add('search-hidden');
      }
    });

    // Hide banners with no visible cards
    banners.forEach(banner => {
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

    if (visibleCards > 0) {
      if (resultsCount) resultsCount.textContent = `${visibleCards} card${visibleCards !== 1 ? 's' : ''} found`;
      if (noResults)    noResults.classList.remove('visible');
    } else {
      if (resultsCount) resultsCount.textContent = '';
      if (noResultsQ)   noResultsQ.textContent = raw;
      if (noResults)    noResults.classList.add('visible');
    }
  }

  function countMatches(card, query) {
    const targets = searchMode === 'cmd'
      ? card.querySelectorAll('code.cmd')
      : card.querySelectorAll('.entry-label, code.cmd, .tip');
    let count = 0;
    targets.forEach(el => {
      const text = el.textContent.toLowerCase();
      let pos = 0;
      while ((pos = text.indexOf(query, pos)) !== -1) { count++; pos += query.length; }
    });
    return count;
  }

  function highlightInCard(card, query) {
    const targets = searchMode === 'cmd'
      ? card.querySelectorAll('code.cmd')
      : card.querySelectorAll('.entry-label, code.cmd, .tip');
    targets.forEach(el => highlightTextNodes(el, query));
  }

  function highlightTextNodes(el, query) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(textNode => {
      if (!textNode.textContent.toLowerCase().includes(query)) return;
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

  if (desktopInput) desktopInput.addEventListener('input', e => runSearch(e.target.value));
  if (mobileInput)  mobileInput.addEventListener('input',  e => runSearch(e.target.value));
  if (clearDesktop) clearDesktop.addEventListener('click', () => runSearch(''));
  if (clearMobile)  clearMobile.addEventListener('click',  () => runSearch(''));

  document.addEventListener('keydown', e => {
    const active = document.activeElement;
    const inInput = active === desktopInput || active === mobileInput;

    if (e.key === '/' && !inInput) {
      e.preventDefault();
      const isMobile = window.innerWidth <= 860;
      (isMobile ? mobileInput : desktopInput)?.focus();
    }
    if (e.key === 'Escape') {
      runSearch('');
      desktopInput?.blur();
      mobileInput?.blur();
    }
  });
}

// ════════════════════════════════════════
// 5. SCROLL-SPY
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
          active.scrollIntoView({ block: 'nearest' });
        }
      }
    });
  }, { rootMargin: '-10% 0px -80% 0px', threshold: 0 });

  cardIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

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
// 6. DARK / LIGHT MODE TOGGLE
// ════════════════════════════════════════
function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);

  document.getElementById('themeToggleDesktop')?.addEventListener('click', toggleTheme);
  document.getElementById('themeToggleMobile')?.addEventListener('click',  toggleTheme);
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.classList.toggle('light', isLight);

  const icon = isLight ? '🌙' : '☀';
  const tip  = isLight ? 'Switch to dark mode' : 'Switch to light mode';
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = icon;
    btn.title = tip;
  });
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light');
  const next = isLight ? 'dark' : 'light';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

// ════════════════════════════════════════
// 7. BACK TO TOP
// ════════════════════════════════════════
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ════════════════════════════════════════
// 8. MOBILE DRAWER
// ════════════════════════════════════════
function initDrawer() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebarClose = document.getElementById('sidebarClose');
  const overlay      = document.getElementById('drawerOverlay');

  hamburgerBtn?.addEventListener('click', () => {
    const isOpen = document.getElementById('sidebar').classList.contains('open');
    isOpen ? closeDrawer() : openDrawer();
  });

  sidebarClose?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click',      closeDrawer);

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
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('visible');
  document.body.style.overflow = '';
}

// ════════════════════════════════════════
// INIT — order matters
// ════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initTheme();           // theme first so no flash
  initCopyButtons();
  initDifficultyBadges();
  initCollapsibleCards();
  initSearch();
  initScrollSpy();
  initBackToTop();
  initDrawer();
});