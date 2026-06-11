export function renderLoader() {
  return `<div class="page-loader"><div class="loader" role="status" aria-label="Loading"></div></div>`;
}

export function showLoader(container) {
  if (container) container.innerHTML = renderLoader();
}
