import React, { useState, useRef, useEffect } from 'react';
import './Planner.css'; // Reusing Planner CSS for consistency
import { Send, Bot, User as UserIcon } from 'lucide-react';

const Chat = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', content: "Hello! I'm your Crumbs AI assistant. Ask me anything about your studies or general knowledge!" }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            // Using Puter AI Chat
            // Note: History is not automatically maintained by simple chat() call usually, 
            // but we can try to pass context or just treat as single turn for MVP if SDK is simple.
            // Or construct a prompt with history.

            // Construct history prompt
            const history = messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
            const prompt = `You are a helpful study assistant named Crumbs AI.
            
History:
${history}

User: ${userMsg}
AI:`;

            const response = await window.puter.ai.chat(prompt);

            setMessages(prev => [...prev, { role: 'ai', content: response.message || response.toString() }]); // Adjust based on actual return type
        } catch (err) {
            console.error("Chat Error", err);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting to the brain rights now." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="planner-page" style={{ height: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: '0' }}>
            <div className="planner-header" style={{ marginBottom: '20px', flexShrink: 0 }}>
                <h1>AI Chat 💬</h1>
            </div>

            <div className="planner-content" style={{ flex: 1, overflow: 'hidden', flexDirection: 'column', gap: '0', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Messages Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {messages.map((msg, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            gap: '15px',
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '80%'
                        }}>
                            {msg.role === 'ai' && (
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Bot size={20} color="white" />
                                </div>
                            )}

                            <div style={{
                                padding: '15px',
                                borderRadius: '16px',
                                background: msg.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                                borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '16px',
                                lineHeight: '1.5'
                            }}>
                                {msg.content}
                            </div>

                            {msg.role === 'user' && (
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <UserIcon size={20} color="white" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isTyping && (
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Bot size={20} color="white" />
                            </div>
                            <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Thinking...</div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.8)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '15px' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your question..."
                        style={{
                            flex: 1,
                            padding: '15px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.2)',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                    <button type="submit" disabled={!input.trim() || isTyping} style={{
                        background: input.trim() ? '#6366f1' : 'gray',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        width: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: input.trim() ? 'pointer' : 'default',
                        transition: 'background 0.2s'
                    }}>
                        <Send size={24} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
