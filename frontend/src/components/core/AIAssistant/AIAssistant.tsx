'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth, useCustomer } from '@/providers/AuthProvider';
import { useStore } from '@/providers/StoreProvider';
import api from '@/lib/api';
import styles from './AIAssistant.module.scss';
import { IoCloseOutline, IoSendOutline, IoSparklesOutline } from 'react-icons/io5';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const MarkdownContent = ({ content }: { content: string }) => {
    // Enhanced markdown parser for bold, markdown links, and plain URLs
    // 1. Replace **bold** with <strong>bold</strong>
    // 2. Replace [text](url) with <a href="url">text</a>
    // 3. Replace plain URLs with <a href="url">url</a>

    // Process in stages to support nesting (e.g., links inside bold)
    const processContent = (text: string, disableLinks = false): React.ReactNode[] => {
        const elements: React.ReactNode[] = [];
        let currentIndex = 0;
        let key = 0;

        // Combined regex to match markdown links, bold text, and plain URLs
        const combinedRegex = /(\*\*.*?\*\*|\[(?:[^\]]|\\\])*\]\((?:[^)]|\\\))*\)|(https?:\/\/[^\s<>]+))/g;
        let match;

        while ((match = combinedRegex.exec(text)) !== null) {
            // Add text before match
            if (match.index > currentIndex) {
                elements.push(text.slice(currentIndex, match.index));
            }

            const matchedText = match[0];

            // Handle bold
            if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
                const innerText = matchedText.slice(2, -2);
                elements.push(
                    <strong key={`bold-${key++}`}>
                        {processContent(innerText, disableLinks)}
                    </strong>
                );
            }
            // Handle markdown links
            else if (matchedText.startsWith('[')) {
                if (disableLinks) {
                    elements.push(matchedText);
                } else {
                    const linkMatch = matchedText.match(/\[((?:[^\]]|\\\])*)\]\(((?:[^)]|\\\))*)\)/);
                    if (linkMatch) {
                        const linkText = linkMatch[1];
                        const linkUrl = linkMatch[2];
                        elements.push(
                            <a
                                key={`md-link-${key++}`}
                                href={linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#4A9EFF',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    display: 'inline',
                                    wordBreak: 'break-word',
                                    position: 'relative',
                                    zIndex: 1
                                }}
                            >
                                {processContent(linkText, true)}
                            </a>
                        );
                    } else {
                        elements.push(matchedText);
                    }
                }
            }
            // Handle plain URLs
            else if (matchedText.startsWith('http')) {
                if (disableLinks) {
                    elements.push(matchedText);
                } else {
                    elements.push(
                        <a
                            key={`url-${key++}`}
                            href={matchedText}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: '#4A9EFF',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                display: 'inline',
                                wordBreak: 'break-word',
                                position: 'relative',
                                zIndex: 1
                            }}
                        >
                            {matchedText}
                        </a>
                    );
                }
            }

            currentIndex = match.index + matchedText.length;
        }

        // Add remaining text
        if (currentIndex < text.length) {
            elements.push(text.slice(currentIndex));
        }

        return elements;
    };

    return <>{processContent(content)}</>;
};

// Generate or retrieve session ID for guests
const getSessionId = () => {
    if (typeof window === 'undefined') return null;

    let sessionId = localStorage.getItem('ai-session-id');
    if (!sessionId) {
        sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('ai-session-id', sessionId);
    }
    return sessionId;
};

