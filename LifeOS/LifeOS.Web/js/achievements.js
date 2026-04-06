import { showToast } from './ui.js';

// Achievement System
class AchievementSystem {
    constructor() {
        this.achievements = this.loadAchievements();
        this.checkForNewAchievements();
    }

    loadAchievements() {
        const saved = localStorage.getItem('achievements');
        return saved ? JSON.parse(saved) : {
            unlocked: [],
            stats: {
                notesCreated: 0,
                goalsCompleted: 0,
                learningPagesChecked: 0,
                currentStreak: 0,
                longestStreak: 0,
                themesUsed: 0,
                totalLogins: 0
            }
        };
    }

    saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    // Define all achievements
    getAchievementDefinitions() {
        return [
            // Writing Achievements
            {
                id: 'first_note',
                name: '📝 First Steps',
                description: 'Create your first note',
                requirement: (stats) => stats.notesCreated >= 1,
                tier: 'bronze'
            },
            {
                id: 'note_master',
                name: '📚 Note Master',
                description: 'Create 50 notes',
                requirement: (stats) => stats.notesCreated >= 50,
                tier: 'gold'
            },
            {
                id: 'note_legend',
                name: '🏆 Note Legend',
                description: 'Create 100 notes',
                requirement: (stats) => stats.notesCreated >= 100,
                tier: 'platinum'
            },

            // Goal Achievements
            {
                id: 'goal_getter',
                name: '🎯 Goal Getter',
                description: 'Complete your first goal',
                requirement: (stats) => stats.goalsCompleted >= 1,
                tier: 'bronze'
            },
            {
                id: 'achievement_hunter',
                name: '🏅 Achievement Hunter',
                description: 'Complete 10 goals',
                requirement: (stats) => stats.goalsCompleted >= 10,
                tier: 'silver'
            },
            {
                id: 'dream_achiever',
                name: '⭐ Dream Achiever',
                description: 'Complete 25 goals',
                requirement: (stats) => stats.goalsCompleted >= 25,
                tier: 'gold'
            },

            // Learning Achievements
            {
                id: 'grammar_apprentice',
                name: '✍️ Grammar Apprentice',
                description: 'Check your first learning page',
                requirement: (stats) => stats.learningPagesChecked >= 1,
                tier: 'bronze'
            },
            {
                id: 'dedicated_learner',
                name: '📖 Dedicated Learner',
                description: 'Check 10 learning pages',
                requirement: (stats) => stats.learningPagesChecked >= 10,
                tier: 'silver'
            },
            {
                id: 'word_wizard',
                name: '🧙 Word Wizard',
                description: 'Check 25 learning pages',
                requirement: (stats) => stats.learningPagesChecked >= 25,
                tier: 'gold'
            },

            // Streak Achievements
            {
                id: 'streak_starter',
                name: '🔥 Streak Starter',
                description: 'Maintain a 3-day streak',
                requirement: (stats) => stats.currentStreak >= 3,
                tier: 'bronze'
            },
            {
                id: 'week_warrior',
                name: '💪 Week Warrior',
                description: 'Maintain a 7-day streak',
                requirement: (stats) => stats.currentStreak >= 7,
                tier: 'silver'
            },
            {
                id: 'unstoppable',
                name: '⚡ Unstoppable',
                description: 'Maintain a 30-day streak',
                requirement: (stats) => stats.currentStreak >= 30,
                tier: 'gold'
            },
            {
                id: 'legendary_streak',
                name: '👑 Legendary',
                description: 'Maintain a 100-day streak',
                requirement: (stats) => stats.longestStreak >= 100,
                tier: 'platinum'
            },

            // Theme Achievements
            {
                id: 'theme_explorer',
                name: '🎨 Theme Explorer',
                description: 'Try 5 different themes',
                requirement: (stats) => stats.themesUsed >= 5,
                tier: 'bronze'
            },
            {
                id: 'style_master',
                name: '✨ Style Master',
                description: 'Try all 13 themes',
                requirement: (stats) => stats.themesUsed >= 13,
                tier: 'gold'
            },

            // Consistency Achievements
            {
                id: 'early_bird',
                name: '🌅 Early Bird',
                description: 'Log in before 8 AM',
                requirement: (stats) => stats.earlyLogin === true,
                tier: 'bronze'
            },
            {
                id: 'night_owl',
                name: '🦉 Night Owl',
                description: 'Log in after 10 PM',
                requirement: (stats) => stats.lateLogin === true,
                tier: 'bronze'
            },
            {
                id: 'committed',
                name: '💎 Committed',
                description: 'Use LifeOS for 30 days',
                requirement: (stats) => stats.totalLogins >= 30,
                tier: 'gold'
            },

            // Special Achievements
            {
                id: 'perfectionist',
                name: '💯 Perfectionist',
                description: 'Get a perfect grammar score',
                requirement: (stats) => stats.perfectGrammar === true,
                tier: 'platinum'
            },
            {
                id: 'multi_tasker',
                name: '🎭 Multi-tasker',
                description: 'Use all modules in one day',
                requirement: (stats) => stats.allModulesInDay === true,
                tier: 'gold'
            },
            {
                id: 'productivity_guru',
                name: '🧘 Productivity Guru',
                description: 'Reach 90% productivity score',
                requirement: (stats) => stats.productivityScore >= 90,
                tier: 'platinum'
            }
        ];
    }

