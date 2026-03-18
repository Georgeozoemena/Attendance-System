import React, { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../services/api';

const AdminAssistant = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm your Attendance Data Specialist. How can I help you today? You can ask about attendance trends, new members, or event suggestions." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const adminKey = localStorage.getItem('adminKey');
            const response = await fetch(`${API_BASE}/api/admin/assistant/query`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ query: userMessage })
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, { role: 'assistant', content: data.answer, isMock: data.isMock }]);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setMessages(prev => [...prev, { role: 'assistant', content: errorData.answer || errorData.details || "Sorry, I encountered an error processing your request." }]);
            }
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to the assistant." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const suggestedQueries = [
        "How many new attendees last month?",
        "Highest attendance this year?",
        "Suggest best time for next event",
        "At-risk members summary"
    ];

    return (
        <div className="admin-assistant-page animate-fade-in" style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-1)', margin: 0 }}>AI Admin Assistant</h2>
                <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>Query your attendance data using natural language</p>
            </div>

            <div className="admin-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', backgroundColor: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border)' }}>
                {/* Chat History */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {messages.map((msg, i) => (
                        <div key={i} style={{ 
                            display: 'flex', 
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            {msg.role === 'assistant' && (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l4-4-4-4h12a2 2 0 0 1 2 2z"/></svg>
                                </div>
                            )}
                            <div style={{ 
                                maxWidth: '80%', 
                                padding: '12px 16px', 
                                borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-2)',
                                color: msg.role === 'user' ? 'white' : 'var(--text-1)',
                                fontSize: '0.95rem',
                                lineHeight: '1.5',
                                boxShadow: 'var(--shadow-sm)',
                                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                                position: 'relative',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {msg.content.split('\n').map((line, i) => {
                                    const isHeading = line.startsWith('###');
                                    const processedLine = line.replace(/^### /, '');
                                    
                                    // Split by ** to find parts that should be bold
                                    const parts = processedLine.split(/(\*\*.*?\*\*)/g);

                                    return (
                                        <div key={i} style={{ 
                                            marginBottom: isHeading ? '12px' : '6px', 
                                            fontWeight: isHeading ? '700' : '400',
                                            fontSize: isHeading ? '1.05rem' : '0.95rem',
                                            paddingLeft: line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line) ? '12px' : '0'
                                        }}>
                                            {parts.map((part, pi) => {
                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                    return <strong key={pi}>{part.slice(2, -2)}</strong>;
                                                }
                                                return part;
                                            })}
                                        </div>
                                    );
                                })}
                                {msg.isMock && (
                                    <div style={{ fontSize: '10px', marginTop: '8px', opacity: 0.7, fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '4px' }}>
                                        Localized Insight (No API Key)
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l4-4-4-4h12a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 2px', backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', gap: '4px' }}>
                                <span className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-3)', animation: 'pulse 1s infinite' }} />
                                <span className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-3)', animation: 'pulse 1s infinite 0.2s' }} />
                                <span className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-3)', animation: 'pulse 1s infinite 0.4s' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested Queries */}
                {messages.length === 1 && (
                    <div style={{ padding: '0 24px 16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {suggestedQueries.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => { setInput(q); }}
                                style={{ 
                                    padding: '8px 16px', 
                                    borderRadius: '20px', 
                                    border: '1px solid var(--border)', 
                                    backgroundColor: 'var(--surface-2)', 
                                    fontSize: '0.85rem', 
                                    color: 'var(--text-3)', 
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleSend} style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question here..."
                        style={{ 
                            flex: 1, 
                            padding: '12px 16px', 
                            borderRadius: '12px', 
                            border: '1px solid var(--border)', 
                            backgroundColor: 'var(--surface-2)',
                            color: 'var(--text-1)',
                            outline: 'none', 
                            fontSize: '0.95rem',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '12px', 
                            backgroundColor: input.trim() && !isLoading ? 'var(--primary)' : 'var(--surface-3)', 
                            border: 'none', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            boxShadow: input.trim() && !isLoading ? '0 4px 12px var(--primary-lt)' : 'none'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !isLoading ? 'white' : 'var(--text-4)'} strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                </form>
            </div>
            
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1); }
                }
                .dot-pulse {
                    display: inline-block;
                }
            `}</style>
        </div>
    );
};

export default AdminAssistant;
