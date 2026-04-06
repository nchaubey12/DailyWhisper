import api from './api.js';
import { protectPage } from './auth.js';
import { initUI, showToast, formatDate } from './ui.js';

protectPage();
initUI();

let dashboardData = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    renderMiniCalendar();
    renderStreaks();
    renderProductivityChart();
    initAIChat();
});

async function loadDashboard() {
    try {
        const summary = await api.get('/dashboard/summary');
        dashboardData = summary;
        renderDashboard(summary);
        renderQuickStats(summary);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showToast('Failed to load dashboard', 'error');
        // Render empty fallback so page isn't blank
        renderDashboard(getEmptySummary());
        renderQuickStats(getEmptySummary());
    }
}

/** Returns a safe empty summary so renderers never crash on null */
function getEmptySummary() {
    return {
        totalNotes: 0,
        pinnedNotes: 0,
        goalsByStatus: { Completed: 0, InProgress: 0, NotStarted: 0 },
        upcomingDeadlines: [],
        latestThoughts: []
    };
}

function renderMiniCalendar() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

    const calMonthEl = document.getElementById('calendarMonth');
    if (calMonthEl) calMonthEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const calendar = document.getElementById('miniCalendar');
    if (!calendar) return;

    // Day headers
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    let html = days.map(day => `<div class="cal-day header">${day}</div>`).join('');

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
        html += '<div class="cal-day"></div>';
    }

    // Get activity days from localStorage
    const activityDays = getActivityDays(month, year);

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isActive = activityDays.includes(day);

        html += `<div class="cal-day ${isToday ? 'today' : ''} ${isActive ? 'active' : ''}">${day}</div>`;
    }

    calendar.innerHTML = html;
}

function getActivityDays(month, year) {
    try {
        const learningPages = JSON.parse(localStorage.getItem('learningPages') || '[]');
        const activeDays = new Set();
        learningPages.forEach(page => {
            if (!page.date) return;
            const pageDate = new Date(page.date);
            if (pageDate.getMonth() === month && pageDate.getFullYear() === year) {
                activeDays.add(pageDate.getDate());
            }
        });
        return Array.from(activeDays);
    } catch {
        return [];
    }
}

function renderStreaks() {
    const container = document.getElementById('streaksContainer');
    if (!container) return;

    let learningPages = [];
    try {
        learningPages = JSON.parse(localStorage.getItem('learningPages') || '[]');
    } catch { /* ignore parse errors */ }

    const learningStreak = calculateStreak(learningPages.map(p => new Date(p.date)));

    // FIX: was missing `let html =` causing ReferenceError
    const html = `
        <div class="streak-counter" style="background: linear-gradient(135deg, #ff6b6b, #ee5a6f);">
            <div>
                <div class="streak-number">${learningStreak}</div>
                <div style="font-size: 0.875rem;">day streak</div>
            </div>
            <div style="font-size: 2rem;">🔥</div>
        </div>
        <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-secondary); text-align: center;">
            ${learningStreak > 0
                ? `Keep it up! You've been active for ${learningStreak} ${learningStreak === 1 ? 'day' : 'days'} in a row!`
                : 'Start your streak today!'}
        </div>
    `;

    container.innerHTML = html;
}

function calculateStreak(dates) {
    if (!dates || dates.length === 0) return 0;

    // Filter invalid dates
    const validDates = dates.filter(d => d instanceof Date && !isNaN(d));
    if (validDates.length === 0) return 0;

    validDates.sort((a, b) => b - a);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);

    for (let date of validDates) {
        const activityDate = new Date(date);
        activityDate.setHours(0, 0, 0, 0);

        if (activityDate.getTime() === checkDate.getTime()) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (activityDate.getTime() < checkDate.getTime()) {
            break;
        }
    }

    return streak;
}

function renderQuickStats(summary) {
    const container = document.getElementById('quickStats');
    if (!container) return;

    // FIX: was missing `const html =` causing ReferenceError
    const html = `
        <div style="text-align: center; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">${summary.totalNotes || 0}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">Total Notes</div>
        </div>
        <div style="text-align: center; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--success-color);">${summary.goalsByStatus?.Completed || 0}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">Goals Completed</div>
        </div>
        <div style="text-align: center; padding: 1rem; background: var(--bg-tertiary); border-radius: 8px;">
            <div style="font-size: 2rem; font-weight: 700; color: var(--warning-color);">${summary.upcomingDeadlines?.length || 0}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">Upcoming Deadlines</div>
        </div>
    `;

    container.innerHTML = html;
}

function renderProductivityChart() {
    const container = document.getElementById('productivityChart');
    if (!container) return;

    let learningPages = [];
    try {
        learningPages = JSON.parse(localStorage.getItem('learningPages') || '[]');
    } catch { /* ignore */ }

    const checkedPages = learningPages.filter(p => p.checked).length;
    const learningProductivity = learningPages.length > 0 ? (checkedPages / learningPages.length * 100) : 0;

    const categories = [
        { name: 'Learning', value: Math.round(learningProductivity), color: '#3b82f6' },
        { name: 'Writing (Notes)', value: 75, color: '#10b981' },
        { name: 'Goals Progress', value: 60, color: '#f59e0b' },
        { name: 'Routines', value: 85, color: '#8b5cf6' },
        { name: 'Self-care', value: 70, color: '#ec4899' }
    ];

    const html = categories.map(cat => `
        <div class="productivity-bar">
            <div class="productivity-label">
                <span>${cat.name}</span>
                <span style="font-weight: 600;">${cat.value}%</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${cat.value}%; background: ${cat.color};">
                    ${cat.value}%
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function initAIChat() {
    const input = document.getElementById('aiInput');
    const btn = document.getElementById('aiAskBtn');
    const chat = document.getElementById('aiChat');

    if (!input || !btn || !chat) return;

    btn.addEventListener('click', () => askAI(input.value));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') askAI(input.value);
    });
}

