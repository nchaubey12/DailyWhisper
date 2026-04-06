/**
 * LifeOS api.js — Self-contained localStorage adapter
 * DROP THIS FILE in: LifeOS.Web/js/api.js
 *
 * This replaces the original api.js that called localhost:5000 (backend not running).
 * All storage logic is inline — no separate storage.js import needed.
 * The interface is identical: api.get(), api.post(), api.put(), api.patch(), api.delete()
 */

// ─── Storage helpers (inline) ─────────────────────────────────────────────────

const KEYS = {
  notes: 'lifeos_notes',
  goals: 'lifeos_goals',
  deadlines: 'lifeos_deadlines',
  routines: 'lifeos_routines',
  thoughts: 'lifeos_thoughts',
};

function uid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function now() { return new Date().toISOString(); }

function load(type) {
  try { return JSON.parse(localStorage.getItem(KEYS[type]) || '[]'); }
  catch { return []; }
}

function save(type, items) {
  localStorage.setItem(KEYS[type], JSON.stringify(items));
}

function upsert(type, data, defaults = {}) {
  const items = load(type);
  if (!data.id) {
    // CREATE
    const item = { ...defaults, ...data, id: uid(), createdAt: now(), updatedAt: now() };
    items.push(item);
    save(type, items);
    return item;
  }
  // UPDATE
  const idx = items.findIndex(i => i.id === data.id);
  if (idx === -1) throw new Error(`${type} item not found: ${data.id}`);
  items[idx] = { ...items[idx], ...data, updatedAt: now() };
  save(type, items);
  return items[idx];
}

function remove(type, id) {
  save(type, load(type).filter(i => i.id !== id));
}

// ─── Domain logic ─────────────────────────────────────────────────────────────

const Store = {
  // ── Notes ──────────────────────────────────────────────────────────────────
  'GET /notes': () =>
    load('notes').sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    }),

  'POST /notes': (data) => upsert('notes', {
    title: data.title || '',
    content: data.content || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    color: data.color || '#fef3c7',
    isPinned: false,
    ...data,
  }),

  'PUT /notes/:id': (data, id) => upsert('notes', { ...data, id }),

  'DELETE /notes/:id': (_, id) => remove('notes', id),

  'PATCH /notes/:id/pin': (_, id) => {
    const items = load('notes');
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Note not found');
    items[idx].isPinned = !items[idx].isPinned;
    items[idx].updatedAt = now();
    save('notes', items);
    return items[idx];
  },

  // ── Goals ──────────────────────────────────────────────────────────────────
  'GET /goals': () =>
    load('goals').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

  'POST /goals': (data) => upsert('goals', {
    title: data.title || '',
    description: data.description || '',
    category: data.category || 'General',
    priority: data.priority || 'Medium',
    status: data.status || 'NotStarted',
    progress: Number(data.progress) || 0,
    targetDate: data.targetDate || null,
    milestones: [],
    ...data,
  }),

  'PUT /goals/:id': (data, id) => upsert('goals', { ...data, id }),

  'DELETE /goals/:id': (_, id) => remove('goals', id),

  // ── Deadlines ──────────────────────────────────────────────────────────────
  'GET /deadlines': () =>
    load('deadlines').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),

  'POST /deadlines': (data) => upsert('deadlines', {
    title: data.title || '',
    description: data.description || '',
    dueDate: data.dueDate || now().split('T')[0],
    dueTime: data.dueTime || null,
    category: data.category || 'General',
    priority: data.priority || 'Medium',
    isCompleted: data.isCompleted ?? false,
    ...data,
  }),

  'PUT /deadlines/:id': (data, id) => upsert('deadlines', { ...data, id }),

  'DELETE /deadlines/:id': (_, id) => remove('deadlines', id),

  // ── Routines ───────────────────────────────────────────────────────────────
  'GET /routines': () =>
    load('routines').sort((a, b) => a.title.localeCompare(b.title)),

  'POST /routines': (data) => upsert('routines', {
    title: data.title || '',
    description: data.description || '',
    frequency: data.frequency || 'Daily',
    daysOfWeek: data.daysOfWeek || [],
    timeOfDay: data.timeOfDay || null,
    isActive: data.isActive ?? true,
    streak: 0,
    completionLog: [],
    ...data,
  }),

  'PUT /routines/:id': (data, id) => upsert('routines', { ...data, id }),

  'DELETE /routines/:id': (_, id) => remove('routines', id),

  'POST /routines/:id/checkin': (_, id) => {
    const items = load('routines');
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Routine not found');
    const today = now().split('T')[0];
    const alreadyDone = items[idx].completionLog.some(d => d.split('T')[0] === today);
    if (!alreadyDone) {
      items[idx].completionLog.push(now());
      // Recalculate streak
      const days = [...new Set(items[idx].completionLog.map(d => d.split('T')[0]))].sort().reverse();
      let streak = 0;
      const today2 = new Date();
      for (let i = 0; i < days.length; i++) {
        const exp = new Date(today2);
        exp.setDate(today2.getDate() - i);
        if (days[i] === exp.toISOString().split('T')[0]) streak++;
        else break;
      }
      items[idx].streak = streak;
      items[idx].updatedAt = now();
      save('routines', items);
    }
    return items[idx];
  },

  // ── Thoughts ───────────────────────────────────────────────────────────────
  'GET /thoughts': () =>
    load('thoughts').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

  'POST /thoughts': (data) => upsert('thoughts', {
    content: data.content || '',
    mood: data.mood || 'Neutral',
    tags: Array.isArray(data.tags) ? data.tags : [],
    isPrivate: data.isPrivate ?? true,
    ...data,
  }),

  'PUT /thoughts/:id': (data, id) => upsert('thoughts', { ...data, id }),

  'DELETE /thoughts/:id': (_, id) => remove('thoughts', id),

  'GET /thoughts/mood-summary': () => {
    const thoughts = load('thoughts');
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recent = thoughts.filter(t => new Date(t.createdAt) >= cutoff);
    const summary = { Happy: 0, Neutral: 0, Sad: 0, Anxious: 0, Excited: 0 };
    recent.forEach(t => { if (t.mood in summary) summary[t.mood]++; });
    return summary;
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  'GET /dashboard/summary': () => {
    const notes     = Store['GET /notes']();
    const goals     = Store['GET /goals']();
    const deadlines = Store['GET /deadlines']();
    const routines  = Store['GET /routines']();
    const thoughts  = Store['GET /thoughts']();
    const today     = now().split('T')[0];

    const goalsByStatus = goals.reduce(
      (acc, g) => { acc[g.status] = (acc[g.status] || 0) + 1; return acc; },
      { Completed: 0, InProgress: 0, NotStarted: 0 }
    );

    return {
      totalNotes: notes.length,
      pinnedNotes: notes.filter(n => n.isPinned).length,
      goalsByStatus,
      upcomingDeadlines: deadlines.filter(d => !d.isCompleted && d.dueDate >= today).slice(0, 5),
      todaysRoutines: routines.filter(r => r.isActive).map(r => ({
        ...r,
        isCompletedToday: r.completionLog.some(d => d.split('T')[0] === today),
      })),
      currentStreaks: routines
        .filter(r => r.streak > 0)
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 5)
        .map(r => ({ routineTitle: r.title, streak: r.streak })),
      latestThoughts: thoughts.slice(0, 3),
    };
  },
};

