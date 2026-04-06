import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, openModal, closeModal, showToast } from './ui.js';

protectPage();
initUI();

// ── State ─────────────────────────────────────────────────────────────────────
let deadlines    = [];
let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let editingId    = null;

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// ── Entry point ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadDeadlines();
    bindEvents();
});

// ── Data ──────────────────────────────────────────────────────────────────────
async function loadDeadlines() {
    try {
        const result = await api.get('/deadlines');
        deadlines = Array.isArray(result) ? result : [];
    } catch (err) {
        console.error('loadDeadlines failed:', err);
        deadlines = [];
    }
    renderCalendar();
    renderList();
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function renderCalendar() {
    const monthEl = document.getElementById('currentMonth');
    const gridEl  = document.getElementById('calendarGrid');
    if (!monthEl || !gridEl) return;

    monthEl.textContent = `${MONTHS[currentMonth]} ${currentYear}`;

    const today     = new Date();
    const todayKey  = fmtDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const firstDay  = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMo  = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevDays  = new Date(currentYear, currentMonth, 0).getDate();

    // Build count map for current month
    const counts = {};
    deadlines.forEach(d => {
        if (!d.dueDate) return;
        // Parse yyyy-mm-dd without timezone shift
        const parts = d.dueDate.split('T')[0].split('-');
        if (parts.length === 3) {
            const k = `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
            counts[k] = (counts[k] || 0) + 1;
        }
    });

    let html = '';

    // Day-of-week headers
    ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(h => {
        html += `<div class="calendar-day-header">${h}</div>`;
    });

    // Leading blank cells (prev month days)
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day other-month">${prevDays - firstDay + 1 + i}</div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMo; d++) {
        const k     = fmtDate(currentYear, currentMonth + 1, d);
        const count = counts[k] || 0;
        const cls   = ['calendar-day',
                        k === todayKey ? 'today' : '',
                        count > 0      ? 'has-deadline' : '']
                       .filter(Boolean).join(' ');
        const badge = count > 0 ? `<span class="deadline-count">${count}</span>` : '';
        html += `<div class="${cls}" data-date="${k}">${d}${badge}</div>`;
    }

    // Trailing blank cells (next month)
    const total    = firstDay + daysInMo;
    const trailing = total % 7 ? 7 - (total % 7) : 0;
    for (let i = 1; i <= trailing; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    gridEl.innerHTML = html;

    // Clicking a calendar cell: if deadlines exist on that day → scroll to them,
    // otherwise → open "New Deadline" modal with the date pre-filled
    gridEl.querySelectorAll('.calendar-day[data-date]').forEach(cell => {
        cell.addEventListener('click', () => {
            const date = cell.dataset.date;
            const card = document.querySelector(`[data-dl-date="${date}"]`);
            if (card) {
                // Has existing deadline — scroll & highlight
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.style.outline = '2px solid var(--primary-color)';
                setTimeout(() => { card.style.outline = ''; }, 1600);
            } else {
                // No deadline — open modal with date pre-filled
                editingId = null;
                document.getElementById('deadlineForm')?.reset();
                const titleEl = document.getElementById('modalTitle');
                if (titleEl) titleEl.textContent = 'New Deadline';
                const catEl = document.getElementById('deadlineCategory');
                if (catEl) catEl.value = 'General';
                const priEl = document.getElementById('deadlinePriority');
                if (priEl) priEl.value = 'Medium';
                const dateEl = document.getElementById('deadlineDueDate');
                if (dateEl) dateEl.value = date;
                document.getElementById('deleteDeadlineBtn')?.classList.add('hidden');
                openModal('deadlineModal');
            }
        });
    });
}

function fmtDate(y, m, d) {
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ── Deadline list ─────────────────────────────────────────────────────────────
function renderList() {
    const container  = document.getElementById('deadlinesContainer');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    if (!deadlines.length) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    if (emptyState) emptyState.classList.add('hidden');

    const sorted = [...deadlines].sort((a, b) => {
        if (!!a.isCompleted !== !!b.isCompleted) return a.isCompleted ? 1 : -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
    });

    container.innerHTML = sorted.map(d => {
        const id      = d.id;
        const done    = !!d.isCompleted;
        const pri     = d.priority || 'Medium';
        const priClr  = { High: 'var(--danger-color)', Medium: 'var(--warning-color)', Low: 'var(--success-color)' }[pri] || 'var(--warning-color)';

        // Safe date display without timezone shift
        const parts   = (d.dueDate || '').split('T')[0].split('-');
        const dateKey = parts.length === 3
            ? `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`
            : '';
        const dueFmt  = dateKey
            ? new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '';

        const today    = new Date(); today.setHours(0,0,0,0);
        const dueDay   = dateKey ? new Date(`${dateKey}T12:00:00`) : null;
        const overdue  = !done && dueDay && dueDay < today;

        return `
        <div class="card" style="margin-bottom:.75rem;opacity:${done ? '0.6' : '1'};" data-dl-date="${dateKey}">
          <div class="card-content" style="display:flex;align-items:flex-start;gap:1rem;">
            <button class="btn btn-sm" title="Toggle complete"
              style="min-width:32px;height:32px;border-radius:50%;padding:0;flex-shrink:0;margin-top:2px;
                     background:${done ? 'var(--success-color)' : 'var(--bg-tertiary)'};
                     color:${done ? '#fff' : 'var(--text-secondary)'};"
              onclick="dlToggle('${id}')">
              ${done ? '✓' : '○'}
            </button>

            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;">
                <span style="font-weight:600;font-size:.95rem;text-decoration:${done ? 'line-through' : 'none'};">
                  ${escapeHtml(d.title)}
                </span>
                <span style="background:${priClr}22;color:${priClr};padding:1px 8px;border-radius:99px;font-size:.72rem;font-weight:600;">
                  ${pri}
                </span>
                <span style="background:var(--bg-tertiary);color:var(--text-secondary);padding:1px 8px;border-radius:99px;font-size:.72rem;">
                  ${escapeHtml(d.category || 'General')}
                </span>
              </div>
              ${d.description ? `<div style="color:var(--text-secondary);font-size:.875rem;margin-top:.25rem;">${escapeHtml(d.description)}</div>` : ''}
              <div style="font-size:.8rem;margin-top:.35rem;color:${overdue ? 'var(--danger-color)' : 'var(--text-secondary)'};">
                ${overdue ? '⚠️ Overdue · ' : '📅 '}${dueFmt}${d.dueTime ? ' · ' + d.dueTime : ''}
              </div>
            </div>

            <button class="btn btn-sm btn-secondary" style="flex-shrink:0;" onclick="dlEdit('${id}')">✏️</button>
          </div>
        </div>`;
    }).join('');
}

// ── Global onclick handlers ───────────────────────────────────────────────────
window.dlToggle = async (id) => {
    const d = deadlines.find(x => x.id === id);
    if (!d) return;
    try {
        await api.put(`/deadlines/${id}`, { ...d, isCompleted: !d.isCompleted });
        showToast(!d.isCompleted ? 'Marked complete ✓' : 'Marked incomplete', 'success');
        await loadDeadlines();
    } catch (err) {
        console.error('dlToggle error:', err);
        showToast('Failed to update deadline', 'error');
    }
};

window.dlEdit = (id) => {
    const d = deadlines.find(x => x.id === id);
    if (!d) return;
    editingId = id;

    const parts   = (d.dueDate || '').split('T')[0];
    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };

    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = 'Edit Deadline';

    set('deadlineTitle',       d.title);
    set('deadlineDescription', d.description);
    set('deadlineDueDate',     parts);
    set('deadlineDueTime',     d.dueTime);
    set('deadlineCategory',    d.category || 'General');
    set('deadlinePriority',    d.priority || 'Medium');

    const compEl = document.getElementById('deadlineCompleted');
    if (compEl) compEl.checked = !!d.isCompleted;

    document.getElementById('deleteDeadlineBtn')?.classList.remove('hidden');
    openModal('deadlineModal');
};

// ── Event bindings ────────────────────────────────────────────────────────────
function bindEvents() {
    // New Deadline button
    document.getElementById('newDeadlineBtn')?.addEventListener('click', () => {
        editingId = null;
        document.getElementById('deadlineForm')?.reset();
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) titleEl.textContent = 'New Deadline';
        const catEl = document.getElementById('deadlineCategory');
        if (catEl) catEl.value = 'General';
        const priEl = document.getElementById('deadlinePriority');
        if (priEl) priEl.value = 'Medium';
        document.getElementById('deleteDeadlineBtn')?.classList.add('hidden');
        openModal('deadlineModal');
    });

    // Month navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        renderCalendar();
    });
    document.getElementById('nextMonth')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        renderCalendar();
    });

    // Form save
    document.getElementById('deadlineForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title   = (document.getElementById('deadlineTitle')?.value || '').trim();
        const dueDate = document.getElementById('deadlineDueDate')?.value || '';
        if (!title || !dueDate) {
            showToast('Title and due date are required', 'error');
            return;
        }
        const payload = {
            title,
            description: (document.getElementById('deadlineDescription')?.value || '').trim(),
            dueDate,
            dueTime:     document.getElementById('deadlineDueTime')?.value  || null,
            category:    (document.getElementById('deadlineCategory')?.value || 'General').trim(),
            priority:    document.getElementById('deadlinePriority')?.value  || 'Medium',
            isCompleted: document.getElementById('deadlineCompleted')?.checked || false,
        };
        try {
            if (editingId) {
                await api.put(`/deadlines/${editingId}`, { ...payload, id: editingId });
                showToast('Deadline updated', 'success');
            } else {
                await api.post('/deadlines', payload);
                showToast('Deadline created', 'success');
            }
            closeModal('deadlineModal');
            await loadDeadlines();
        } catch (err) {
            console.error('save error:', err);
            showToast('Failed to save deadline', 'error');
        }
    });

    // Delete
    document.getElementById('deleteDeadlineBtn')?.addEventListener('click', async () => {
        if (!editingId || !confirm('Delete this deadline?')) return;
        try {
            await api.delete(`/deadlines/${editingId}`);
            showToast('Deadline deleted', 'success');
            closeModal('deadlineModal');
            await loadDeadlines();
        } catch (err) {
            console.error('delete error:', err);
            showToast('Failed to delete deadline', 'error');
        }
    });
}

// ── Utility ───────────────────────────────────────────────────────────────────
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}