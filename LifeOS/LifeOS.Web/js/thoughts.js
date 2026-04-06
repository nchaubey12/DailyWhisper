/**
 * LifeOS — Thoughts / Journal
 *
 * Privacy system:
 * - isPrivate=true  → shown as a locked card; clicking prompts a 4-digit PIN
 * - isPrivate=false → visible to anyone without a PIN
 * PIN is stored in localStorage under 'lifeos_private_pin' (set once on first use)
 */

import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, openModal, closeModal, showToast, formatDate } from './ui.js';

protectPage();
initUI();

let thoughts = [];
let currentThoughtId = null;
let selectedMood = 'Neutral';

document.addEventListener('DOMContentLoaded', () => {
    loadThoughts();
    initEventListeners();
});

// ─── Load ─────────────────────────────────────────────────────────────────────

async function loadThoughts() {
    try {
        thoughts = await api.get('/thoughts');
        renderThoughts(thoughts);
        loadMoodSummary();
    } catch (error) {
        console.error('Failed to load thoughts:', error);
        showToast('Failed to load thoughts', 'error');
    }
}

async function loadMoodSummary() {
    try {
        const summary = await api.get('/thoughts/mood-summary');
        renderMoodChart(summary);
    } catch (error) {
        console.error('Failed to load mood summary:', error);
    }
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderThoughts(thoughtsToRender = thoughts) {
    const container = document.getElementById('thoughtsContainer');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    if (thoughtsToRender.length === 0) {
        container.innerHTML = '';
        emptyState?.classList.remove('hidden');
        return;
    }
    emptyState?.classList.add('hidden');

    container.innerHTML = thoughtsToRender.map(thought => {
        if (thought.isPrivate) {
            // Locked card — content hidden, click to unlock with PIN
            return `
        <div class="card private-locked-card" data-id="${thought.id}"
             style="cursor:pointer;margin-bottom:1rem;opacity:0.85;border:1.5px dashed var(--border-color);">
            <div class="card-header">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <span style="font-size:1.5rem;">🔒</span>
                    <span style="font-size:0.875rem;color:var(--text-secondary);">
                        ${formatDate(thought.createdAt)}
                    </span>
                </div>
                <span class="badge" style="background:var(--warning-color);color:#fff;">🔒 Private</span>
            </div>
            <div class="card-content">
                <p style="margin:0;color:var(--text-tertiary);font-style:italic;">
                    🔐 Enter your PIN to view this private thought
                </p>
            </div>
        </div>`;
        }
        // Public card — shown as normal
        return `
        <div class="card" data-id="${thought.id}" style="cursor:pointer;margin-bottom:1rem;">
            <div class="card-header">
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <span style="font-size:1.5rem;">${getMoodEmoji(thought.mood)}</span>
                    <span style="font-size:0.875rem;color:var(--text-secondary);">
                        ${formatDate(thought.createdAt)}
                    </span>
                </div>
            </div>
            <div class="card-content">
                <p style="white-space:pre-wrap;margin:0;">${escapeHtml(thought.content)}</p>
                ${thought.tags && thought.tags.length > 0 ? `
                    <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.6rem;">
                        ${thought.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>`;
    }).join('');

    // Public cards — open edit modal directly
    container.querySelectorAll('.card[data-id]:not(.private-locked-card)').forEach(card => {
        card.addEventListener('click', () => editThought(card.dataset.id));
    });

    // Private locked cards — prompt PIN before opening
    container.querySelectorAll('.private-locked-card[data-id]').forEach(card => {
        card.addEventListener('click', () => promptPinThenEdit(card.dataset.id));
    });
}

function renderMoodChart(moodData) {
    const chartContainer = document.getElementById('moodChart');
    if (!chartContainer) return;

    const moods = { Happy: '😊', Neutral: '😐', Sad: '😢', Anxious: '😰', Excited: '🤩' };
    const total = Object.values(moodData).reduce((a, b) => a + b, 0) || 1;

    chartContainer.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
            ${Object.entries(moodData).filter(([, count]) => count > 0).map(([mood, count]) => `
                <div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
                        <span>${moods[mood] || ''} ${mood}</span>
                        <span style="color:var(--text-secondary);">${count}</span>
                    </div>
                    <div style="height:6px;background:var(--bg-tertiary);border-radius:3px;">
                        <div style="height:100%;width:${Math.round(count/total*100)}%;
                             background:${getMoodColor(mood)};border-radius:3px;"></div>
                    </div>
                </div>
            `).join('')}
        </div>`;
}

// ─── PIN system ───────────────────────────────────────────────────────────────

const PIN_KEY = 'lifeos_private_pin';

function getStoredPin() {
    return localStorage.getItem(PIN_KEY);
}

function promptPinThenEdit(thoughtId) {
    const storedPin = getStoredPin();

    if (!storedPin) {
        // First time: set a PIN
        showPinModal('set', null, (pin) => {
            localStorage.setItem(PIN_KEY, pin);
            showToast('PIN set! Remember it — it protects your private thoughts.', 'success');
            editThought(thoughtId);
        });
    } else {
        // Verify PIN
        showPinModal('verify', null, (pin) => {
            if (pin === storedPin) {
                editThought(thoughtId);
            } else {
                showToast('Incorrect PIN', 'error');
            }
        });
    }
}

function showPinModal(mode, message, onSuccess) {
    // Remove any existing PIN modal
    document.getElementById('pinOverlay')?.remove();

    const isSet = mode === 'set';
    const overlay = document.createElement('div');
    overlay.id = 'pinOverlay';
    overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;
        display:flex;align-items:center;justify-content:center;`;

    overlay.innerHTML = `
        <div style="background:var(--bg-primary,#fff);border-radius:16px;padding:2rem;
                    width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.3);text-align:center;">
            <div style="font-size:2.5rem;margin-bottom:0.5rem;">🔐</div>
            <h3 style="margin:0 0 0.5rem;color:var(--text-primary);">
                ${isSet ? 'Set Your Private PIN' : 'Enter PIN'}
            </h3>
            <p style="margin:0 0 1.5rem;font-size:0.875rem;color:var(--text-secondary);">
                ${isSet ? 'Choose a 4-digit PIN to protect your private thoughts.' : 'Enter your 4-digit PIN to unlock this thought.'}
            </p>
            ${message ? `<p style="color:var(--danger-color);margin:0 0 1rem;font-size:0.875rem;">${message}</p>` : ''}
            <input id="pinInput" type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*"
                   placeholder="••••"
                   style="width:100%;text-align:center;font-size:1.75rem;letter-spacing:0.5rem;
                          padding:0.75rem;border:2px solid var(--border-color,#e2e8f0);
                          border-radius:10px;background:var(--bg-secondary,#f8fafc);
                          color:var(--text-primary);outline:none;box-sizing:border-box;margin-bottom:1.25rem;">
            ${isSet ? `
            <input id="pinConfirm" type="password" maxlength="4" inputmode="numeric" pattern="[0-9]*"
                   placeholder="Confirm ••••"
                   style="width:100%;text-align:center;font-size:1.75rem;letter-spacing:0.5rem;
                          padding:0.75rem;border:2px solid var(--border-color,#e2e8f0);
                          border-radius:10px;background:var(--bg-secondary,#f8fafc);
                          color:var(--text-primary);outline:none;box-sizing:border-box;margin-bottom:1.25rem;">
            ` : ''}
            <div style="display:flex;gap:0.75rem;justify-content:center;">
                <button id="pinCancelBtn"
                        style="padding:0.6rem 1.25rem;border-radius:8px;border:1.5px solid var(--border-color,#e2e8f0);
                               background:var(--bg-tertiary,#f1f5f9);color:var(--text-primary);
                               cursor:pointer;font-size:0.9rem;font-weight:500;">
                    Cancel
                </button>
                <button id="pinSubmitBtn"
                        style="padding:0.6rem 1.25rem;border-radius:8px;border:none;
                               background:var(--primary-color,#3b82f6);color:#fff;
                               cursor:pointer;font-size:0.9rem;font-weight:600;">
                    ${isSet ? 'Set PIN' : 'Unlock'}
                </button>
            </div>
        </div>`;

    document.body.appendChild(overlay);

    const pinInput = overlay.querySelector('#pinInput');
    const pinConfirm = overlay.querySelector('#pinConfirm');
    pinInput.focus();

    overlay.querySelector('#pinCancelBtn').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#pinSubmitBtn').addEventListener('click', () => {
        const pin = pinInput.value.trim();
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            showToast('PIN must be exactly 4 digits', 'error');
            return;
        }
        if (isSet) {
            const confirm = pinConfirm?.value.trim();
            if (pin !== confirm) { showToast('PINs do not match', 'error'); return; }
        }
        overlay.remove();
        onSuccess(pin);
    });

    // Submit on Enter key
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') overlay.querySelector('#pinSubmitBtn').click();
        if (e.key === 'Escape') overlay.remove();
    });
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

function initEventListeners() {
    document.getElementById('newThoughtBtn')?.addEventListener('click', () => {
        currentThoughtId = null;
        resetForm();
        const title = document.getElementById('modalTitle');
        if (title) title.textContent = 'New Thought';
        document.getElementById('deleteThoughtBtn')?.classList.add('hidden');
        openModal('thoughtModal');
    });

    document.getElementById('thoughtForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveThought();
    });

    document.getElementById('deleteThoughtBtn')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this thought?')) {
            await deleteThought(currentThoughtId);
        }
    });

    // Mood buttons
    document.querySelectorAll('.mood-option').forEach(option => {
        option.addEventListener('click', () => {
            selectedMood = option.dataset.mood || 'Neutral';
            syncMoodUI();
        });
    });
}

function syncMoodUI() {
    document.querySelectorAll('.mood-option').forEach(opt => {
        const isSelected = opt.dataset.mood === selectedMood;
        opt.classList.toggle('selected', isSelected);
        const hidden = document.getElementById('thoughtMood');
        if (hidden) hidden.value = selectedMood;
    });
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function saveThought() {
    const contentEl = document.getElementById('thoughtContent');
    const tagsEl    = document.getElementById('thoughtTags');
    const privateEl = document.getElementById('thoughtPrivate');

    const content = contentEl?.value?.trim() || '';
    if (!content) {
        showToast('Please write something before saving', 'error');
        return;
    }

    const isPrivate = privateEl?.checked ?? false;

    // If marking as private and no PIN set yet, require setting one first
    if (isPrivate && !getStoredPin()) {
        showPinModal('set', null, (pin) => {
            localStorage.setItem(PIN_KEY, pin);
            showToast('PIN set!', 'success');
            doSave(content, isPrivate, tagsEl);
        });
        return;
    }

    await doSave(content, isPrivate, tagsEl);
}

async function doSave(content, isPrivate, tagsEl) {
    const mood = selectedMood || 'Neutral';
    const thoughtData = {
        content,
        mood,
        isPrivate,
        tags: (tagsEl?.value || '').split(',').map(t => t.trim()).filter(Boolean),
    };

    try {
        if (currentThoughtId) {
            await api.put(`/thoughts/${currentThoughtId}`, thoughtData);
            showToast('Thought updated successfully', 'success');
        } else {
            await api.post('/thoughts', thoughtData);
            showToast('Thought saved successfully', 'success');
        }
        closeModal('thoughtModal');
        await loadThoughts();
    } catch (error) {
        console.error('Failed to save thought:', error);
        showToast('Failed to save thought', 'error');
    }
}

// ─── Edit / Delete ────────────────────────────────────────────────────────────

async function editThought(thoughtId) {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (!thought) return;

    currentThoughtId = thoughtId;
    selectedMood = thought.mood || 'Neutral';

    const contentEl = document.getElementById('thoughtContent');
    const tagsEl    = document.getElementById('thoughtTags');
    const privateEl = document.getElementById('thoughtPrivate');

    if (contentEl) contentEl.value = thought.content;
    if (tagsEl)    tagsEl.value    = (thought.tags || []).join(', ');
    if (privateEl) privateEl.checked = thought.isPrivate;

    syncMoodUI();

    const title = document.getElementById('modalTitle');
    if (title) title.textContent = 'Edit Thought';
    document.getElementById('deleteThoughtBtn')?.classList.remove('hidden');
    openModal('thoughtModal');
}

async function deleteThought(thoughtId) {
    try {
        await api.delete(`/thoughts/${thoughtId}`);
        showToast('Thought deleted successfully', 'success');
        closeModal('thoughtModal');
        await loadThoughts();
    } catch (error) {
        console.error('Failed to delete thought:', error);
        showToast('Failed to delete thought', 'error');
    }
}

// ─── Reset ────────────────────────────────────────────────────────────────────

function resetForm() {
    document.getElementById('thoughtForm')?.reset();
    selectedMood = 'Neutral';
    syncMoodUI();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMoodEmoji(mood) {
    return { Happy: '😊', Neutral: '😐', Sad: '😢', Anxious: '😰', Excited: '🤩' }[mood] || '😐';
}

function getMoodColor(mood) {
    return { Happy: '#10b981', Neutral: '#64748b', Sad: '#3b82f6', Anxious: '#f59e0b', Excited: '#8b5cf6' }[mood] || '#64748b';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}