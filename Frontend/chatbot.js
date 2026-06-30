/**
 * TryOnix AI Fashion Assistant Client Script
 * Version: 1.0.0
 * Standalone reusable vanilla JS component.
 */

(function () {
  // Config
  const CONFIG = {
    storageKey: 'tryonix_chat_history',
    unreadKey: 'tryonix_chat_unread'
  };

  // Welcome Message
  const WELCOME_MESSAGE = `👋 Hi! I'm your AI Fashion Assistant.

I can help you:
✨ **Find outfits** matching your style
👗 **Style your look** with accessories and shoes
🎉 **Pick clothes** for weddings, office, or parties
💰 **Recommend outfits** within your budget
🧥 **Match colors** and guide your fashion choices

Ask me anything!`;

  // Suggestions list
  const SUGGESTIONS = [
    "What should I wear for a wedding?",
    "Suggest office outfits",
    "Recommend summer outfits",
    "Traditional Indian wear",
    "Party look",
    "Budget under ₹2000",
    "What matches blue jeans?"
  ];

  // State
  let isOpen = false;
  let chatHistory = [];
  let isTyping = false;

  // DOM Elements injected dynamically
  let chatBadgeContainer = null;
  let chatWindow = null;
  let messagesContainer = null;
  let textInput = null;
  let sendButton = null;
  let chatBtn = null;
  let toastElement = null;

  // Initializer
  function init() {
    // Avoid double injection
    if (document.getElementById('tryonix-chatbot-root')) return;

    injectHtml();
    cacheElements();
    bindEvents();
    loadSession();
    renderMessages();
    checkUnreadBadge();
  }

  // Inject HTML Elements
  function injectHtml() {
    const root = document.createElement('div');
    root.id = 'tryonix-chatbot-root';

    root.innerHTML = `
      <!-- Trigger Button -->
      <div class="tryonix-chat-badge-container" id="tryonix-badge-container">
        <button class="tryonix-chat-btn" id="tryonix-chat-btn" aria-label="Open AI Fashion Assistant" title="Open AI Fashion Assistant">
          💁‍♀️
        </button>
      </div>

      <!-- Chat Window -->
      <div class="tryonix-chat-window" id="tryonix-chat-window" aria-hidden="true">
        <!-- Header -->
        <div class="tryonix-chat-header">
          <div class="tryonix-header-info">
            <div class="tryonix-header-avatar">
              💁‍♀️
              <span class="tryonix-status-dot"></span>
            </div>
            <div class="tryonix-header-title">
              <span class="tryonix-header-name">AI Stylist</span>
              <span class="tryonix-header-status">Online • Stylist AI</span>
            </div>
          </div>
          <div class="tryonix-header-actions">
            <button class="tryonix-header-btn" id="tryonix-clear-btn" title="Clear conversation" aria-label="Clear conversation">
              🗑️
            </button>
            <button class="tryonix-header-btn close-btn" id="tryonix-close-btn" title="Close" aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <!-- Messages Box -->
        <div class="tryonix-chat-messages" id="tryonix-chat-messages">
          <!-- Messages will load here dynamically -->
        </div>

        <!-- Suggested Questions -->
        <div class="tryonix-suggestions-container">
          <div class="tryonix-suggestions-label">Suggested Questions</div>
          <div class="tryonix-suggestions-scroll" id="tryonix-suggestions-scroll">
            ${SUGGESTIONS.map(q => `<button class="tryonix-chip">${q}</button>`).join('')}
          </div>
        </div>

        <!-- Input Section -->
        <div class="tryonix-chat-input-bar">
          <button class="tryonix-input-btn" id="tryonix-upload-btn" title="Upload Image (Coming Soon)" aria-label="Upload Image">
            📸
          </button>
          <input type="text" class="tryonix-input-field" id="tryonix-input-field" placeholder="Ask about styles, colors, budget..." autocomplete="off">
          <button class="tryonix-send-btn" id="tryonix-send-btn" disabled title="Send" aria-label="Send Message">
            ➔
          </button>
        </div>
      </div>

      <!-- Copy Success Toast -->
      <div class="tryonix-toast" id="tryonix-toast">Copied to clipboard!</div>
    `;

    document.body.appendChild(root);
  }

  // Cache element references
  function cacheElements() {
    chatBadgeContainer = document.getElementById('tryonix-badge-container');
    chatWindow = document.getElementById('tryonix-chat-window');
    messagesContainer = document.getElementById('tryonix-chat-messages');
    textInput = document.getElementById('tryonix-input-field');
    sendButton = document.getElementById('tryonix-send-btn');
    chatBtn = document.getElementById('tryonix-chat-btn');
    toastElement = document.getElementById('tryonix-toast');
  }

  // Bind event listeners
  function bindEvents() {
    // Open/Close
    chatBtn.addEventListener('click', toggleChat);
    document.getElementById('tryonix-close-btn').addEventListener('click', () => setOpen(false));

    // Clear history
    document.getElementById('tryonix-clear-btn').addEventListener('click', clearChat);

    // Image upload (Future ready alert)
    document.getElementById('tryonix-upload-btn').addEventListener('click', () => {
      showToast("📸 Image upload styling is ready! Feature coming in the next release.");
    });

    // Input text changes (enable/disable send button)
    textInput.addEventListener('input', () => {
      sendButton.disabled = textInput.value.trim() === '';
    });

    // Keyboard handlers
    textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !sendButton.disabled && !isTyping) {
        sendMessage();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    });

    // Chips clicks
    const chips = document.querySelectorAll('#tryonix-suggestions-scroll .tryonix-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        textInput.value = chip.textContent;
        sendButton.disabled = false;
        textInput.focus();
        sendMessage();
      });
    });
  }

  // Toggle open/close state
  function toggleChat() {
    setOpen(!isOpen);
  }

  // Set open state and update accessibility/UI
  function setOpen(open) {
    isOpen = open;
    chatWindow.classList.toggle('open', open);
    chatWindow.setAttribute('aria-hidden', !open);

    if (open) {
      // Clear unread indicator
      localStorage.setItem(CONFIG.unreadKey, 'read');
      const unreadBadge = chatBadgeContainer.querySelector('.tryonix-unread-badge');
      if (unreadBadge) unreadBadge.remove();
      chatBtn.classList.remove('pulse');

      // Autofocus
      setTimeout(() => {
        textInput.focus();
        scrollToBottom();
      }, 100);
    }
  }

  // Check unread badge state
  function checkUnreadBadge() {
    const unreadStatus = localStorage.getItem(CONFIG.unreadKey);
    if (!unreadStatus && chatHistory.length <= 1) {
      // Show unread notification badge
      const badge = document.createElement('div');
      badge.className = 'tryonix-unread-badge';
      badge.textContent = '1';
      chatBadgeContainer.appendChild(badge);
      chatBtn.classList.add('pulse');
    }
  }

  // Load chat history from sessionStorage
  function loadSession() {
    try {
      const stored = sessionStorage.getItem(CONFIG.storageKey);
      if (stored) {
        chatHistory = JSON.parse(stored);
      } else {
        // First welcome message
        chatHistory = [{
          id: 'welcome_' + Date.now(),
          sender: 'ai',
          text: WELCOME_MESSAGE,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
        saveSession();
      }
    } catch (e) {
      console.error('Failed to load chat history session:', e);
      chatHistory = [];
    }
  }

  // Save session history
  function saveSession() {
    try {
      sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(chatHistory));
    } catch (e) {
      console.error('Failed to save chat history session:', e);
    }
  }

  // Render history messages into container
  function renderMessages() {
    messagesContainer.innerHTML = '';
    chatHistory.forEach(msg => {
      appendMessageHTML(msg);
    });
    scrollToBottom();
  }

  // Scroll messages wrapper to latest
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Parse custom Markdown helper (bold, lists, links, paragraphs)
  function parseMarkdown(text) {
    if (!text) return '';

    // Escape HTML to prevent XSS
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Links: [Link Text](http...) -> <a>
    escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent,#c9a96e);text-decoration:underline;font-weight:600;">$1</a>');

    // 2. Bold: **text** -> <strong>
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 3. Bullet points: start of line * or -
    const lines = escaped.split('\n');
    let inList = false;
    const parsedLines = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (!inList) {
          parsedLines.push('<ul>');
          inList = true;
        }
        parsedLines.push(`<li>${trimmed.substring(2)}</li>`);
      } else {
        if (inList) {
          parsedLines.push('</ul>');
          inList = false;
        }
        parsedLines.push(`<p>${line}</p>`);
      }
    });

    if (inList) {
      parsedLines.push('</ul>');
    }

    return parsedLines.join('\n');
  }

  // Append a single message HTML structure
  function appendMessageHTML(msg) {
    const isAi = msg.sender === 'ai';
    const wrapper = document.createElement('div');
    wrapper.className = `tryonix-msg-wrapper ${isAi ? 'ai' : 'user'}`;
    wrapper.dataset.id = msg.id;

    const htmlContent = parseMarkdown(msg.text);

    wrapper.innerHTML = `
      <div class="tryonix-msg-avatar">
        ${isAi ? '💁‍♀️' : '👤'}
      </div>
      <div class="tryonix-msg-content-wrapper">
        <div class="tryonix-msg-bubble">
          ${htmlContent}
          ${isAi ? `<button class="tryonix-copy-btn" title="Copy response">📋 Copy</button>` : ''}
        </div>
        <span class="tryonix-msg-timestamp">${msg.timestamp}</span>
      </div>
    `;

    // Copy event listener
    if (isAi) {
      const copyBtn = wrapper.querySelector('.tryonix-copy-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(msg.text).then(() => {
          showToast("Copied to clipboard!");
        }).catch(err => {
          console.error("Copy failed", err);
        });
      });
    }

    messagesContainer.appendChild(wrapper);
  }

  // Clear Chat history and restore welcome message
  function clearChat() {
    if (confirm("Are you sure you want to clear your chat history?")) {
      chatHistory = [{
        id: 'welcome_' + Date.now(),
        sender: 'ai',
        text: WELCOME_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }];
      saveSession();
      renderMessages();
    }
  }

  // Show Toast Popup
  function showToast(text) {
    toastElement.textContent = text;
    toastElement.classList.add('show');
    setTimeout(() => {
      toastElement.classList.remove('show');
    }, 2500);
  }

  // Append Typing animation item
  let typingWrapper = null;
  function showTypingIndicator() {
    if (isTyping) return;
    isTyping = true;

    typingWrapper = document.createElement('div');
    typingWrapper.className = 'tryonix-msg-wrapper ai tryonix-typing-indicator-wrapper';
    typingWrapper.innerHTML = `
      <div class="tryonix-msg-avatar">💁‍♀️</div>
      <div class="tryonix-msg-content-wrapper">
        <div class="tryonix-msg-bubble" style="padding: 10px 16px;">
          <div class="tryonix-typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    `;
    messagesContainer.appendChild(typingWrapper);
    scrollToBottom();
  }

  // Remove typing indicator
  function hideTypingIndicator() {
    if (!isTyping) return;
    isTyping = false;
    if (typingWrapper) {
      typingWrapper.remove();
      typingWrapper = null;
    }
  }

  // Handle Send Message Action
  async function sendMessage() {
    const text = textInput.value.trim();
    if (!text || isTyping) return;

    // Reset input field
    textInput.value = '';
    sendButton.disabled = true;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: text,
      timestamp: timestamp
    };

    // Add to history and update UI
    chatHistory.push(userMsg);
    saveSession();
    appendMessageHTML(userMsg);
    scrollToBottom();

    // Show AI typing and send API query
    showTypingIndicator();

    try {
      const responseText = await queryChatAPI(text);
      
      const aiMsg = {
        id: 'msg_' + Date.now(),
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      hideTypingIndicator();
      chatHistory.push(aiMsg);
      saveSession();
      appendMessageHTML(aiMsg);
      scrollToBottom();
    } catch (error) {
      console.error("AI Chatbot API error:", error);
      hideTypingIndicator();
      
      const errMsg = {
        id: 'err_' + Date.now(),
        sender: 'ai',
        text: "⚠️ I'm sorry, I'm having trouble connecting to my styling engine. Please check your connection or try again later.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      chatHistory.push(errMsg);
      saveSession();
      appendMessageHTML(errMsg);
      scrollToBottom();
    }
  }

  // API Client Call
  async function queryChatAPI(userMessage) {
    const payload = {
      message: userMessage,
      history: chatHistory.slice(0, -1).map(h => ({
        role: h.sender === 'ai' ? 'assistant' : 'user',
        content: h.text
      }))
    };

    // Determine endpoint based on global API_BASE
    let endpoint = '/api/chat';
    if (typeof API_BASE !== 'undefined') {
      endpoint = `${API_BASE}/chat`;
    } else {
      // Check if location contains localhost or custom domain
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      endpoint = isLocal ? 'http://localhost:5000/api/chat' : 'https://tryonix.onrender.com/api/chat';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.reply || data.message || (typeof data === 'string' ? data : "Hello! How can I style you today?");
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