async function askAI(question) {
    if (!question || !question.trim()) return;

    const chat = document.getElementById('aiChat');
    const input = document.getElementById('aiInput');
    if (!chat || !input) return;

    chat.innerHTML += `
        <div class="ai-message" style="background: var(--primary-color); color: white; margin-left: 2rem;">
            <strong>You:</strong> ${escapeHtml(question)}
        </div>
    `;

    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    chat.innerHTML += `
        <div class="ai-message" id="aiLoading">
            <strong>AI:</strong> Analyzing your data...
        </div>
    `;

    try {
        const context = gatherUserContext();

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 500,
                messages: [{
                    role: 'user',
                    content: `You are a productivity assistant analyzing user data. Based on this context, answer the user's question concisely.\n\nContext:\n${context}\n\nUser Question: ${question}\n\nProvide a helpful, concise answer (2-3 sentences max).`
                }]
            })
        });

        const data = await response.json();
        const answer = data.content?.[0]?.text || 'No response received.';

        const loading = document.getElementById('aiLoading');
        if (loading) loading.remove();

        chat.innerHTML += `
            <div class="ai-message">
                <strong>AI:</strong> ${escapeHtml(answer)}
            </div>
        `;
    } catch (error) {
        const loading = document.getElementById('aiLoading');
        if (loading) loading.remove();

        chat.innerHTML += `
            <div class="ai-message" style="background: #fee; color: #c33;">
                <strong>Error:</strong> Failed to get AI response. Please try again.
            </div>
        `;
    }

    chat.scrollTop = chat.scrollHeight;
}

function gatherUserContext() {
    let learningPages = [];
    try {
        learningPages = JSON.parse(localStorage.getItem('learningPages') || '[]');
    } catch { /* ignore */ }

    const checkedPages = learningPages.filter(p => p.checked).length;

    return `
- Total learning pages: ${learningPages.length}
- Checked pages: ${checkedPages}
- Learning streak: ${calculateStreak(learningPages.map(p => new Date(p.date)))} days
- Dashboard summary: ${dashboardData ? JSON.stringify(dashboardData) : 'Not loaded'}
    `.trim();
}

function renderDashboard(summary) {
    const grid = document.getElementById('dashboardGrid');
    if (!grid) return;

    // Safe access with defaults
    const goalsByStatus = summary.goalsByStatus || {};
    const latestThoughts = (summary.latestThoughts || []).filter(t => !t.isPrivate);

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
                    ${summary.totalNotes || 0}
                </div>
                <div style="color: var(--text-secondary); margin-top: 0.5rem;">
                    ${summary.pinnedNotes || 0} pinned
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
                            ${goalsByStatus.Completed || 0}
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Completed</div>
                    </div>
                    <div>
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--primary-color);">
                            ${goalsByStatus.InProgress || 0}
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">In Progress</div>
                    </div>
                    <div>
                        <div style="font-size: 1.25rem; font-weight: 600; color: var(--text-tertiary);">
                            ${goalsByStatus.NotStarted || 0}
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Not Started</div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <a href="goals.html" class="btn btn-sm btn-secondary">View All</a>
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
                ${latestThoughts.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${latestThoughts.map(t => `
                            <div style="padding: 0.5rem; background: var(--bg-tertiary); border-radius: 6px;">
                                <div style="color: var(--text-primary);">${escapeHtml((t.content || '').substring(0, 100))}${(t.content || '').length > 100 ? '...' : ''}</div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                    ${getMoodEmoji(t.mood)} ${formatDate(t.createdAt)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="color: var(--text-tertiary); text-align: center; padding: 1rem;">
                        No thoughts yet. <a href="thoughts.html">Add one!</a>
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
    div.textContent = text || '';
    return div.innerHTML;
}