    checkForNewAchievements() {
        const definitions = this.getAchievementDefinitions();
        const newUnlocks = [];

        definitions.forEach(achievement => {
            // Check if already unlocked
            if (!this.achievements.unlocked.includes(achievement.id)) {
                // Check if requirement is met
                if (achievement.requirement(this.achievements.stats)) {
                    this.achievements.unlocked.push(achievement.id);
                    newUnlocks.push(achievement);
                }
            }
        });

        if (newUnlocks.length > 0) {
            this.saveAchievements();
            this.showAchievementNotifications(newUnlocks);
        }

        return newUnlocks;
    }

    showAchievementNotifications(achievements) {
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showAchievementPopup(achievement);
            }, index * 2000); // Stagger notifications
        });
    }

    showAchievementPopup(achievement) {
        // Create achievement popup
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-content ${achievement.tier}">
                <div class="achievement-icon">${achievement.name.split(' ')[0]}</div>
                <div class="achievement-details">
                    <div class="achievement-title">Achievement Unlocked!</div>
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .achievement-popup {
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 10000;
                animation: slideInRight 0.5s ease-out, slideOutRight 0.5s ease-in 4.5s;
            }

            .achievement-content {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                display: flex;
                gap: 1rem;
                align-items: center;
                min-width: 350px;
                color: white;
            }

            .achievement-content.bronze {
                background: linear-gradient(135deg, #cd7f32 0%, #b87333 100%);
            }

            .achievement-content.silver {
                background: linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%);
            }

            .achievement-content.gold {
                background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
                color: #333;
            }

            .achievement-content.platinum {
                background: linear-gradient(135deg, #e5e4e2 0%, #b4b4b4 100%);
                color: #333;
            }

            .achievement-icon {
                font-size: 3rem;
                animation: bounce 0.5s ease-out;
            }

            .achievement-title {
                font-size: 0.875rem;
                opacity: 0.9;
                font-weight: 600;
            }

            .achievement-name {
                font-size: 1.25rem;
                font-weight: 700;
                margin: 0.25rem 0;
            }

            .achievement-description {
                font-size: 0.875rem;
                opacity: 0.8;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }

            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(popup);

        // Play sound (optional)
        this.playAchievementSound();

        // Remove after animation
        setTimeout(() => {
            popup.remove();
        }, 5000);

        // Show toast as well
        showToast(`🏆 Achievement Unlocked: ${achievement.name}`, 'success');
    }

    playAchievementSound() {
        // Create achievement sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 523.25; // C5
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // Update stats methods
    incrementNotesCreated() {
        this.achievements.stats.notesCreated++;
        this.saveAchievements();
        this.checkForNewAchievements();
    }

    incrementGoalsCompleted() {
        this.achievements.stats.goalsCompleted++;
        this.saveAchievements();
        this.checkForNewAchievements();
    }

    incrementLearningPagesChecked() {
        this.achievements.stats.learningPagesChecked++;
        this.saveAchievements();
        this.checkForNewAchievements();
    }

    updateStreak(currentStreak) {
        this.achievements.stats.currentStreak = currentStreak;
        if (currentStreak > this.achievements.stats.longestStreak) {
            this.achievements.stats.longestStreak = currentStreak;
        }
        this.saveAchievements();
        this.checkForNewAchievements();
    }

    incrementThemesUsed(theme) {
        const usedThemes = new Set(JSON.parse(localStorage.getItem('usedThemes') || '[]'));
        usedThemes.add(theme);
        localStorage.setItem('usedThemes', JSON.stringify([...usedThemes]));
        this.achievements.stats.themesUsed = usedThemes.size;
        this.saveAchievements();
        this.checkForNewAchievements();
    }

    checkTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 8) {
            this.achievements.stats.earlyLogin = true;
        }
        if (hour >= 22) {
            this.achievements.stats.lateLogin = true;
        }
        this.saveAchievements();
        this.checkForNewAchievements();
    }

    incrementTotalLogins() {
        this.achievements.stats.totalLogins++;
        this.saveAchievements();
        this.checkForNewAchievements();
    }

    getUnlockedAchievements() {
        const definitions = this.getAchievementDefinitions();
        return this.achievements.unlocked.map(id => 
            definitions.find(a => a.id === id)
        );
    }

    getProgress() {
        const definitions = this.getAchievementDefinitions();
        const unlocked = this.achievements.unlocked.length;
        const total = definitions.length;
        return {
            unlocked,
            total,
            percentage: Math.round((unlocked / total) * 100)
        };
    }
}