// ─── Router ───────────────────────────────────────────────────────────────────

function route(method, endpoint, data) {
  // Special-case mood-summary before the generic :id pattern
  if (method === 'GET' && endpoint === '/thoughts/mood-summary') {
    return Store['GET /thoughts/mood-summary']();
  }

  // Try exact match first
  const exactKey = `${method} ${endpoint}`;
  if (Store[exactKey]) return Store[exactKey](data);

  // Try :id param patterns  e.g. PUT /notes/abc123  →  PUT /notes/:id
  const parts = endpoint.split('/');        // ['', 'notes', 'abc123']
  const id    = parts[parts.length - 1];
  const sub   = parts[parts.length - 2];   // could be 'notes' or 'checkin'
  const base  = parts.slice(0, -1).join('/'); // '/notes' or '/routines/abc123'

  // Handle /routines/:id/checkin
  if (parts.length === 4) {
    const action  = parts[3];              // 'checkin'
    const itemId  = parts[2];
    const resource = parts[1];            // 'routines'
    const key = `${method} /${resource}/:id/${action}`;
    if (Store[key]) return Store[key](data, itemId);
  }

  // Handle /resource/:id  e.g. /notes/pin handled above; simple CRUD here
  const paramKey = `${method} ${base}/:id`;
  if (Store[paramKey]) return Store[paramKey](data, id);

  throw new Error(`Unhandled route: ${method} ${endpoint}`);
}

// ─── Auth stub (keeps auth.js happy) ─────────────────────────────────────────

function handleAuth(endpoint, data) {
  const user = { username: data?.emailOrUsername || data?.username || 'nchaubey', name: data?.username || data?.emailOrUsername || 'nchaubey' };
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);
  localStorage.setItem('token', 'local-token');
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('tokenExpiry', expiry.toISOString());
  return { success: true, token: 'local-token', user, expiry: expiry.toISOString() };
}

// ─── ApiClient (same interface as before) ─────────────────────────────────────

class ApiClient {
  getToken()  { return localStorage.getItem('token'); }

  async request(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const data   = options.body ? JSON.parse(options.body) : undefined;

    // Auth passthrough
    if (endpoint.startsWith('/auth/')) return handleAuth(endpoint, data);

    return new Promise((resolve, reject) => {
      try { resolve(route(method, endpoint, data)); }
      catch (e) { reject(e); }
    });
  }

  async get(endpoint)          { return this.request(endpoint, { method: 'GET' }); }
  async post(endpoint, data)   { return this.request(endpoint, { method: 'POST',  body: JSON.stringify(data) }); }
  async put(endpoint, data)    { return this.request(endpoint, { method: 'PUT',   body: JSON.stringify(data) }); }
  async patch(endpoint, data)  { return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(data || {}) }); }
  async delete(endpoint)       { return this.request(endpoint, { method: 'DELETE' }); }
}

const api = new ApiClient();
export default api;