import React, { useState, useEffect } from 'react';
import axios from '../Utils/axios';
import socket from '../Utils/socket';

export default function TipCreator({ creatorId, token }) {
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [tipEvents, setTipEvents] = useState([]);

  useEffect(() => {
    if (!creatorId) return;
    socket.emit('joinCreator', { creatorId });
    socket.on('tip', (data) => {
      setTipEvents((prev) => [...prev, data]);
    });
    return () => {
      socket.off('tip');
    };
  }, [creatorId]);

  const sendTip = async () => {
    setError('');
    setResult(null);
    try {
      const res = await axios.post('/tips', { creatorId, amount: Number(amount) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(res.data);
      setAmount('');
      // Emit tip event for real-time delivery
      socket.emit('tip', { creatorId, amount: res.data.amount, user: { displayName: 'Me' } });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: '1rem auto', padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
      <h3>Tip Creator</h3>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" style={{ width: '60%' }} />
      <button onClick={sendTip} style={{ width: '35%', marginLeft: '5%' }}>Send Tip</button>
      {result && (
        <div style={{ color: 'green', marginTop: 8 }}>
          Tipped {result.amount} TOK (net {result.net} after fee {result.fee})
        </div>
      )}
      {tipEvents.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <b>Recent Tips:</b>
          {tipEvents.map((t, idx) => (
            <div key={idx} style={{ color: 'blue' }}>
              {t.user?.displayName || 'User'} tipped {t.amount} TOK
            </div>
          ))}
        </div>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
}
