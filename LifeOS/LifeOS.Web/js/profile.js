import { protectPage, getCurrentUser } from './auth.js';
import { initUI, showToast } from './ui.js';

protectPage();
initUI();

const themes = [
    { id: 'light', name: '☀️ Light', class: '' },
    { id: 'dark', name: '🌙 Dark', class: '' },
    { id: 'pastel', name: '🌸 Pastel', class: '' },
    { id: 'animated', name: '✨ Animated', class: '' },
    { id: 'cute-animals', name: '🐻 Cute Animals', class: 'cute-animals' },
    { id: 'pastel-flowers', name: '🌺 Pastel Flowers', class: 'pastel-flowers' },
    { id: 'bullet-journal', name: '📓 Bullet Journal', class: 'bullet-journal' },
    { id: 'daily-planner', name: '📅 Daily Planner', class: 'daily-planner' },
    { id: 'kawaii', name: '🎀 Kawaii', class: 'kawaii' },
    { id: 'notebook', name: '📔 Notebook', class: 'notebook' },
    { id: 'stickers', name: '⭐ Stickers', class: 'stickers' },
    { id: 'galaxy', name: '🌌 Galaxy', class: 'galaxy' },
    { id: 'forest', name: '🌲 Forest', class: 'forest' }
];

const pages = [
    { id: 'dashboard', name: '📊 Dashboard', file: 'dashboard.html' },
    { id: 'notes', name: '📝 Notes', file: 'notes.html' },
    { id: 'goals', name: '🎯 Goals', file: 'goals.html' },
    { id: 'deadlines', name: '⏰ Deadlines', file: 'deadlines.html' },
    { id: 'routines', name: '🔁 Routines', file: 'routines.html' },
    { id: 'thoughts', name: '💭 Thoughts', file: 'thoughts.html' },
    { id: 'learning', name: '📖 Learning', file: 'learning.html' }
];

// FIX: safe JSON.parse with fallback
function safeParse(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
}

let selectedGlobalTheme = localStorage.getItem('theme') || 'light';
let pageThemes = safeParse('pageThemes', {});
let uploadedBackgrounds = safeParse('customBackgrounds', []);

document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    renderGlobalThemes();
    renderPageThemes();
    renderUploadedBackgrounds();
    initEventListeners();       // regular theme / upload events
    initAnimatedThemeEvents();  // FIX: animated cards must bind AFTER DOM is ready
    restoreAnimatedTheme();     // re-apply saved animated theme on page load
});

function loadUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const usernameEl = document.getElementById('profileUsername');
        const emailEl = document.getElementById('profileEmail');
        if (usernameEl) usernameEl.value = user.username;
        if (emailEl) emailEl.value = user.email;
    }
}

function renderGlobalThemes() {
    const container = document.getElementById('globalThemePreview');
    if (!container) return;

    container.innerHTML = themes.map(theme => `
        <div class="theme-card ${theme.class} ${theme.id === selectedGlobalTheme ? 'selected' : ''}"
             data-theme="${theme.id}">
            <h4>${theme.name}</h4>
            <p style="font-size: 0.75rem; opacity: 0.8; margin: 0;">Click to preview</p>
        </div>
    `).join('');

    container.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            selectedGlobalTheme = card.dataset.theme;
            document.documentElement.setAttribute('data-theme', selectedGlobalTheme);
            renderGlobalThemes();
        });
    });
}

function renderPageThemes() {
    const container = document.getElementById('pageThemeSelector');
    if (!container) return;

    container.innerHTML = pages.map(page => `
        <div class="page-theme-row">
            <strong>${page.name}</strong>
            <select class="form-select page-theme-select" data-page="${page.id}">
                <option value="">Use Global Theme</option>
                ${themes.map(theme => `
                    <option value="${theme.id}" ${pageThemes[page.id] === theme.id ? 'selected' : ''}>
                        ${theme.name}
                    </option>
                `).join('')}
            </select>
            <button class="btn btn-sm btn-secondary preview-btn" data-page="${page.file}">
                Preview
            </button>
        </div>
    `).join('');

    container.querySelectorAll('.page-theme-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const page = e.target.dataset.page;
            const theme = e.target.value;
            if (theme) {
                pageThemes[page] = theme;
            } else {
                delete pageThemes[page];
            }
            localStorage.setItem('pageThemes', JSON.stringify(pageThemes));
            showToast(`Theme for ${page} updated!`, 'success');
        });
    });

    container.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', () => window.open(btn.dataset.page, '_blank'));
    });
}

