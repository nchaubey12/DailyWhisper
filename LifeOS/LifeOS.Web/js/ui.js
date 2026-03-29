import { getCurrentUser, logout } from './auth.js';

// Theme Management
export function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        // Create theme menu
        const themeMenu = document.createElement('div');
        themeMenu.id = 'themeMenu';
        themeMenu.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            margin-top: 0.5rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 0.5rem;
            display: none;
            z-index: 1000;
            min-width: 150px;
        `;
        
        const themes = [
            { value: 'light', label: '☀️ Light', icon: '☀️' },
            { value: 'dark', label: '🌙 Dark', icon: '🌙' },
            { value: 'pastel', label: '🌸 Pastel', icon: '🌸' },
            { value: 'animated', label: '✨ Animated', icon: '✨' }
        ];
        
        themes.forEach(theme => {
            const option = document.createElement('div');
            option.textContent = theme.label;
            option.style.cssText = `
                padding: 0.5rem;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s;
            `;
            option.addEventListener('mouseover', () => {
                option.style.background = 'var(--bg-tertiary)';
            });
            option.addEventListener('mouseout', () => {
                option.style.background = 'transparent';
            });
            option.addEventListener('click', () => {
                setTheme(theme.value);
                themeMenu.style.display = 'none';
            });
            themeMenu.appendChild(option);
        });
        
        themeToggle.parentElement.style.position = 'relative';
        themeToggle.parentElement.appendChild(themeMenu);
        
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            themeMenu.style.display = themeMenu.style.display === 'none' ? 'block' : 'none';
        });
        
        document.addEventListener('click', () => {
            themeMenu.style.display = 'none';
        });
        
        updateThemeIcon(savedTheme);
    }
}

export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
}

export function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const themes = ['light', 'dark', 'pastel', 'animated'];
    const currentIndex = themes.indexOf(currentTheme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const icons = {
            light: '☀️',
            dark: '🌙',
            pastel: '🌸',
            animated: '✨'
        };
        themeToggle.textContent = icons[theme] || '🌙';
    }
}

// Sidebar Management
export function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (sidebarOverlay) {
                sidebarOverlay.classList.toggle('visible');
            }
        });
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('visible');
        });
    }
    
    // Highlight active nav item
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        const href = item.getAttribute('data-page');
        if (href === currentPage) {
            item.classList.add('active');
        }
    });
}

// User Menu
export function initUserMenu() {
    const user = getCurrentUser();
    if (user) {
        const userNameElement = document.getElementById('userName');
        const userAvatarElement = document.getElementById('userAvatar');
        
        if (userNameElement) {
            userNameElement.textContent = user.username;
        }
        
        if (userAvatarElement) {
            userAvatarElement.textContent = user.username.charAt(0).toUpperCase();
        }
    }
    
    // Logout handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Modal Management
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

export function initModals() {
    // Close modal when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
    
    // Close modal buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal-overlay').classList.remove('active');
        });
    });
}

// Toast Notifications
export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Format Date
export function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

// Format Date for Input
export function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Initialize all UI components
export function initUI() {
    initTheme();
    initSidebar();
    initUserMenu();
    initModals();
}