export default function AIAssistant() {
    const { store, currentCurrency } = useStore();
    const { customer, isAuthenticated } = useCustomer();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const sessionIdRef = useRef<string | null>(null);

    // Initialize session ID
    useEffect(() => {
        sessionIdRef.current = getSessionId();
    }, []);

    // Load chat history on mount
    useEffect(() => {
        const loadHistory = async () => {
            if (!store?._id || !sessionIdRef.current) return;

            try {
                setIsLoadingHistory(true);
                const response = await api.get(`ai/history?storeId=${store._id}&sessionId=${sessionIdRef.current}`);

                if (response.success && response.messages && response.messages.length > 0) {
                    setHistory(response.messages);
                    setIsLoadingHistory(false);
                } else {
                    // No history, construct personalized greeting
                    const greeting = constructGreeting();
                    setHistory([{ role: 'assistant', content: greeting }]);
                    setIsLoadingHistory(false);
                }
            } catch (error) {
                console.error('Failed to load chat history:', error);
                const greeting = constructGreeting();
                setHistory([{ role: 'assistant', content: greeting }]);
                setIsLoadingHistory(false);
            }
        };

        const constructGreeting = () => {
            if (isAuthenticated && customer) {
                return `Hey, ${customer.firstName}, How are you today? I am AI Chat assistant at ${store?.name || 'our store'}. How can I help you today?`;
            }
            return `Hey there, How are you today? I am AI Chat assistant at ${store?.name || 'our store'}. How can I help you today? Please logged in so I can give you more personalized suggestion.`;
        };

        loadHistory();
    }, [store?._id, store?.name, isAuthenticated, customer]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    const handleSend = async () => {
        if (!message.trim() || isLoading || !store?._id || !sessionIdRef.current) return;

        const userMessage = message.trim();
        setMessage('');
        setHistory(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        // Create placeholder for assistant's streaming message
        const assistantMessageIndex = history.length + 1;
        setHistory(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${apiBaseUrl}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-currency': currentCurrency?.code || 'USD',
                    'x-store-id': store._id,
                    ...(api.getToken() ? { 'Authorization': `Bearer ${api.getToken()}` } : {})
                },
                body: JSON.stringify({
                    message: userMessage,
                    storeId: store._id,
                    sessionId: sessionIdRef.current
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response stream');
            }

            let streamedContent = '';
            let lineBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                lineBuffer += chunk;

                const lines = lineBuffer.split('\n');
                // Keep the last incomplete line in the buffer
                lineBuffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.trim().slice(6));

                            if (data.type === 'content') {
                                streamedContent += data.content;
                                // Update the assistant message in real-time
                                setHistory(prev => {
                                    const newHistory = [...prev];
                                    const lastMsg = newHistory[newHistory.length - 1];
                                    if (lastMsg && lastMsg.role === 'assistant') {
                                        lastMsg.content = streamedContent;
                                    }
                                    return newHistory;
                                });
                            } else if (data.type === 'done') {
                                // Stream complete
                                break;
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (parseError) {
                            console.error('Failed to parse SSE data:', parseError, 'Line:', line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            setHistory(prev => {
                const newHistory = [...prev];
                const lastMsg = newHistory[newHistory.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content = "Sorry, I'm having trouble connecting right now. Please try again later.";
                }
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!store) return null;

    // Only show if enabled and API key is configured
    const aiEnabled = store.settings?.aiSettings?.enabled || false;

    if (!aiEnabled) {
        return null;
    }

    return (
        <div className={styles.wrapper}>
            {/* Toggle Button */}
            <button
                className={`${styles.toggleBtn} ${isOpen ? styles.hidden : ''}`}
                onClick={() => setIsOpen(true)}
                aria-label="Ask AI Assistant"
            >
                <IoSparklesOutline size={24} />
            </button>

            {/* Chat Window */}
            <div className={`${styles.chatWindow} ${isOpen ? styles.open : ''}`}>
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <IoSparklesOutline className={styles.icon} />
                        <span>AI Shopping Assistant</span>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                        <IoCloseOutline size={24} />
                    </button>
                </div>

                <div className={styles.messages} ref={scrollRef}>
                    {history.map((msg, i) => (
                        <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                            {msg.content && (
                                <div className={styles.bubble}>
                                    <MarkdownContent content={msg.content} />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className={`${styles.message} ${styles.assistant}`}>
                            <div className={`${styles.bubble} ${styles.typing}`}>
                                <span />
                                <span />
                                <span />
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.inputArea}>
                    <input
                        type="text"
                        placeholder="Ask me anything..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={!message.trim() || isLoading}
                    >
                        <IoSendOutline size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
