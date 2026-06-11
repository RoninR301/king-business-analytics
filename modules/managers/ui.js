export function renderManagerInfo(manager) {
  if (!manager) return '<p>No manager assigned</p>';
  return `<p><strong>${manager.name}</strong> — ${manager.email}</p>`;
}
