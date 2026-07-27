// LocalStorage-backed runtime DB for Phase 7 mock auth & identity.
// Keys are namespaced under `erp.mock.<collection>`.

const PREFIX = 'erp.mock.';

export function getCollection<T = any>(name: string): T[] {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function setCollection<T = any>(name: string, rows: T[]) {
  localStorage.setItem(PREFIX + name, JSON.stringify(rows));
}

export function upsert<T extends { id: string }>(name: string, row: T) {
  const rows = getCollection<T>(name);
  const i = rows.findIndex(r => r.id === row.id);
  if (i >= 0) rows[i] = row;
  else rows.push(row);
  setCollection(name, rows);
  return row;
}

export function remove(name: string, id: string) {
  const rows = getCollection<{ id: string }>(name);
  setCollection(name, rows.filter(r => r.id !== id));
}

export function clearAll() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX) || k === 'erp.session')
    .forEach(k => localStorage.removeItem(k));
}

export function seedIfEmpty(seeds: Record<string, any[]>) {
  Object.entries(seeds).forEach(([name, rows]) => {
    if (!localStorage.getItem(PREFIX + name)) {
      setCollection(name, rows);
    }
  });
}

/** Force re-seed when the shipped SEED_VERSION changes (e.g. new demo credentials). */
export function seedIfVersionChanged(version: string, seeds: Record<string, any[]>) {
  const key = PREFIX + 'seed_version';
  const current = localStorage.getItem(key);
  if (current === version) {
    seedIfEmpty(seeds);
    return;
  }
  Object.entries(seeds).forEach(([name, rows]) => setCollection(name, rows));
  localStorage.setItem(key, version);
}


export function resetAll(seeds: Record<string, any[]>) {
  clearAll();
  Object.entries(seeds).forEach(([name, rows]) => setCollection(name, rows));
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}
