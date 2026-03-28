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
    return userStr ? JSON.parse(userStr) : null;
}

// Logout
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
}

// Check token expiry
function isTokenExpired() {
    const expiryStr = localStorage.getItem('tokenExpiry');
    if (!expiryStr) return true;
    
    const expiry = new Date(expiryStr);
    return new Date() >= expiry;
}

// Protect pages - redirect to login if not authenticated
export function protectPage() {
    if (!isAuthenticated() || isTokenExpired()) {
        logout();
    }
}

// Login Form Handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
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
            
            if (response.success) {
                // Store token and user info
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                localStorage.setItem('tokenExpiry', response.expiry);
                
                // Redirect to dashboard
                window.location.href = '/pages/dashboard.html';
            } else {
                errorDiv.textContent = response.message;
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
}

// Register Form Handler
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
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
            
            if (response.success) {
                // Store token and user info
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));
                localStorage.setItem('tokenExpiry', response.expiry);
                
                // Show success message
                successDiv.textContent = 'Account created successfully! Redirecting...';
                successDiv.style.display = 'block';
                errorDiv.style.display = 'none';
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = '/pages/dashboard.html';
                }, 1500);
            } else {
                errorDiv.textContent = response.message;
                errorDiv.style.display = 'block';
                successDiv.style.display = 'none';
            }
        } catch (error) {
            errorDiv.textContent = error.message || 'Registration failed. Please try again.';
            errorDiv.style.display = 'block';
            successDiv.style.display = 'none';
        }
    });
}