function renderUploadedBackgrounds() {
    const container = document.getElementById('uploadedImages');
    if (!container) return;

    if (uploadedBackgrounds.length === 0) {
        container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; grid-column: 1/-1;">No custom backgrounds uploaded yet</p>';
        return;
    }

    container.innerHTML = uploadedBackgrounds.map((bg, index) => `
        <div style="position: relative;">
            <img src="${bg}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; cursor: pointer;"
                 data-bg="${bg}" class="bg-preview">
            <button class="btn btn-sm btn-danger delete-bg"
                    style="position: absolute; top: 0.5rem; right: 0.5rem;"
                    data-index="${index}">✕</button>
        </div>
    `).join('');

    container.querySelectorAll('.bg-preview').forEach(img => {
        img.addEventListener('click', () => {
            document.body.style.backgroundImage = `url(${img.dataset.bg})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            localStorage.setItem('customBackground', img.dataset.bg);
            showToast('Background applied!', 'success');
        });
    });

    container.querySelectorAll('.delete-bg').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index);
            uploadedBackgrounds.splice(index, 1);
            localStorage.setItem('customBackgrounds', JSON.stringify(uploadedBackgrounds));
            renderUploadedBackgrounds();
            showToast('Background deleted', 'success');
        });
    });
}

function initEventListeners() {
    const applyBtn = document.getElementById('applyToAllBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            const themeName = themes.find(t => t.id === selectedGlobalTheme)?.name || selectedGlobalTheme;
            if (confirm(`Apply "${themeName}" to all pages?`)) {
                localStorage.setItem('theme', selectedGlobalTheme);
                pageThemes = {};
                localStorage.setItem('pageThemes', JSON.stringify(pageThemes));
                renderPageThemes();
                showToast('Theme applied to all pages!', 'success');
            }
        });
    }

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('bgImageInput');

    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-color)';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = 'var(--border-color)';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--border-color)';
            const file = e.dataTransfer.files[0];
            if (file) handleFileUpload(file);
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileUpload(file);
        });
    }
}

// FIX: Separate function for animated theme card binding, called inside DOMContentLoaded
function initAnimatedThemeEvents() {
    const animatedCards = document.querySelectorAll(
        '.theme-card[data-theme="flying-birds"], ' +
        '.theme-card[data-theme="floating-teddies"], ' +
        '.theme-card[data-theme="starry-night"], ' +
        '.theme-card[data-theme="sakura-petals"], ' +
        '.theme-card[data-theme="none"]'
    );

    animatedCards.forEach(card => {
        card.addEventListener('click', () => {
            const theme = card.dataset.theme;

            if (theme === 'none') {
                // Remove any active animation
                const existing = document.getElementById('animated-theme');
                if (existing) existing.remove();
                const oldStyle = document.getElementById('animated-theme-style');
                if (oldStyle) oldStyle.remove();
                localStorage.removeItem('animatedTheme');
                document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                showToast('Animated theme removed', 'success');
                return;
            }

            enableAnimatedTheme(theme);
            document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const label = card.querySelector('h4')?.textContent || theme;
            showToast(`${label} theme activated!`, 'success');
        });
    });
}

function restoreAnimatedTheme() {
    const saved = localStorage.getItem('animatedTheme');
    if (saved) {
        enableAnimatedTheme(saved);
        // Mark card as selected if visible
        const card = document.querySelector(`.theme-card[data-theme="${saved}"]`);
        if (card) card.classList.add('selected');
    }
}

function handleFileUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('File too large. Max 5MB', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const dataUrl = e.target.result;
        uploadedBackgrounds.push(dataUrl);
        localStorage.setItem('customBackgrounds', JSON.stringify(uploadedBackgrounds));
        renderUploadedBackgrounds();
        showToast('Image uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
}

// ─── Animated Theme Creators ─────────────────────────────────────────────────

function enableAnimatedTheme(theme) {
    // Remove any existing animation container
    const existing = document.getElementById('animated-theme');
    if (existing) existing.remove();

    // Remove old injected style
    const oldStyle = document.getElementById('animated-theme-style');
    if (oldStyle) oldStyle.remove();

    if (!theme) {
        localStorage.removeItem('animatedTheme');
        return;
    }

    const container = document.createElement('div');
    container.id = 'animated-theme';
    container.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    `;

    switch (theme) {
        case 'flying-birds':     createFlyingBirds(container);     break;
        case 'floating-teddies': createFloatingTeddies(container); break;
        case 'starry-night':     createStarryNight(container);     break;
        case 'sakura-petals':    createSakuraPetals(container);    break;
        default:
            return; // unknown theme — don't append
    }

    document.body.appendChild(container);
    localStorage.setItem('animatedTheme', theme);
}

function injectAnimStyle(id, css) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
}

function createFlyingBirds(container) {
    injectAnimStyle('animated-theme-style', `
        @keyframes flyAcross {
            from { transform: translateX(-120px); }
            to   { transform: translateX(calc(100vw + 120px)); }
        }
    `);

    for (let i = 0; i < 6; i++) {
        const bird = document.createElement('div');
        bird.textContent = '🐦';
        bird.style.cssText = `
            position: absolute;
            font-size: ${1.5 + Math.random()}rem;
            animation: flyAcross ${12 + Math.random() * 10}s linear infinite;
            animation-delay: ${Math.random() * 8}s;
            top: ${5 + Math.random() * 55}%;
        `;
        container.appendChild(bird);
    }
}

function createFloatingTeddies(container) {
    injectAnimStyle('animated-theme-style', `
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33%       { transform: translateY(-18px) rotate(3deg); }
            66%       { transform: translateY(-8px) rotate(-3deg); }
        }
    `);

    for (let i = 0; i < 7; i++) {
        const teddy = document.createElement('div');
        teddy.textContent = '🧸';
        teddy.style.cssText = `
            position: absolute;
            font-size: ${2 + Math.random() * 1.5}rem;
            animation: float ${5 + Math.random() * 5}s ease-in-out infinite;
            animation-delay: ${Math.random() * 4}s;
            left: ${Math.random() * 90}%;
            top:  ${Math.random() * 85}%;
        `;
        container.appendChild(teddy);
    }
}

function createStarryNight(container) {
    injectAnimStyle('animated-theme-style', `
        @keyframes twinkle {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.3; transform: scale(0.8); }
        }
    `);

    // Dark overlay to sell the night sky
    container.style.background = 'rgba(10, 8, 30, 0.35)';

    for (let i = 0; i < 60; i++) {
        const star = document.createElement('div');
        star.textContent = i % 10 === 0 ? '⭐' : '✦';
        star.style.cssText = `
            position: absolute;
            font-size: ${i % 10 === 0 ? '1.2rem' : (0.5 + Math.random() * 0.8) + 'rem'};
            color: ${i % 10 === 0 ? '#ffe066' : '#fff'};
            animation: twinkle ${1.5 + Math.random() * 3}s ease-in-out infinite;
            animation-delay: ${Math.random() * 3}s;
            left: ${Math.random() * 98}%;
            top:  ${Math.random() * 98}%;
        `;
        container.appendChild(star);
    }
}

function createSakuraPetals(container) {
    injectAnimStyle('animated-theme-style', `
        @keyframes fall {
            0%   { transform: translateY(-60px) rotate(0deg);   opacity: 1; }
            100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
    `);

    for (let i = 0; i < 20; i++) {
        const petal = document.createElement('div');
        petal.textContent = '🌸';
        petal.style.cssText = `
            position: absolute;
            font-size: ${0.8 + Math.random() * 1.4}rem;
            animation: fall ${6 + Math.random() * 8}s linear infinite;
            animation-delay: ${Math.random() * 8}s;
            left: ${Math.random() * 100}%;
            top: -60px;
        `;
        container.appendChild(petal);
    }
}