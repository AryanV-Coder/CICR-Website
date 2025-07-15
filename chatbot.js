class Chatbot {
    constructor() {
        this.isOpen = false;
        this.isTyping = false;
        this.apiUrl = 'http://127.0.0.1:8000/chat'; // Replace with your FastAPI backend URL
        
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        this.toggleButton = document.getElementById('chatbot-toggle');
        this.chatWindow = document.getElementById('chatbot-window');
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.typingIndicator = null; // Will be created dynamically
    }

    bindEvents() {
        this.toggleButton.addEventListener('click', () => this.toggleChat());
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        this.messageInput.addEventListener('input', () => this.handleInputChange());
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        this.toggleButton.classList.toggle('active', this.isOpen);
        this.chatWindow.classList.toggle('active', this.isOpen);
        
        if (this.isOpen) {
            this.messageInput.focus();
        }
    }

    handleInputChange() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendButton.disabled = !hasText || this.isTyping;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isTyping) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.handleInputChange();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Make API call to FastAPI backend
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Ensure typing indicator shows for at least 2 seconds
            const typingStartTime = Date.now();
            const minTypingDuration = 2000; // 2 seconds
            
            const elapsedTime = Date.now() - typingStartTime;
            const remainingTime = Math.max(0, minTypingDuration - elapsedTime);
            
            setTimeout(() => {
                // Hide typing indicator
                this.hideTypingIndicator();
                
                // Add bot response with typewriter effect
                const botMessage = data.response || data.message || 'Sorry, I didn\'t understand that.';
                this.addMessageWithTypewriter(botMessage, 'bot');
            }, remainingTime);
            
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Ensure typing indicator shows for at least 2 seconds even on error
            setTimeout(() => {
                this.hideTypingIndicator();
                this.addMessageWithTypewriter('Sorry, I\'m having trouble connecting right now. Please try again later.', 'bot');
            }, 2000);
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date());
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    addMessageWithTypewriter(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('p');
        messageContent.appendChild(messageText);
        
        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.formatTime(new Date());
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(messageTime);
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Typewriter effect
        this.typewriterEffect(messageText, text);
    }

    typewriterEffect(element, text, speed = 50) {
        let index = 0;
        element.textContent = '';
        
        const typeInterval = setInterval(() => {
            if (index < text.length) {
                element.textContent += text.charAt(index);
                index++;
                this.scrollToBottom(); // Keep scrolling as text appears
            } else {
                clearInterval(typeInterval);
                // Allow user to send new messages after typewriter finishes
                this.isTyping = false;
                this.handleInputChange();
            }
        }, speed);
    }

    showTypingIndicator() {
        this.isTyping = true;
        
        // Create typing indicator if it doesn't exist
        if (!this.typingIndicator) {
            this.typingIndicator = document.createElement('div');
            this.typingIndicator.className = 'typing-indicator';
            this.typingIndicator.innerHTML = `
                <span></span>
                <span></span>
                <span></span>
            `;
        }
        
        // Add to the end of messages container
        this.messagesContainer.appendChild(this.typingIndicator);
        this.typingIndicator.style.display = 'flex';
        this.sendButton.disabled = true;
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        if (this.typingIndicator && this.typingIndicator.parentNode) {
            this.typingIndicator.parentNode.removeChild(this.typingIndicator);
        }
        // Don't set isTyping to false here as typewriter effect will handle it
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Method to programmatically add messages (useful for system messages)
    addSystemMessage(text) {
        this.addMessage(text, 'bot');
    }

    // Method to clear chat history
    clearChat() {
        this.messagesContainer.innerHTML = '';
        this.addMessageWithTypewriter('Hello! I\'m CICR Assistant. How can I help you today?', 'bot');
    }

    // Method to set API URL (useful for different environments)
    setApiUrl(url) {
        this.apiUrl = url;
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const chatbot = new Chatbot();
    
    // Optional: Expose chatbot instance globally for debugging
    window.chatbot = chatbot;
});

// Optional: Configuration for different environments
const ChatbotConfig = {
    development: {
        apiUrl: 'http://localhost:8000/api/chat'
    },
    production: {
        apiUrl: 'https://your-production-api.com/api/chat'
    }
};

// Auto-detect environment and set API URL
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const config = isDevelopment ? ChatbotConfig.development : ChatbotConfig.production;