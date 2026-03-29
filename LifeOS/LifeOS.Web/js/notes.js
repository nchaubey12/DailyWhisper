import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, openModal, closeModal, showToast, formatDate } from './ui.js';

// Protect this page
protectPage();

// Initialize UI
initUI();

let notes = [];
let currentNoteId = null;

// Load notes on page load
document.addEventListener('DOMContentLoaded', () => {
    loadNotes();
    initEventListeners();
});

async function loadNotes() {
    try {
        notes = await api.get('/notes');
        renderNotes(notes);
    } catch (error) {
        console.error('Failed to load notes:', error);
        showToast('Failed to load notes', 'error');
    }
}

function renderNotes(notesToRender = notes) {
    const grid = document.getElementById('notesGrid');
    const emptyState = document.getElementById('emptyState');

    if (notesToRender.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    grid.classList.remove('hidden');
    emptyState.classList.add('hidden');

    grid.innerHTML = notesToRender.map(note => `
        <div class="note-card ${note.isPinned ? 'pinned' : ''}" 
             style="background-color: ${note.color}; border-left: 4px solid ${getDarkerShade(note.color)};" 
             data-id="${note.id}">
            <div class="card-header">
                <h3 style="color: var(--text-primary); margin: 0; font-size: 1.125rem;">
                    ${escapeHtml(note.title)}
                </h3>
                <button class="btn-icon btn-secondary pin-btn" data-id="${note.id}">
                    ${note.isPinned ? '📌' : '📍'}
                </button>
            </div>
            <div class="card-content" style="margin-top: 0.75rem;">
                <p style="color: var(--text-secondary); white-space: pre-wrap;">
                    ${escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? '...' : ''}
                </p>
            </div>
            ${note.tags.length > 0 ? `
                <div class="tags-container">
                    ${note.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="card-footer" style="font-size: 0.875rem; color: var(--text-tertiary);">
                <span>${formatDate(note.updatedAt)}</span>
            </div>
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.pin-btn')) {
                const noteId = card.dataset.id;
                editNote(noteId);
            }
        });
    });

    // Add pin button handlers
    document.querySelectorAll('.pin-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const noteId = btn.dataset.id;
            await togglePin(noteId);
        });
    });
}

function getDarkerShade(color) {
    // Simple function to darken a hex color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const darker = (val) => Math.max(0, Math.floor(val * 0.7));
    
    return `#${darker(r).toString(16).padStart(2, '0')}${darker(g).toString(16).padStart(2, '0')}${darker(b).toString(16).padStart(2, '0')}`;
}

function initEventListeners() {
    // New note button
    document.getElementById('newNoteBtn').addEventListener('click', () => {
        currentNoteId = null;
        resetForm();
        document.getElementById('modalTitle').textContent = 'New Note';
        document.getElementById('deleteNoteBtn').classList.add('hidden');
        openModal('noteModal');
    });

    // Note form submission
    document.getElementById('noteForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveNote();
    });

    // Delete note button
    document.getElementById('deleteNoteBtn').addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this note?')) {
            await deleteNote(currentNoteId);
        }
    });

    // Color picker
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            document.getElementById('noteColor').value = option.dataset.color;
        });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = notes.filter(note => 
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query) ||
            note.tags.some(tag => tag.toLowerCase().includes(query))
        );
        renderNotes(filtered);
    });
}

async function saveNote() {
    const noteData = {
        title: document.getElementById('noteTitle').value,
        content: document.getElementById('noteContent').value,
        tags: document.getElementById('noteTags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t),
        color: document.getElementById('noteColor').value,
        isPinned: false
    };

    try {
        if (currentNoteId) {
            // Update existing note
            await api.put(`/notes/${currentNoteId}`, noteData);
            showToast('Note updated successfully', 'success');
        } else {
            // Create new note
            await api.post('/notes', noteData);
            showToast('Note created successfully', 'success');
        }

        closeModal('noteModal');
        await loadNotes();
    } catch (error) {
        console.error('Failed to save note:', error);
        showToast('Failed to save note', 'error');
    }
}

async function editNote(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    currentNoteId = noteId;
    
    document.getElementById('noteId').value = note.id;
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteTags').value = note.tags.join(', ');
    document.getElementById('noteColor').value = note.color;

    // Set selected color
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === note.color) {
            opt.classList.add('selected');
        }
    });

    document.getElementById('modalTitle').textContent = 'Edit Note';
    document.getElementById('deleteNoteBtn').classList.remove('hidden');
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
        showToast('Failed to delete note', 'error');
    }
}

async function togglePin(noteId) {
    try {
        await api.patch(`/notes/${noteId}/pin`);
        await loadNotes();
        showToast('Note pin toggled', 'success');
    } catch (error) {
        console.error('Failed to toggle pin:', error);
        showToast('Failed to toggle pin', 'error');
    }
}

function resetForm() {
    document.getElementById('noteForm').reset();
    document.getElementById('noteId').value = '';
    document.getElementById('noteColor').value = '#fef3c7';
    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.color === '#fef3c7') {
            opt.classList.add('selected');
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
