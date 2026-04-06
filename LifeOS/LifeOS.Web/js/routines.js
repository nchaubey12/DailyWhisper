import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, openModal, closeModal, showToast } from './ui.js';

protectPage();
initUI();

let routines = [];
let currentRoutineId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadRoutines();
    initEventListeners();
});

async function loadRoutines() {
    try {
        const result = await api.get('/routines');
        // FIX: guard against null / non-array response
        routines = Array.isArray(result) ? result : [];
        renderRoutines(routines);
    } catch (error) {
        console.error('Failed to load routines:', error);
        showToast('Failed to load routines — check the backend is running', 'error');
        routines = [];
        renderRoutines([]);
    }
}

function renderRoutines(routinesToRender = routines) {
    const container = document.getElementById('routinesContainer');
    if (!container) return;

    if (!routinesToRender || routinesToRender.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:3rem; color:var(--text-tertiary);">
                <div style="font-size:3rem;">🔁</div>
                <p>No routines yet. Click <strong>+ New Routine</strong> to get started.</p>
            </div>`;
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    container.innerHTML = routinesToRender.map(routine => {
        // FIX: guard completionLog which may be null/undefined
        const completionLog = Array.isArray(routine.completionLog) ? routine.completionLog : [];
        const isCompletedToday = completionLog.some(date =>
            (date || '').split('T')[0] === today
        );

        return `
            <div class="card" data-id="${routine.id}" style="cursor: pointer;">
                <div class="card-header">
                    <h4 style="margin: 0;">${escapeHtml(routine.title || 'Untitled')}</h4>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        ${(routine.streak || 0) > 0
                            ? `<span style="font-size: 1.25rem;">🔥 ${routine.streak}</span>` : ''}
                        ${routine.isActive
                            ? '<span class="badge badge-success">Active</span>'
                            : '<span class="badge">Inactive</span>'}
                    </div>
                </div>
                <div class="card-content">
                    <p>${escapeHtml(routine.description || '')}</p>
                    <div style="margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-secondary);">
                        📅 ${getFrequencyText(routine)}
                        ${routine.timeOfDay ? ` • ⏰ ${routine.timeOfDay}` : ''}
                    </div>
                </div>
                <div class="card-footer">
                    ${isCompletedToday
                        ? '<span class="badge badge-success">✓ Done Today</span>'
                        : `<button class="btn btn-sm btn-primary checkin-btn" data-id="${routine.id}"
                                  onclick="event.stopPropagation()">Check In</button>`}
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.card[data-id]').forEach(card => {
        card.addEventListener('click', () => editRoutine(card.dataset.id));
    });

    document.querySelectorAll('.checkin-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await checkIn(btn.dataset.id);
        });
    });
}

function getFrequencyText(routine) {
    if (routine.frequency === 'Daily') return 'Daily';
    if (routine.frequency === 'Weekly') {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const days = (routine.daysOfWeek || []).map(d => dayNames[d] || d).join(', ');
        return `Weekly${days ? ` (${days})` : ''}`;
    }
    return routine.frequency || 'Custom';
}

function initEventListeners() {
    document.getElementById('newRoutineBtn')?.addEventListener('click', () => {
        currentRoutineId = null;
        resetForm();
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) titleEl.textContent = 'New Routine';
        document.getElementById('deleteRoutineBtn')?.classList.add('hidden');
        openModal('routineModal');
    });

    document.getElementById('routineForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveRoutine();
    });

    document.getElementById('deleteRoutineBtn')?.addEventListener('click', async () => {
        if (currentRoutineId && confirm('Are you sure you want to delete this routine?')) {
            await deleteRoutine(currentRoutineId);
        }
    });
}

async function saveRoutine() {
    const title = (document.getElementById('routineTitle')?.value || '').trim();
    if (!title) {
        showToast('Please enter a title', 'error');
        return;
    }

    const routineData = {
        title,
        description: document.getElementById('routineDescription')?.value || '',
        frequency:   document.getElementById('routineFrequency')?.value || 'Daily',
        daysOfWeek:  [],
        timeOfDay:   document.getElementById('routineTime')?.value || null,
        isActive:    document.getElementById('routineActive')?.checked ?? true
    };

    // Normalise timeOfDay — empty string → null so backend doesn't choke
    if (!routineData.timeOfDay) routineData.timeOfDay = null;

    try {
        if (currentRoutineId) {
            await api.put(`/routines/${currentRoutineId}`, routineData);
            showToast('Routine updated successfully', 'success');
        } else {
            await api.post('/routines', routineData);
            showToast('Routine created successfully', 'success');
        }
        closeModal('routineModal');
        await loadRoutines();
    } catch (error) {
        console.error('Failed to save routine:', error);
        showToast(`Failed to save routine: ${error.message}`, 'error');
    }
}

async function editRoutine(routineId) {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    currentRoutineId = routineId;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('routineTitle',       routine.title || '');
    set('routineDescription', routine.description || '');
    set('routineFrequency',   routine.frequency || 'Daily');
    set('routineTime',        routine.timeOfDay || '');

    const activeEl = document.getElementById('routineActive');
    if (activeEl) activeEl.checked = !!routine.isActive;

    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = 'Edit Routine';
    document.getElementById('deleteRoutineBtn')?.classList.remove('hidden');
    openModal('routineModal');
}

async function deleteRoutine(routineId) {
    try {
        await api.delete(`/routines/${routineId}`);
        showToast('Routine deleted successfully', 'success');
        closeModal('routineModal');
        await loadRoutines();
    } catch (error) {
        console.error('Failed to delete routine:', error);
        showToast(`Failed to delete routine: ${error.message}`, 'error');
    }
}

async function checkIn(routineId) {
    try {
        await api.post(`/routines/${routineId}/checkin`);
        showToast('Routine checked in! 🎉', 'success');
        await loadRoutines();
    } catch (error) {
        console.error('Failed to check in:', error);
        showToast(`Failed to check in: ${error.message}`, 'error');
    }
}

function resetForm() {
    document.getElementById('routineForm')?.reset();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}