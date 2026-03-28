import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, openModal, closeModal, showToast, formatDate } from './ui.js';

protectPage();
initUI();

let deadlines = [];
let currentDeadlineId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDeadlines();
    initEventListeners();
});

async function loadDeadlines() {
    try {
        deadlines = await api.get('/deadlines');
        renderDeadlines(deadlines);
    } catch (error) {
        console.error('Failed to load deadlines:', error);
        showToast('Failed to load deadlines', 'error');
    }
}

function renderDeadlines(deadlinesToRender = deadlines) {
    const container = document.getElementById('deadlinesContainer');
    if (!container) return;

    const grouped = groupDeadlinesByDate(deadlinesToRender);
    
    container.innerHTML = Object.entries(grouped).map(([date, items]) => `
        <div style="margin-bottom: 2rem;">
            <h3 style="color: var(--text-primary); margin-bottom: 1rem;">${date}</h3>
            <div class="grid grid-2">
                ${items.map(deadline => `
                    <div class="card ${deadline.isCompleted ? 'completed' : ''}" 
                         data-id="${deadline.id}" 
                         style="cursor: pointer; opacity: ${deadline.isCompleted ? '0.6' : '1'};">
                        <div class="card-header">
                            <h4 style="margin: 0;">${escapeHtml(deadline.title)}</h4>
                            <span class="badge badge-${getPriorityClass(deadline.priority)}">
                                ${deadline.priority}
                            </span>
                        </div>
                        <div class="card-content">
                            <p>${escapeHtml(deadline.description)}</p>
                            ${deadline.dueTime ? `<p>⏰ ${deadline.dueTime}</p>` : ''}
                        </div>
                        <div class="card-footer">
                            ${deadline.isCompleted ? 
                                '<span class="badge badge-success">✓ Completed</span>' : 
                                '<span class="badge">Pending</span>'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.card[data-id]').forEach(card => {
        card.addEventListener('click', () => editDeadline(card.dataset.id));
    });
}

function groupDeadlinesByDate(deadlines) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const groups = {
        'Overdue': [],
        'Today': [],
        'Tomorrow': [],
        'This Week': [],
        'Later': []
    };

    deadlines.forEach(deadline => {
        const dueDate = new Date(deadline.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

        if (deadline.isCompleted) {
            return; // Skip completed items or add to separate group
        } else if (diffDays < 0) {
            groups['Overdue'].push(deadline);
        } else if (diffDays === 0) {
            groups['Today'].push(deadline);
        } else if (diffDays === 1) {
            groups['Tomorrow'].push(deadline);
        } else if (diffDays <= 7) {
            groups['This Week'].push(deadline);
        } else {
            groups['Later'].push(deadline);
        }
    });

    return Object.fromEntries(
        Object.entries(groups).filter(([_, items]) => items.length > 0)
    );
}

function initEventListeners() {
    document.getElementById('newDeadlineBtn')?.addEventListener('click', () => {
        currentDeadlineId = null;
        resetForm();
        document.getElementById('modalTitle').textContent = 'New Deadline';
        document.getElementById('deleteDeadlineBtn').classList.add('hidden');
        openModal('deadlineModal');
    });

    document.getElementById('deadlineForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveDeadline();
    });

    document.getElementById('deleteDeadlineBtn')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this deadline?')) {
            await deleteDeadline(currentDeadlineId);
        }
    });
}

async function saveDeadline() {
    const deadlineData = {
        title: document.getElementById('deadlineTitle').value,
        description: document.getElementById('deadlineDescription').value,
        dueDate: document.getElementById('deadlineDueDate').value,
        dueTime: document.getElementById('deadlineDueTime').value || null,
        category: document.getElementById('deadlineCategory').value,
        priority: document.getElementById('deadlinePriority').value,
        isCompleted: document.getElementById('deadlineCompleted')?.checked || false,
        reminderSet: false
    };

    try {
        if (currentDeadlineId) {
            await api.put(`/deadlines/${currentDeadlineId}`, deadlineData);
            showToast('Deadline updated successfully', 'success');
        } else {
            await api.post('/deadlines', deadlineData);
            showToast('Deadline created successfully', 'success');
        }
        closeModal('deadlineModal');
        await loadDeadlines();
    } catch (error) {
        console.error('Failed to save deadline:', error);
        showToast('Failed to save deadline', 'error');
    }
}

async function editDeadline(deadlineId) {
    const deadline = deadlines.find(d => d.id === deadlineId);
    if (!deadline) return;

    currentDeadlineId = deadlineId;
    document.getElementById('deadlineTitle').value = deadline.title;
    document.getElementById('deadlineDescription').value = deadline.description;
    document.getElementById('deadlineDueDate').value = deadline.dueDate.split('T')[0];
    document.getElementById('deadlineDueTime').value = deadline.dueTime || '';
    document.getElementById('deadlineCategory').value = deadline.category;
    document.getElementById('deadlinePriority').value = deadline.priority;
    if (document.getElementById('deadlineCompleted')) {
        document.getElementById('deadlineCompleted').checked = deadline.isCompleted;
    }

    document.getElementById('modalTitle').textContent = 'Edit Deadline';
    document.getElementById('deleteDeadlineBtn').classList.remove('hidden');
    openModal('deadlineModal');
}

async function deleteDeadline(deadlineId) {
    try {
        await api.delete(`/deadlines/${deadlineId}`);
        showToast('Deadline deleted successfully', 'success');
        closeModal('deadlineModal');
        await loadDeadlines();
    } catch (error) {
        console.error('Failed to delete deadline:', error);
        showToast('Failed to delete deadline', 'error');
    }
}

function resetForm() {
    document.getElementById('deadlineForm')?.reset();
}

function getPriorityClass(priority) {
    return { Low: 'secondary', Medium: 'warning', High: 'danger' }[priority] || 'secondary';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
