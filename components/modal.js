import { icons } from './icons.js';
import { escapeHtml } from '../utils/helpers.js';

export function createModal({ title, content, footer, onClose }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal__header">
        <h3 id="modal-title">${escapeHtml(title)}</h3>
        <button type="button" class="btn btn--ghost modal-close" aria-label="Close">${icons.close}</button>
      </div>
      <div class="modal__body">${content}</div>
      ${footer ? `<div class="modal__footer">${footer}</div>` : ''}
    </div>
  `;

  const close = () => {
    overlay.classList.remove('is-open');
    setTimeout(() => {
      overlay.remove();
      if (onClose) onClose();
    }, 250);
  };

  overlay.querySelector('.modal-close').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-open'));

  return { overlay, close };
}
