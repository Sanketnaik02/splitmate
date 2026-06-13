const PREFIX = 'splitmate_';

function getAll(name) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAll(name, data) {
  localStorage.setItem(PREFIX + name, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export const store = {
  add(collection, doc) {
    const list = getAll(collection);
    const entry = { ...doc, id: generateId(), createdAt: new Date().toISOString() };
    list.push(entry);
    saveAll(collection, list);
    return entry;
  },

  update(collection, id, updates) {
    const list = getAll(collection);
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
    saveAll(collection, list);
    return list[idx];
  },

  remove(collection, id) {
    const list = getAll(collection).filter((d) => d.id !== id);
    saveAll(collection, list);
  },

  get(collection, id) {
    return getAll(collection).find((d) => d.id === id) || null;
  },

  getAll,

  where(collection, field, value) {
    return getAll(collection).filter((d) => d[field] === value);
  },

  whereIn(collection, field, values) {
    const set = new Set(values);
    return getAll(collection).filter((d) => set.has(d[field]));
  },

  query(collection, predicate) {
    return getAll(collection).filter(predicate);
  },
};
