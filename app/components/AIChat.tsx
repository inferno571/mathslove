'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { TestResult } from '../lib/types';
import { LogoIcon } from './Logo';

export default function AIChat({ testResult }: { testResult: TestResult }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    {
      role: 'ai',
      text: `Hello! I have analyzed the Math IQ assessment results. 
Would you like to discuss the specific areas where your child showed strong potential, or should we look at the topics where they might need some support (like ${
        testResult.cognitiveBreakdown && testResult.cognitiveBreakdown.length > 0
          ? testResult.cognitiveBreakdown.sort((a, b) => a.percentage - b.percentage)[0]?.domain || 'problem solving'
          : 'math concepts'
      })?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat without scrolling the entire page
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput('');
    
    const newMsg = { role: 'user' as const, text: userText };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      // Build history for API (mapping 'ai' to 'model')
      const chatHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText, 
          testResult, 
          history: chatHistory 
        })
      });
      
      if (!res.ok) throw new Error('API Error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiText = '';

      // Add empty AI message to be filled
      setMessages(prev => [...prev, { role: 'ai', text: '' }]);

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim().startsWith('data: ')) continue;
            const dataStr = line.replace(/^data:\s*/, '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const data = JSON.parse(dataStr);
              const textChunk = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
              aiText += textChunk;
              
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1].text = aiText;
                return updated;
              });
            } catch (e) {
              console.error('SSE JSON Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting right now. Please check your connection and try again." }]);
    }
    setLoading(false);
  };

  // Removed custom formatter, using ReactMarkdown instead

  return (
    <div 
      className="ai-chat-widget" 
      style={{ 
        marginTop: 48, 
        background: 'white', 
        borderRadius: '16px', 
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden'
      }}
    >
      {/* Header bar */}
      <div 
        style={{ 
          background: 'var(--navy)', 
          padding: '18px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LogoIcon size={44} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.2 }}>MathsLove AI Expert</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', opacity: 0.9, marginTop: 2 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
              Online Results Advisor
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '12px' }}>
          Standard Support
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        style={{ 
          height: 380, 
          overflowY: 'auto', 
          background: '#f8fafc', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 16
        }}
      >
        {messages.map((m, i) => {
          const isUser = m.role === 'user';
          return (
            <div 
              key={i} 
              style={{ 
                display: 'flex', 
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: 8
              }}
            >
              {!isUser && (
                <LogoIcon size={34} />
              )}
              <div 
                style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  maxWidth: '75%'
                }}
              >
                <div 
                  className={isUser ? '' : 'markdown-wrapper'}
                  style={{ 
                    padding: '12px 18px', 
                    borderRadius: '14px', 
                    borderTopRightRadius: isUser ? '2px' : '14px',
                    borderTopLeftRadius: isUser ? '14px' : '2px',
                    background: isUser ? '#1B2B5E' : 'white', 
                    color: isUser ? 'white' : 'var(--dark)',
                    boxShadow: isUser ? 'none' : '0 2px 5px rgba(0,0,0,0.03)',
                    border: isUser ? 'none' : '1px solid #e2e8f0',
                    lineHeight: 1.55,
                    fontSize: '0.95rem'
                  }}
                >
                  {isUser ? m.text : <ReactMarkdown>{m.text}</ReactMarkdown>}
                </div>
                <div 
                  style={{ 
                    fontSize: '0.75rem', 
                    color: '#94a3b8', 
                    marginTop: 4, 
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    padding: '0 4px'
                  }}
                >
                  {isUser ? 'You' : 'MathsLove Expert'}
                </div>
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoIcon size={34} />
            <div 
              style={{ 
                padding: '12px 18px', 
                borderRadius: '14px', 
                borderTopLeftRadius: '2px',
                background: 'white', 
                color: '#64748b',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                border: '1px solid #e2e8f0',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <span className="dot" style={{ animation: 'bounce 1.4s infinite both', animationDelay: '0s', width: 6, height: 6, background: '#94a3b8', borderRadius: '50%' }}></span>
              <span className="dot" style={{ animation: 'bounce 1.4s infinite both', animationDelay: '0.2s', width: 6, height: 6, background: '#94a3b8', borderRadius: '50%' }}></span>
              <span className="dot" style={{ animation: 'bounce 1.4s infinite both', animationDelay: '0.4s', width: 6, height: 6, background: '#94a3b8', borderRadius: '50%' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Footer */}
      <div 
        style={{ 
          padding: '18px 24px', 
          background: 'white', 
          borderTop: '1px solid #e2e8f0',
          display: 'flex', 
          gap: 12,
          alignItems: 'center'
        }}
      >
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message here..."
          disabled={loading}
          style={{ 
            flex: 1, 
            padding: '14px 20px', 
            border: '1px solid #cbd5e1', 
            borderRadius: '12px', 
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            background: loading ? '#f8fafc' : 'white'
          }}
        />
        <button 
          onClick={sendMessage} 
          disabled={loading || !input.trim()} 
          className="btn-primary"
          style={{
            padding: '14px 24px',
            borderRadius: '12px',
            fontWeight: 600,
            transition: 'all 0.2s',
            opacity: (!input.trim() || loading) ? 0.6 : 1,
            cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer'
          }}
        >
          Send
        </button>
      </div>

      {/* Local styles for typing bounce animation and markdown */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
        .markdown-wrapper > :first-child { margin-top: 0; }
        .markdown-wrapper > :last-child { margin-bottom: 0; }
        .markdown-wrapper p { margin-bottom: 8px; line-height: 1.5; }
        .markdown-wrapper ul, .markdown-wrapper ol { margin: 8px 0; padding-left: 20px; }
        .markdown-wrapper li { margin-bottom: 4px; }
        .markdown-wrapper h1, .markdown-wrapper h2, .markdown-wrapper h3, .markdown-wrapper h4 { margin: 12px 0 8px 0; font-weight: 600; line-height: 1.3; }
        .markdown-wrapper strong { font-weight: 700; color: var(--teal); }
      `}</style>
    </div>
  );
}
