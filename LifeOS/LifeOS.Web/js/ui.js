import { getCurrentUser, logout } from './auth.js';

// ─── Theme ────────────────────────────────────────────────────────────────────

export function initTheme() {
    // 1. Check if this page has a per-page theme override
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    const pageThemes  = JSON.parse(localStorage.getItem('lifeos_page_themes') || '{}');
    const pageTheme   = pageThemes[currentPage];

    // 2. Fall back to global theme
    const globalTheme = localStorage.getItem('lifeos_global_theme')
                     || localStorage.getItem('theme')
                     || 'light';

    const theme = pageTheme || globalTheme;
    applyTheme(theme);

    // 3. Wire up the topbar toggle (always switches light ↔ dark)
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        updateThemeIcon(theme);
        themeToggle.addEventListener('click', () => {
            const cur  = document.documentElement.getAttribute('data-theme') || 'light';
            const next = cur === 'dark' ? 'light' : 'dark';
            applyTheme(next);
            localStorage.setItem('theme', next);
            localStorage.setItem('lifeos_global_theme', next);
            updateThemeIcon(next);
        });
    }
}

function applyTheme(theme) {
    // 'light' → remove data-theme (uses :root defaults)
    const val = (!theme || theme === 'light') ? '' : theme;
    document.documentElement.setAttribute('data-theme', val);

    // Starfield for galaxy / animated
    document.querySelector('.star-bg')?.remove();
    if (theme === 'galaxy' || theme === 'animated') {
        addStarfield();
    }
}

function addStarfield() {
    const bg = document.createElement('div');
    bg.className = 'star-bg';
    bg.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;';
    for (let i = 0; i < 80; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        const size  = 1 + Math.random() * 2;
        const dur   = 2 + Math.random() * 4;
        const delay = Math.random() * 4;
        s.style.cssText = `
            position:absolute;
            left:${Math.random()*100}%;
            top:${Math.random()*100}%;
            width:${size}px;height:${size}px;
            border-radius:50%;background:white;
            opacity:${0.2+Math.random()*0.8};
            animation:twinkle ${dur}s ${delay}s ease-in-out infinite;
        `;
        bg.appendChild(s);
    }
    // Inject keyframes if not already present
    if (!document.getElementById('star-keyframes')) {
        const st = document.createElement('style');
        st.id = 'star-keyframes';
        st.textContent = `@keyframes twinkle {
            0%,100%{opacity:0.2;transform:scale(0.8)}
            50%{opacity:1;transform:scale(1.2)}
        }`;
        document.head.appendChild(st);
    }
    document.body.prepend(bg);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function initSidebar() {
    const menuToggle     = document.getElementById('menuToggle');
    const sidebar        = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            sidebarOverlay?.classList.toggle('visible');
        });
    }

    sidebarOverlay?.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        sidebarOverlay.classList.remove('visible');
    });

    // Highlight active nav item
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-page') === currentPage) {
            item.classList.add('active');
        }
    });
}

// ─── User menu ────────────────────────────────────────────────────────────────

export function initUserMenu() {
    const user = getCurrentUser();
    if (user) {
        const nameEl   = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');
        if (nameEl)   nameEl.textContent   = user.username || user.name || 'User';
        if (avatarEl) avatarEl.textContent = (user.username || user.name || 'U').charAt(0).toUpperCase();
    }

    document.getElementById('logoutBtn')?.addEventListener('click', e => {
        e.preventDefault();
        logout();
    });
}

// ─── Modals ───────────────────────────────────────────────────────────────────

export function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('active');
}

export function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('active');
}

export function initModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('active');
        });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay')?.classList.remove('active');
        });
    });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export function showToast(message, type = 'info') {
    const colors = {
        success: '#10b981',
        error:   '#ef4444',
        warning: '#f59e0b',
        info:    '#3b82f6',
    };
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position:fixed;top:20px;right:20px;
        padding:0.85rem 1.25rem;
        background:${colors[type] || colors.info};
        color:#fff;border-radius:8px;font-size:0.9rem;font-weight:500;
        box-shadow:0 4px 16px rgba(0,0,0,0.2);
        z-index:99999;max-width:320px;
        animation:slideIn 0.25s ease;
    `;

    // Inject slideIn/slideOut if needed
    if (!document.getElementById('toast-keyframes')) {
        const st = document.createElement('style');
        st.id = 'toast-keyframes';
        st.textContent = `
            @keyframes slideIn  { from{transform:translateX(120%);opacity:0} to{transform:translateX(0);opacity:1} }
            @keyframes slideOut { from{transform:translateX(0);opacity:1}    to{transform:translateX(120%);opacity:0} }
        `;
        document.head.appendChild(st);
    }

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.25s ease forwards';
        setTimeout(() => toast.remove(), 260);
    }, 3000);
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(dateString) {
    if (!dateString) return '';
    const date    = new Date(dateString);
    const now2    = new Date();
    const diffMs  = now2 - date;
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffDay === 0) return 'Today';
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7)   return `${diffDay} days ago`;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateForInput(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
}

// ─── Init all ─────────────────────────────────────────────────────────────────

export function initUI() {
    initTheme();
    initSidebar();
    initUserMenu();
    initModals();
}