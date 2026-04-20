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

/**
 * Wraps every <code class="cmd"> in a flex container and appends a copy button.
 * The button copies the command text (stripping the leading "$ " prompt).
 */
function initCopyButtons() {
  document.querySelectorAll('code.cmd').forEach(cmd => {
    // Build wrapper
    const wrap = document.createElement('div');
    wrap.className = 'cmd-wrap';
    cmd.parentNode.insertBefore(wrap, cmd);
    wrap.appendChild(cmd);
    cmd.style.margin = '0';

    // Build button
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy command');
    btn.innerHTML = ICON_COPY;
    wrap.appendChild(btn);

    // Copy handler
    btn.addEventListener('click', () => {
      const text = cmd.innerText.replace(/^\$ /, '');

      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = ICON_COPIED;
        btn.classList.add('copied');

        setTimeout(() => {
          btn.innerHTML = ICON_COPY;
          btn.classList.remove('copied');
        }, 1800);
      }).catch(err => {
        console.error('Clipboard write failed:', err);
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', initCopyButtons);
