import React, { useState, useEffect } from 'react';
import axios from '../Utils/axios';
import socket from '../Utils/socket';

export default function StreamChat({ streamId, token }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!streamId || !token) return;
    // Join stream room
    socket.emit('joinStream', { streamId });
    // Initial fetch
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/messages/history?streamId=${streamId}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(res.data.messages || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      }
    };
    fetchMessages();
    // Listen for real-time messages
    socket.on('chatMessage', (data) => {
      setMessages((prev) => [...prev, { content: data.message, from: data.user || {}, status: 'delivered' }]);
    });
    return () => {
      socket.off('chatMessage');
    };
  }, [streamId, token]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setError('');
    try {
      await axios.post('/messages/send', { toStream: streamId, content: input }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Emit to socket for real-time delivery
      socket.emit('chatMessage', { streamId, message: input, user: { displayName: 'Me' } });
      setInput('');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '1rem auto', padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
      <h3>Stream Chat</h3>
      <div style={{ height: 180, overflowY: 'auto', background: '#fafafa', marginBottom: 8, padding: 8 }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ marginBottom: 4 }}>
            <b>{m.from?.displayName || m.from?.email || 'User'}:</b> {m.content}
            {m.status === 'flagged' && <span style={{ color: 'red', marginLeft: 8 }}>(flagged)</span>}
          </div>
        ))}
      </div>
      <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." style={{ width: '80%' }} />
      <button onClick={sendMessage} style={{ width: '18%', marginLeft: '2%' }}>Send</button>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
}
