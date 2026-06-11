export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getDateRange(preset) {
  const now = new Date();
  const end = endOfDay(now);
  let start = startOfDay(now);

  switch (preset) {
    case 'today':
      break;
    case '7days':
      start.setDate(start.getDate() - 6);
      break;
    case '15days':
      start.setDate(start.getDate() - 14);
      break;
    case '30days':
      start.setDate(start.getDate() - 29);
      break;
    default:
      break;
  }

  return { start, end };
}

export function getDaysBetween(start, end) {
  const days = [];
  const current = startOfDay(start);
  const last = startOfDay(end);
  while (current <= last) {
    days.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function getWeekLabels(dates) {
  const weeks = {};
  dates.forEach((dateStr) => {
    const d = new Date(dateStr);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weeks[key]) weeks[key] = { label: `Week of ${key}`, revenue: 0, count: 0 };
  });
  return weeks;
}

export function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function isOverdue(dueDate) {
  const due = new Date(dueDate);
  return due < startOfDay(new Date());
}
