// Canonical ordering of the day's to-do items. Mirrors the comparator used by
// the classic list and the move-up/down handlers in App.jsx: explicit sortOrder
// first, then priority (with 'missing' last), then name.
export const priorityRank = (p) => (p === 'missing' ? 9999 : (p ?? 9999));

export const compareItems = (a, b) => {
  const ao = a.sortOrder ?? 9999, bo = b.sortOrder ?? 9999;
  if (ao !== bo) return ao - bo;
  const pa = priorityRank(a.priority), pb = priorityRank(b.priority);
  if (pa !== pb) return pa - pb;
  return (a.name || '').localeCompare(b.name || '');
};

export const sortItems = (items) => [...items].sort(compareItems);
