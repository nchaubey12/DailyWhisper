import { protectPage } from './auth.js';
import { initUI } from './ui.js';
import { achievementSystem } from './achievements.js';

protectPage();
initUI();

let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    renderProgress();
    renderAchievements();
    initFilters();
    achievementSystem.checkTimeOfDay();
});

function renderProgress() {
    const progress = achievementSystem.getProgress();
    const unlocked = achievementSystem.getUnlockedAchievements();
    
    // Update progress circle
    const circle = document.getElementById('progressCircle');
    const circumference = 565.48; // 2 * PI * 90
    const offset = circumference - (circumference * progress.percentage / 100);
    circle.style.strokeDashoffset = offset;
    
    // Update progress text
    document.getElementById('progressText').textContent = `${progress.percentage}%`;
    document.getElementById('unlockedCount').textContent = progress.unlocked;
    document.getElementById('totalCount').textContent = progress.total;
    
    // Count by tier
    const tierCounts = {
        bronze: 0,
        silver: 0,
        gold: 0,
        platinum: 0
    };
    
    unlocked.forEach(achievement => {
        if (achievement && tierCounts[achievement.tier] !== undefined) {
            tierCounts[achievement.tier]++;
        }
    });
    
    document.getElementById('bronzeCount').textContent = tierCounts.bronze;
    document.getElementById('silverCount').textContent = tierCounts.silver;
    document.getElementById('goldCount').textContent = tierCounts.gold;
    document.getElementById('platinumCount').textContent = tierCounts.platinum;
}

function renderAchievements(filter = 'all') {
    const allAchievements = achievementSystem.getAchievementDefinitions();
    const unlockedIds = achievementSystem.achievements.unlocked;
    
    const grid = document.getElementById('achievementsGrid');
    
    let filtered = allAchievements;
    
    if (filter === 'unlocked') {
        filtered = allAchievements.filter(a => unlockedIds.includes(a.id));
    } else if (filter === 'locked') {
        filtered = allAchievements.filter(a => !unlockedIds.includes(a.id));
    } else if (['bronze', 'silver', 'gold', 'platinum'].includes(filter)) {
        filtered = allAchievements.filter(a => a.tier === filter);
    }
    
    grid.innerHTML = filtered.map(achievement => {
        const isUnlocked = unlockedIds.includes(achievement.id);
        
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-tier tier-${achievement.tier}">
                    ${achievement.tier}
                </div>
                <div class="achievement-badge">
                    ${isUnlocked ? achievement.name.split(' ')[0] : '🔒'}
                </div>
                <h3 style="margin: 0.5rem 0; color: var(--text-primary);">
                    ${isUnlocked ? achievement.name : '???'}
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.875rem;">
                    ${isUnlocked ? achievement.description : 'Complete this achievement to unlock!'}
                </p>
                ${isUnlocked ? `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); color: var(--text-tertiary); font-size: 0.75rem;">
                        ✓ Unlocked
                    </div>
                ` : getProgressHint(achievement)}
            </div>
        `;
    }).join('');
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-tertiary);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                <p>No achievements found in this category.</p>
            </div>
        `;
    }
}

function getProgressHint(achievement) {
    const stats = achievementSystem.achievements.stats;
    let hint = '';
    
    // Try to give helpful progress hints
    if (achievement.id.includes('note')) {
        hint = `${stats.notesCreated} notes created`;
    } else if (achievement.id.includes('goal')) {
        hint = `${stats.goalsCompleted} goals completed`;
    } else if (achievement.id.includes('learning') || achievement.id.includes('grammar')) {
        hint = `${stats.learningPagesChecked} pages checked`;
    } else if (achievement.id.includes('streak')) {
        hint = `Current streak: ${stats.currentStreak} days`;
    } else if (achievement.id.includes('theme')) {
        hint = `${stats.themesUsed} themes tried`;
    } else if (achievement.id === 'committed') {
        hint = `${stats.totalLogins} days active`;
    }
    
    if (hint) {
        return `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); color: var(--text-tertiary); font-size: 0.75rem;">
                ${hint}
            </div>
        `;
    }
    
    return '';
}

function initFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            currentFilter = filter;
            renderAchievements(filter);
        });
    });
}