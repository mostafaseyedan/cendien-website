/**
 * @file auth.js
 * @description Handles user authentication and session management for the analyzers.
 */

const CORRECT_USERNAME = "Cendien";
const CORRECT_PASSWORD = "rfpanalyzer";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks if a valid session exists in localStorage.
 * @returns {boolean} - True if the session is valid, false otherwise.
 */
function isSessionValid() {
    const storedTimestamp = localStorage.getItem('rfpAnalyzerLoginTimestamp');
    if (!storedTimestamp) return false;
    const lastLoginTime = parseInt(storedTimestamp, 10);
    if (isNaN(lastLoginTime)) {
        localStorage.removeItem('rfpAnalyzerLoginTimestamp');
        return false;
    }
    return (Date.now() - lastLoginTime) < SESSION_DURATION;
}

/**
 * Initializes the authentication flow for a page.
 * @param {HTMLElement} authModalEl - The authentication modal overlay element.
 * @param {HTMLElement} authFormEl - The form element inside the modal.
 * @param {HTMLElement} usernameInputEl - The username input element.
 * @param {HTMLElement} passwordInputEl - The password input element.
 * @param {HTMLElement} errorMessageEl - The element to display login errors.
 * @param {HTMLElement} pageWrapperEl - The main content wrapper to show/hide.
 * @param {function} onLoginSuccess - The callback function to execute after a successful login.
 */
export function initializeAuth(authModalEl, authFormEl, usernameInputEl, passwordInputEl, errorMessageEl, pageWrapperEl, onLoginSuccess) {
    const handleSuccessfulLogin = () => {
        localStorage.setItem('rfpAnalyzerLoginTimestamp', Date.now().toString());
        if (authModalEl) {
            authModalEl.classList.add('auth-modal-hidden');
            authModalEl.style.display = 'none';
        }
        if (pageWrapperEl) {
            pageWrapperEl.classList.remove('content-hidden');
            pageWrapperEl.style.display = '';
        }
        if (onLoginSuccess) onLoginSuccess();
    };

    const showLoginError = (message) => {
        if (errorMessageEl) {
            errorMessageEl.textContent = message;
            errorMessageEl.style.display = 'block';
        }
        if (passwordInputEl) passwordInputEl.value = '';
        if (usernameInputEl) usernameInputEl.focus();
    };

    if (isSessionValid()) {
        handleSuccessfulLogin();
    } else {
        if (authModalEl) {
            authModalEl.classList.remove('auth-modal-hidden');
            authModalEl.style.display = 'flex';
        }
        if (pageWrapperEl) {
            pageWrapperEl.classList.add('content-hidden');
            pageWrapperEl.style.display = 'none';
        }
        if (authFormEl) {
            authFormEl.addEventListener('submit', (event) => {
                event.preventDefault();
                if (!usernameInputEl || !passwordInputEl) {
                    showLoginError("Login form elements are missing.");
                    return;
                }
                const username = usernameInputEl.value.trim();
                const password = passwordInputEl.value;

                if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
                    if (errorMessageEl) errorMessageEl.style.display = 'none';
                    handleSuccessfulLogin();
                } else {
                    showLoginError("Invalid username or password. Please try again.");
                }
            });
        } else {
            console.error("Authentication form not found. Page cannot load correctly.");
            if (document.body) document.body.innerHTML = "<div style='text-align:center; padding: 50px; font-family: sans-serif;'><h1>Configuration Error</h1><p>Login form not found. Page cannot load.</p></div>";
        }
    }
}
