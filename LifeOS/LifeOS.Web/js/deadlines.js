import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, openModal, closeModal, showToast, formatDate } from './ui.js';

protectPage();
initUI();

let deadlines = [];
let currentDeadlineId = null;
let currentDate = new Date();

document.addEventListener('DOMContentLoaded', () => {
    loadDeadlines();
    initEventListeners();
    renderCalendar();
});

async function loadDeadlines() {
    try {
        deadlines = await api.get('/deadlines');
        renderDeadlines(deadlines);
        renderCalendar();
    } catch (error) {
        console.error('Failed to load deadlines:', error);
        showToast('Failed to load deadlines', 'error');
    }
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update header
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Get calendar data
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const calendarGrid = document.getElementById('calendarGrid');
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = dayHeaders.map(day => 
        `<div class="calendar-day-header">${day}</div>`
    ).join('');
    
    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${prevMonthDays - i}</div>`;
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const dayDeadlines = deadlines.filter(d => d.dueDate.startsWith(dateStr));
        
        const isToday = date.toDateString() === today.toDateString();
        const hasDeadlines = dayDeadlines.length > 0;
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${hasDeadlines ? 'has-deadline' : ''}"
                 data-date="${dateStr}">
                ${day}
                ${hasDeadlines ? `<div class="deadline-count">${dayDeadlines.length}</div>` : ''}
            </div>
        `;
    }
    
    // Next month days
    const remainingDays = 42 - (startDay + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        html += `<div class="calendar-day other-month">${day}</div>`;
    }
    
    calendarGrid.innerHTML = html;
    
    // Add click handlers
    document.querySelectorAll('.calendar-day[data-date]').forEach(day => {
        day.addEventListener('click', () => {
            const date = day.dataset.date;
            document.getElementById('deadlineDueDate').value = date;
            openModal('deadlineModal');
        });
    });
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
    // Calendar navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth')?.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

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
