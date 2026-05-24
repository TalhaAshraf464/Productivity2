const WIDTH = 680;
const HEIGHT = 300;
const PADDING = { top: 22, right: 22, bottom: 54, left: 48 };

function renderChart(target, buckets, chartType) {
  const plot = getPlot();
  const maxValue = getNiceMax(buckets);
  const points = buckets.map((bucket, index) => getPoint(bucket, index, buckets.length, plot, maxValue));

  const parts = [
    `<title id="chart-description">Study time chart</title>`,
    renderGrid(plot, maxValue),
    chartType === 'line' ? renderLine(points, plot) : renderBars(points, buckets.length),
    renderLabels(points, buckets.length),
  ];

  target.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  target.innerHTML = parts.join('');
}

function getPlot() {
  return {
    left: PADDING.left,
    right: WIDTH - PADDING.right,
    top: PADDING.top,
    bottom: HEIGHT - PADDING.bottom,
    width: WIDTH - PADDING.left - PADDING.right,
    height: HEIGHT - PADDING.top - PADDING.bottom,
  };
}

function getPoint(bucket, index, count, plot, maxValue) {
  const step = count <= 1 ? 0 : plot.width / (count - 1);
  const x = count <= 1 ? plot.left + plot.width / 2 : plot.left + index * step;
  const y = plot.bottom - (bucket.value / maxValue) * plot.height;
  return { x, y, label: bucket.label, value: bucket.value };
}

function renderGrid(plot, maxValue) {
  let markup = '';
  [0, 0.25, 0.5, 0.75, 1].forEach((ratio) => {
    const y = plot.bottom - ratio * plot.height;
    markup += `<line class="chart-grid" x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}"></line>`;
    markup += `<text class="chart-axis-label" x="${plot.left - 8}" y="${y + 4}" text-anchor="end">${(ratio * maxValue).toFixed(1)}</text>`;
  });
  return markup;
}

function renderBars(points, count) {
  if (points.length === 0) return '';
  const plot = getPlot();
  const slot = plot.width / Math.max(count, 1);
  const barWidth = Math.max(4, slot * 0.62);

  return points.map((point, index) => {
    const x = plot.left + index * slot + (slot - barWidth) / 2;
    const height = Math.max(0, plot.bottom - point.y);
    return `<rect class="chart-bar" x="${x.toFixed(1)}" y="${point.y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${height.toFixed(1)}" rx="3"></rect>`;
  }).join('');
}

function renderLine(points, plot) {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const point = points[0];
    return `<circle class="chart-dot" cx="${point.x}" cy="${point.y}" r="4"></circle>`;
  }

  const linePath = smoothPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${linePath} L ${last.x.toFixed(1)},${plot.bottom} L ${first.x.toFixed(1)},${plot.bottom} Z`;
  const dots = points.length > 60 ? '' : points.map((point) =>
    `<circle class="chart-dot" cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="3"></circle>`
  ).join('');

  return `<path class="chart-area" d="${areaPath}"></path><path class="chart-line" d="${linePath}"></path>${dots}`;
}

function renderLabels(points, count) {
  const stride = Math.max(1, Math.ceil(count / 10));
  const y = HEIGHT - 22;

  return points.map((point, index) => {
    if (index % stride !== 0 && index !== points.length - 1) return '';
    return `<text class="chart-axis-label" x="${point.x.toFixed(1)}" y="${y}" text-anchor="middle">${point.label}</text>`;
  }).join('');
}

function smoothPath(points) {
  let path = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let index = 0; index < points.length - 1; index++) {
    const p0 = points[index - 1] || points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return path;
}

function getNiceMax(buckets) {
  const maxValue = Math.max(0.5, ...buckets.map((bucket) => bucket.value));
  if (maxValue <= 1) return 1;
  if (maxValue <= 2) return 2;
  if (maxValue <= 5) return 5;
  return Math.ceil(maxValue / 5) * 5;
}

export { renderChart };
