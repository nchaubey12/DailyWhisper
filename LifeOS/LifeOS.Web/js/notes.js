import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, openModal, closeModal, showToast, formatDate } from './ui.js';

protectPage();
initUI();

let notes = [];
let currentNoteId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    initEventListeners();
});

async function loadNotes() {
    try {
        const result = await api.get('/notes');
        // FIX: api.get can return null on 204 or network hiccup
        notes = Array.isArray(result) ? result : [];
        renderNotes(notes);
    } catch (error) {
        console.error('Failed to load notes:', error);
        showToast('Failed to load notes — check the backend is running', 'error');
        notes = [];
        renderNotes(notes);
    }
}

function renderNotes(notesToRender = notes) {
    const grid = document.getElementById('notesGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    if (!notesToRender || notesToRender.length === 0) {
        grid.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = notesToRender.map(note => `
        <div class="card" data-id="${note.id}" style="
            cursor:pointer;
            display:flex;
            flex-direction:column;
            align-items:stretch;
            text-align:left;
            background:${note.color || '#fef3c7'};
        ">
            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                margin-bottom:0.75rem;
                width:100%;
                text-align:left;
            ">
                <span style="
                    font-size:1.1rem;
                    font-weight:600;
                    color:var(--text-primary);
                    text-align:left;
                    word-break:break-word;
                    flex:1;
                ">${escapeHtml(note.title || 'Untitled')}</span>
                <button class="pin-btn" data-id="${note.id}" style="
                    background:none;
                    border:none;
                    cursor:pointer;
                    font-size:1rem;
                    flex-shrink:0;
                    padding:0;
                    margin-left:0.5rem;
                ">${note.isPinned ? '📌' : '📍'}</button>
            </div>

            <div style="
                flex:1;
                width:100%;
                text-align:left;
                color:var(--text-secondary);
                font-size:0.9rem;
                white-space:pre-wrap;
                word-break:break-word;
                line-height:1.5;
                display:block;
            ">${escapeHtml((note.content || '').substring(0, 150))}${(note.content || '').length > 150 ? '...' : ''}</div>

            ${(note.tags || []).length > 0 ? `
                <div style="display:flex;flex-wrap:wrap;gap:0.4rem;margin-top:0.75rem;justify-content:flex-start;">
                    ${note.tags.map(tag => `<span class="badge badge-secondary">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}

            <div style="
                margin-top:1rem;
                padding-top:0.75rem;
                border-top:1px solid var(--border-color);
                display:flex;
                align-items:center;
                width:100%;
                text-align:left;
            ">
                <span style="font-size:0.875rem;color:var(--text-tertiary);">${formatDate(note.updatedAt)}</span>
                ${note.isPinned ? '<span style="margin-left:auto;font-size:0.75rem;">📌 Pinned</span>' : ''}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.card[data-id]').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.pin-btn')) {
                editNote(card.dataset.id);
            }
        });
    });

    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await togglePin(btn.dataset.id);
        });
    });
}

function getDarkerShade(color) {
    if (!color || !color.startsWith('#') || color.length < 7) return '#d4a373';
    try {
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        const d = (v) => Math.max(0, Math.floor(v * 0.7)).toString(16).padStart(2, '0');
        return `#${d(r)}${d(g)}${d(b)}`;
    } catch {
        return '#ccaa88';
    }
}

function initEventListeners() {
    // FIX: use optional chaining so missing elements don't throw
    document.getElementById('newNoteBtn')?.addEventListener('click', () => {
        currentNoteId = null;
        resetForm();
        const titleEl = document.getElementById('modalTitle');
        if (titleEl) titleEl.textContent = 'New Note';
        document.getElementById('deleteNoteBtn')?.classList.add('hidden');
        openModal('noteModal');
    });

    document.getElementById('noteForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveNote();
    });

    document.getElementById('deleteNoteBtn')?.addEventListener('click', async () => {
        if (currentNoteId && confirm('Are you sure you want to delete this note?')) {
            await deleteNote(currentNoteId);
        }
    });

    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            const colorEl = document.getElementById('noteColor');
            if (colorEl) colorEl.value = option.dataset.color;
        });
    });

    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        const query = (e.target.value || '').toLowerCase();
        if (!query) {
            renderNotes(notes);
            return;
        }
        const filtered = notes.filter(note =>
            (note.title || '').toLowerCase().includes(query) ||
            (note.content || '').toLowerCase().includes(query) ||
            (note.tags || []).some(tag => tag.toLowerCase().includes(query))
        );
        renderNotes(filtered);
    });
}

async function saveNote() {
    const noteData = {
        title:   (document.getElementById('noteTitle')?.value || '').trim(),
        content: document.getElementById('noteContent')?.value || '',
        tags: (document.getElementById('noteTags')?.value || '')
            .split(',').map(t => t.trim()).filter(t => t),
        color:    document.getElementById('noteColor')?.value || '#fef3c7',
        isPinned: false
    };

    if (!noteData.title) {
        showToast('Please enter a title', 'error');
        return;
    }

    try {
        if (currentNoteId) {
            await api.put(`/notes/${currentNoteId}`, noteData);
            showToast('Note updated successfully', 'success');
        } else {
            await api.post('/notes', noteData);
            showToast('Note created successfully', 'success');
        }
        closeModal('noteModal');
        await loadNotes();
    } catch (error) {
        console.error('Failed to save note:', error);
        showToast(`Failed to save note: ${error.message}`, 'error');
    }
}

async function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    currentNoteId = noteId;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    set('noteId',      note.id);
    set('noteTitle',   note.title || '');
    set('noteContent', note.content || '');
    set('noteTags',    (note.tags || []).join(', '));
    set('noteColor',   note.color || '#fef3c7');

    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === note.color);
    });

    const titleEl = document.getElementById('modalTitle');
    if (titleEl) titleEl.textContent = 'Edit Note';
    document.getElementById('deleteNoteBtn')?.classList.remove('hidden');
    openModal('noteModal');
}

async function deleteNote(noteId) {
    try {
        await api.delete(`/notes/${noteId}`);
        showToast('Note deleted successfully', 'success');
        closeModal('noteModal');
        await loadNotes();
    } catch (error) {
        console.error('Failed to delete note:', error);
        showToast(`Failed to delete note: ${error.message}`, 'error');
    }
}

async function togglePin(noteId) {
    try {
        await api.patch(`/notes/${noteId}/pin`);
        await loadNotes();
        const note = notes.find(n => n.id === noteId);
        showToast(note?.isPinned ? 'Note unpinned' : 'Note pinned', 'success');
    } catch (error) {
        console.error('Failed to toggle pin:', error);
        showToast(`Failed to toggle pin: ${error.message}`, 'error');
    }
}

function resetForm() {
    document.getElementById('noteForm')?.reset();
    const idEl = document.getElementById('noteId');
    if (idEl) idEl.value = '';
    const colorEl = document.getElementById('noteColor');
    if (colorEl) colorEl.value = '#fef3c7';
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.color === '#fef3c7');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}