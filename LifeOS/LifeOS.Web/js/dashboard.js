import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, showToast, formatDate } from './ui.js';

// Protect this page
protectPage();

// Initialize UI
initUI();

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

async function loadDashboard() {
    try {
        const summary = await api.get('/dashboard/summary');
        renderDashboard(summary);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showToast('Failed to load dashboard', 'error');
    }
}

function renderDashboard(summary) {
    const grid = document.getElementById('dashboardGrid');
    
    grid.innerHTML = `
        <!-- Notes Summary -->
        <div class="card">
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">📝</span>
                    <h3 class="card-title">Notes</h3>
                </div>
            </div>
            <div class="card-content">
                <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">
                    ${summary.totalNotes}
                </div>
                <div style="color: var(--text-secondary); margin-top: 0.5rem;">
                    ${summary.pinnedNotes} pinned
                </div>
            </div>
            <div class="card-footer">
                <a href="notes.html" class="btn btn-sm btn-secondary">View All</a>
            </div>
        </div>

        <!-- Goals Summary -->
        <div class="card">
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">🎯</span>
                    <h3 class="card-title">Goals</h3>
                </div>
            </div>
            <div class="card-content">
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <div>
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--success-color);">
                            ${summary.goalsByStatus.Completed || 0}
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Completed</div>
                    </div>
                    <div>
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--primary-color);">
                            ${summary.goalsByStatus.InProgress || 0}
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">In Progress</div>
                    </div>
                    <div>
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--text-tertiary);">
                            ${summary.goalsByStatus.NotStarted || 0}
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Not Started</div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <a href="goals.html" class="btn btn-sm btn-secondary">View All</a>
            </div>
        </div>

        <!-- Upcoming Deadlines -->
        <div class="card">
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">⏰</span>
                    <h3 class="card-title">Upcoming Deadlines</h3>
                </div>
            </div>
            <div class="card-content">
                ${summary.upcomingDeadlines.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${summary.upcomingDeadlines.map(d => `
                            <div style="padding: 0.5rem; background: var(--bg-tertiary); border-radius: 6px;">
                                <div style="font-weight: 500; color: var(--text-primary);">${escapeHtml(d.title)}</div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    ${new Date(d.dueDate).toLocaleDateString()}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="color: var(--text-tertiary); text-align: center; padding: 1rem;">
                        No upcoming deadlines
                    </div>
                `}
            </div>
            <div class="card-footer">
                <a href="deadlines.html" class="btn btn-sm btn-secondary">View All</a>
            </div>
        </div>

        <!-- Today's Routines -->
        <div class="card">
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">🔁</span>
                    <h3 class="card-title">Today's Routines</h3>
                </div>
            </div>
            <div class="card-content">
                ${summary.todaysRoutines.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${summary.todaysRoutines.map(r => `
                            <div style="padding: 0.5rem; background: var(--bg-tertiary); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-weight: 500; color: var(--text-primary);">${escapeHtml(r.title)}</div>
                                <div>
                                    ${r.isCompletedToday ? 
                                        '<span class="badge badge-success">✓ Done</span>' : 
                                        '<span class="badge" style="background: var(--bg-secondary);">Pending</span>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="color: var(--text-tertiary); text-align: center; padding: 1rem;">
                        No routines for today
                    </div>
                `}
            </div>
            <div class="card-footer">
                <a href="routines.html" class="btn btn-sm btn-secondary">View All</a>
            </div>
        </div>

        <!-- Current Streaks -->
        <div class="card">
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">🔥</span>
                    <h3 class="card-title">Current Streaks</h3>
                </div>
            </div>
            <div class="card-content">
                ${summary.currentStreaks.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${summary.currentStreaks.map(s => `
                            <div style="padding: 0.5rem; background: var(--bg-tertiary); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="font-weight: 500; color: var(--text-primary);">${escapeHtml(s.routineTitle)}</div>
                                <div style="font-size: 1.25rem; font-weight: 700; color: var(--warning-color);">
                                    ${s.streak} 🔥
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="color: var(--text-tertiary); text-align: center; padding: 1rem;">
                        No active streaks yet
                    </div>
                `}
            </div>
        </div>

        <!-- Latest Thoughts -->
        <div class="card">
            <div class="card-header">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.5rem;">💭</span>
                    <h3 class="card-title">Latest Thoughts</h3>
                </div>
            </div>
            <div class="card-content">
                ${summary.latestThoughts.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${summary.latestThoughts.map(t => `
                            <div style="padding: 0.5rem; background: var(--bg-tertiary); border-radius: 6px;">
                                <div style="color: var(--text-primary);">${escapeHtml(t.content.substring(0, 100))}${t.content.length > 100 ? '...' : ''}</div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                    ${getMoodEmoji(t.mood)} ${formatDate(t.createdAt)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="color: var(--text-tertiary); text-align: center; padding: 1rem;">
                        No thoughts yet
                    </div>
                `}
            </div>
            <div class="card-footer">
                <a href="thoughts.html" class="btn btn-sm btn-secondary">View All</a>
            </div>
        </div>
    `;
}

function getMoodEmoji(mood) {
    const moodEmojis = {
        'Happy': '😊',
        'Neutral': '😐',
        'Sad': '😢',
        'Anxious': '😰',
        'Excited': '🤩'
    };
    return moodEmojis[mood] || '😐';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
