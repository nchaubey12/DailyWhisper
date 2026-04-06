import api from './api.js';

// Check if user is authenticated
export function isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
}

// Get current user
export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
}

// Logout
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
    window.location.href = '/pages/login.html';
}

// Check token expiry — only kicks if tokenExpiry key actually exists AND is expired
function isTokenExpired() {
    const expiryStr = localStorage.getItem('tokenExpiry');
    // FIX: if tokenExpiry was never stored, don't treat it as expired
    if (!expiryStr) return false;
    const expiry = new Date(expiryStr);
    // Guard against invalid date strings
    if (isNaN(expiry.getTime())) return false;
    return new Date() >= expiry;
}

// Protect pages - redirect to login if not authenticated
export function protectPage() {
    if (!isAuthenticated() || isTokenExpired()) {
        logout();
    }
}

// ─── Login Form Handler ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailOrUsername = document.getElementById('emailOrUsername').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('errorMessage');

            try {
                const response = await api.request('/auth/login', {
                    method: 'POST',
                    auth: false,
                    body: JSON.stringify({ emailOrUsername, password })
                });

                if (response && response.success) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    if (response.expiry) {
                        localStorage.setItem('tokenExpiry', response.expiry);
                    }
                    window.location.href = '/pages/dashboard.html';
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = (response && response.message) || 'Login failed.';
                        errorDiv.style.display = 'block';
                    }
                }
            } catch (error) {
                if (errorDiv) {
                    errorDiv.textContent = error.message || 'Login failed. Please try again.';
                    errorDiv.style.display = 'block';
                }
            }
        });
    }

    // ─── Register Form Handler ────────────────────────────────────────────────
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');

            try {
                const response = await api.request('/auth/register', {
                    method: 'POST',
                    auth: false,
                    body: JSON.stringify({ username, email, password })
                });

                if (response && response.success) {
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    if (response.expiry) {
                        localStorage.setItem('tokenExpiry', response.expiry);
                    }

                    if (successDiv) {
                        successDiv.textContent = 'Account created successfully! Redirecting...';
                        successDiv.style.display = 'block';
                    }
                    if (errorDiv) errorDiv.style.display = 'none';

                    setTimeout(() => {
                        window.location.href = '/pages/dashboard.html';
                    }, 1500);
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = (response && response.message) || 'Registration failed.';
                        errorDiv.style.display = 'block';
                    }
                    if (successDiv) successDiv.style.display = 'none';
                }
            } catch (error) {
                if (errorDiv) {
                    errorDiv.textContent = error.message || 'Registration failed. Please try again.';
                    errorDiv.style.display = 'block';
                }
                if (successDiv) successDiv.style.display = 'none';
            }
        });
    }
});