// Motivational Quotes System
class MotivationalQuotes {
    constructor() {
        this.quotes = [
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain", mood: "motivated" },
            { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", mood: "confident" },
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", mood: "inspired" },
            { text: "Success is not final, failure is not fatal.", author: "Winston Churchill", mood: "resilient" },
            { text: "You are never too old to set another goal.", author: "C.S. Lewis", mood: "hopeful" },
            { text: "It always seems impossible until it's done.", author: "Nelson Mandela", mood: "determined" },
            { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", mood: "persistent" },
            { text: "The future belongs to those who believe in their dreams.", author: "Eleanor Roosevelt", mood: "dreaming" },
            { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", mood: "beginning" },
            { text: "Small progress is still progress.", author: "Unknown", mood: "patient" },
            { text: "You are capable of amazing things.", author: "Unknown", mood: "encouraging" },
            { text: "Every accomplishment starts with the decision to try.", author: "Unknown", mood: "brave" },
            { text: "Your only limit is you.", author: "Unknown", mood: "limitless" },
            { text: "Dream bigger. Do bigger.", author: "Unknown", mood: "ambitious" },
            { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown", mood: "dedicated" },
            { text: "Little by little, a little becomes a lot.", author: "Tanzanian Proverb", mood: "consistent" },
            { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", mood: "timely" },
            { text: "You are stronger than you think.", author: "Unknown", mood: "strong" },
            { text: "Progress, not perfection.", author: "Unknown", mood: "realistic" },
            { text: "You've got this! 💪", author: "LifeOS", mood: "cheerful" }
        ];
    }

    getDailyQuote() {
        // Get quote based on day of year (same quote per day)
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const index = dayOfYear % this.quotes.length;
        return this.quotes[index];
    }

    getRandomQuote() {
        return this.quotes[Math.floor(Math.random() * this.quotes.length)];
    }

    getQuoteByMood(mood) {
        const filtered = this.quotes.filter(q => q.mood === mood);
        return filtered.length > 0 
            ? filtered[Math.floor(Math.random() * filtered.length)]
            : this.getRandomQuote();
    }
}

// Export for use in other modules
export const achievementSystem = new AchievementSystem();
export const motivationalQuotes = new MotivationalQuotes();