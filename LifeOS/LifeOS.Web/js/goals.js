import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, openModal, closeModal, showToast, formatDate } from './ui.js';

protectPage();
initUI();

let goals = [];
let currentGoalId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadGoals();
    initEventListeners();
});

async function loadGoals() {
    try {
        goals = await api.get('/goals');
        renderGoals(goals);
    } catch (error) {
        console.error('Failed to load goals:', error);
        showToast('Failed to load goals', 'error');
    }
}

function renderGoals(goalsToRender = goals) {
    const container = document.getElementById('goalsContainer');
    const emptyState = document.getElementById('emptyState');

    if (goalsToRender.length === 0) {
        container.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    container.classList.remove('hidden');
    emptyState.classList.add('hidden');

    container.innerHTML = goalsToRender.map(goal => `
        <div class="card" data-id="${goal.id}" style="cursor: pointer;">
            <div class="card-header">
                <h3 class="card-title">${escapeHtml(goal.title)}</h3>
                <span class="badge badge-${getPriorityClass(goal.priority)}">${goal.priority}</span>
            </div>
            <div class="card-content">
                <p style="color: var(--text-secondary);">${escapeHtml(goal.description)}</p>
                <div style="margin-top: 1rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.875rem;">Progress</span>
                        <span style="font-size: 0.875rem; font-weight: 600;">${goal.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%;"></div>
                    </div>
                </div>
                ${goal.targetDate ? `
                    <div style="margin-top: 0.75rem; font-size: 0.875rem; color: var(--text-secondary);">
                        🎯 Target: ${new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                ` : ''}
            </div>
            <div class="card-footer">
                <span class="badge badge-${getStatusClass(goal.status)}">${goal.status}</span>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.card[data-id]').forEach(card => {
        card.addEventListener('click', () => editGoal(card.dataset.id));
    });
}

function initEventListeners() {
    document.getElementById('newGoalBtn')?.addEventListener('click', () => {
        currentGoalId = null;
        resetForm();
        document.getElementById('modalTitle').textContent = 'New Goal';
        document.getElementById('deleteGoalBtn').classList.add('hidden');
        openModal('goalModal');
    });

    document.getElementById('goalForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveGoal();
    });

    document.getElementById('deleteGoalBtn')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this goal?')) {
            await deleteGoal(currentGoalId);
        }
    });
}

async function saveGoal() {
    const goalData = {
        title: document.getElementById('goalTitle').value,
        description: document.getElementById('goalDescription').value,
        category: document.getElementById('goalCategory').value,
        priority: document.getElementById('goalPriority').value,
        status: document.getElementById('goalStatus').value,
        progress: parseInt(document.getElementById('goalProgress').value),
        targetDate: document.getElementById('goalTargetDate').value || null,
        milestones: []
    };

    try {
        if (currentGoalId) {
            await api.put(`/goals/${currentGoalId}`, goalData);
            showToast('Goal updated successfully', 'success');
        } else {
            await api.post('/goals', goalData);
            showToast('Goal created successfully', 'success');
        }
        closeModal('goalModal');
        await loadGoals();
    } catch (error) {
        console.error('Failed to save goal:', error);
        showToast('Failed to save goal', 'error');
    }
}

async function editGoal(goalId) {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    currentGoalId = goalId;
    document.getElementById('goalTitle').value = goal.title;
    document.getElementById('goalDescription').value = goal.description;
    document.getElementById('goalCategory').value = goal.category;
    document.getElementById('goalPriority').value = goal.priority;
    document.getElementById('goalStatus').value = goal.status;
    document.getElementById('goalProgress').value = goal.progress;
    document.getElementById('goalTargetDate').value = goal.targetDate ? goal.targetDate.split('T')[0] : '';

    document.getElementById('modalTitle').textContent = 'Edit Goal';
    document.getElementById('deleteGoalBtn').classList.remove('hidden');
    openModal('goalModal');
}

async function deleteGoal(goalId) {
    try {
        await api.delete(`/goals/${goalId}`);
        showToast('Goal deleted successfully', 'success');
        closeModal('goalModal');
        await loadGoals();
    } catch (error) {
        console.error('Failed to delete goal:', error);
        showToast('Failed to delete goal', 'error');
    }
}

function resetForm() {
    document.getElementById('goalForm')?.reset();
}

function getPriorityClass(priority) {
    return { Low: 'secondary', Medium: 'warning', High: 'danger' }[priority] || 'secondary';
}

function getStatusClass(status) {
    return { NotStarted: 'secondary', InProgress: 'warning', Completed: 'success' }[status] || 'secondary';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
