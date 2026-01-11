// ===============================
// FinAdvisor AI – Script
// Finance & Stock Market Chatbot
// ===============================

// State
let chatId = null;
let isSetupOpen = false;

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const setupPanel = document.getElementById('setupPanel');
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('modelSelect');

// Backend / API URL (Node.js / Dialogflow / Gemini webhook)
const BACKEND_URL = 'https://your-backend-url.com';

// ===============================
// Load saved settings
// ===============================
function loadSettings() {
    const savedKey = localStorage.getItem('finadvisor_api_key');
    const savedModel = localStorage.getItem('finadvisor_model');

    if (savedKey) apiKeyInput.value = savedKey;
    if (savedModel) modelSelect.value = savedModel;
}

// ===============================
// Save settings
// ===============================
function saveSetup() {
    localStorage.setItem('finadvisor_api_key', apiKeyInput.value);
    localStorage.setItem('finadvisor_model', modelSelect.value);

    chatId = null; // reset conversation
    toggleSetup();
    showNotification('Settings saved successfully');
}

// ===============================
// Toggle setup panel
// ===============================
function toggleSetup() {
    isSetupOpen = !isSetupOpen;
    setupPanel.classList.toggle('open', isSetupOpen);
}

// ===============================
// Notification
// ===============================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        background: var(--accent);
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        font-size: 0.875rem;
        z-index: 200;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 2000);
}

// ===============================
// Add message to chat
// ===============================
function addMessage(content, role) {
    const welcome = chatMessages.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = role === 'user' ? '👤' : '📊';

    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">${formatContent(content)}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}

// ===============================
// Format content
// ===============================
function formatContent(text) {
    if (!text) return '';
    return text
        .split('\n\n').map(p => `<p>${p}</p>`).join('')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

// ===============================
// Loading indicator
// ===============================
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.id = 'loading-message';
    loadingDiv.innerHTML = `
        <div class="message-avatar">📊</div>
        <div class="message-content">
            <div class="loading">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('loading-message');
    if (loading) loading.remove();
}

// ===============================
// Error display
// ===============================
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    chatMessages.appendChild(errorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===============================
// Headers
// ===============================
function getHeaders() {
    const apiKey = apiKeyInput.value || localStorage.getItem('finadvisor_api_key');
    return {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
}

// ===============================
// Create new chat
// ===============================
async function createChat() {
    const model = modelSelect.value || localStorage.getItem('finadvisor_model');

    const response = await fetch(`${BACKEND_URL}/chat/create`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ model })
    });

    if (!response.ok) {
        throw new Error('Unable to start chat session');
    }

    const data = await response.json();
    return data.chatId;
}

// ===============================
// Send message
// ===============================
async function sendMessage(content) {
    const apiKey = apiKeyInput.value || localStorage.getItem('finadvisor_api_key');

    if (!apiKey) {
        showError('Please add your API key in settings');
        toggleSetup();
        return;
    }

    addMessage(content, 'user');
    messageInput.value = '';
    messageInput.disabled = true;
    sendBtn.disabled = true;

    showLoading();

    try {
        if (!chatId) {
            chatId = await createChat();
        }

        const response = await fetch(`${BACKEND_URL}/chat/message`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                chatId,
                message: content
            })
        });

        removeLoading();

        if (!response.ok) {
            throw new Error('Failed to fetch response');
        }

        const data = await response.json();
        addMessage(data.reply, 'assistant');

    } catch (error) {
        removeLoading();
        showError(error.message);
        console.error(error);
    } finally {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// ===============================
// Suggestions
// ===============================
function sendSuggestion(text) {
    sendMessage(text);
}

// ===============================
// Events
// ===============================
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = messageInput.value.trim();
    if (content) sendMessage(content);
});

// Init
loadSettings();

// Expose functions
window.toggleSetup = toggleSetup;
window.saveSetup = saveSetup;
window.sendSuggestion = sendSu
