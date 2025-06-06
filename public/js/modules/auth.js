/**
 * @file auth.js
 * @description Handles user authentication and session management for the analyzers.
 */

const CORRECT_USERNAME = "Cendien";
const CORRECT_PASSWORD = "rfpanalyzer";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Checks if a valid session exists in localStorage.
 * @param {string} loginTimestampKey - The key used to store the login timestamp in localStorage.
 * @returns {boolean} - True if the session is valid, false otherwise.
 */
function isSessionValid(loginTimestampKey) {
    const storedTimestamp = localStorage.getItem(loginTimestampKey);
    if (!storedTimestamp) return false;
    const lastLoginTime = parseInt(storedTimestamp, 10);
    if (isNaN(lastLoginTime)) {
        localStorage.removeItem(loginTimestampKey);
        return false;
    }
    return (Date.now() - lastLoginTime) < SESSION_DURATION;
}

/**
 * Initializes the authentication flow for a page.
 * @param {object} options - Configuration options.
 * @param {string} options.loginTimestampKey - The localStorage key for the session.
 * @param {HTMLElement} options.authModalEl - The authentication modal overlay element.
 * @param {HTMLElement} options.authFormEl - The form element inside the modal.
 * @param {HTMLElement} options.usernameInputEl - The username input element.
 * @param {HTMLElement} options.passwordInputEl - The password input element.
 * @param {HTMLElement} options.errorMessageEl - The element to display login errors.
 * @param {HTMLElement} options.pageWrapperEl - The main content wrapper to show/hide.
 * @param {function} onLoginSuccess - The callback function to execute after a successful login.
 */
export function initializeAuth({
    loginTimestampKey,
    authModalEl,
    authFormEl,
    usernameInputEl,
    passwordInputEl,
    errorMessageEl,
    pageWrapperEl,
    onLoginSuccess
}) {

    const handleSuccessfulLogin = () => {
        localStorage.setItem(loginTimestampKey, Date.now().toString());
        if (authModalEl) {
            authModalEl.classList.add('auth-modal-hidden');
            authModalEl.style.display = 'none';
        }
        if (pageWrapperEl) {
            pageWrapperEl.classList.remove('content-hidden');
            pageWrapperEl.style.display = '';
        }
        onLoginSuccess();
    };

    const showLoginError = (message) => {
        if (errorMessageEl) {
            errorMessageEl.textContent = message;
            errorMessageEl.style.display = 'block';
        }
        if (passwordInputEl) passwordInputEl.value = '';
        if (usernameInputEl) usernameInputEl.focus();
    };

    if (isSessionValid(loginTimestampKey)) {
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
