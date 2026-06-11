/**
 * Chart.js wrapper for consistent chart rendering.
 */
let chartJsLoaded = false;

async function loadChartJs() {
  if (chartJsLoaded) return window.Chart;
  const module = await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.3/+esm');
  window.Chart = module.Chart;
  chartJsLoaded = true;
  return window.Chart;
}

export async function renderChart(canvas, config) {
  const Chart = await loadChartJs();
  const ctx = canvas.getContext('2d');

  if (canvas._chartInstance) {
    canvas._chartInstance.destroy();
  }

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  canvas._chartInstance = new Chart(ctx, {
    ...config,
    options: { ...defaultOptions, ...config.options }
  });

  return canvas._chartInstance;
}

export function destroyChart(canvas) {
  if (canvas?._chartInstance) {
    canvas._chartInstance.destroy();
    canvas._chartInstance = null;
  }
}
