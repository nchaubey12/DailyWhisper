import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, openModal, closeModal, showToast, formatDate } from './ui.js';

protectPage();
initUI();

let thoughts = [];
let currentThoughtId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadThoughts();
    initEventListeners();
});

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

function renderThoughts(thoughtsToRender = thoughts) {
    const container = document.getElementById('thoughtsContainer');
    if (!container) return;

    container.innerHTML = thoughtsToRender.map(thought => `
        <div class="card" data-id="${thought.id}" style="cursor: pointer;">
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">${getMoodEmoji(thought.mood)}</span>
                    <span style="font-size: 0.875rem; color: var(--text-secondary);">
                        ${formatDate(thought.createdAt)}
                    </span>
                </div>
                ${thought.isPrivate ? '<span class="badge">🔒 Private</span>' : ''}
            </div>
            <div class="card-content">
                <p style="white-space: pre-wrap;">${escapeHtml(thought.content)}</p>
                ${thought.tags.length > 0 ? `
                    <div class="tags-container">
                        ${thought.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.card[data-id]').forEach(card => {
        card.addEventListener('click', () => editThought(card.dataset.id));
    });
}

function renderMoodChart(moodData) {
    const chartContainer = document.getElementById('moodChart');
    if (!chartContainer) return;

    const total = Object.values(moodData).reduce((a, b) => a + b, 0);
    
    if (total === 0) {
        chartContainer.innerHTML = '<p style="text-align: center; color: var(--text-tertiary);">No mood data yet</p>';
        return;
    }

    chartContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${Object.entries(moodData).map(([mood, count]) => `
                <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span>${getMoodEmoji(mood)} ${mood}</span>
                        <span style="font-weight: 600;">${count}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(count / total * 100)}%; background: ${getMoodColor(mood)};"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function initEventListeners() {
    document.getElementById('newThoughtBtn')?.addEventListener('click', () => {
        currentThoughtId = null;
        resetForm();
        document.getElementById('modalTitle').textContent = 'New Thought';
        document.getElementById('deleteThoughtBtn').classList.add('hidden');
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

    // Mood selector
    document.querySelectorAll('.mood-option')?.forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.mood-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            document.getElementById('thoughtMood').value = option.dataset.mood;
        });
    });
}

async function saveThought() {
    const thoughtData = {
        content: document.getElementById('thoughtContent').value,
        mood: document.getElementById('thoughtMood').value,
        isPrivate: document.getElementById('thoughtPrivate')?.checked ?? true,
        tags: document.getElementById('thoughtTags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t)
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

async function editThought(thoughtId) {
    const thought = thoughts.find(t => t.id === thoughtId);
    if (!thought) return;

    currentThoughtId = thoughtId;
    document.getElementById('thoughtContent').value = thought.content;
    document.getElementById('thoughtMood').value = thought.mood;
    document.getElementById('thoughtTags').value = thought.tags.join(', ');
    if (document.getElementById('thoughtPrivate')) {
        document.getElementById('thoughtPrivate').checked = thought.isPrivate;
    }

    // Set selected mood
    document.querySelectorAll('.mood-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.mood === thought.mood) {
            opt.classList.add('selected');
        }
    });

    document.getElementById('modalTitle').textContent = 'Edit Thought';
    document.getElementById('deleteThoughtBtn').classList.remove('hidden');
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

function resetForm() {
    document.getElementById('thoughtForm')?.reset();
    document.getElementById('thoughtMood').value = 'Neutral';
    document.querySelectorAll('.mood-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.mood === 'Neutral') {
            opt.classList.add('selected');
        }
    });
}

function getMoodEmoji(mood) {
    const emojis = {
        'Happy': '😊',
        'Neutral': '😐',
        'Sad': '😢',
        'Anxious': '😰',
        'Excited': '🤩'
    };
    return emojis[mood] || '😐';
}

function getMoodColor(mood) {
    const colors = {
        'Happy': '#10b981',
        'Neutral': '#64748b',
        'Sad': '#3b82f6',
        'Anxious': '#f59e0b',
        'Excited': '#8b5cf6'
    };
    return colors[mood] || '#64748b';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
