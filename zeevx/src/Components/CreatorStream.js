import React, { useState } from 'react';
import axios from '../Utils/axios';

export default function CreatorStream() {
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState(''); // For demo, paste Firebase ID token

  const createStream = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/streams/create', { title: 'My Live Stream' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStream(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const startStream = async () => {
    if (!stream?.streamId) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`/streams/${stream.streamId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStream({ ...stream, status: 'live' });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const stopStream = async () => {
    if (!stream?.streamId) return;
    setLoading(true);
    setError('');
    try {
      await axios.post(`/streams/${stream.streamId}/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStream({ ...stream, status: 'ended' });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2>Creator Stream Control</h2>
      <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste Firebase ID token here" style={{ width: '100%', marginBottom: 8 }} />
      <button onClick={createStream} disabled={loading || !!stream} style={{ marginBottom: 8 }}>Create Stream</button>
      {stream && (
        <div style={{ marginTop: 16 }}>
          <div><b>Stream Key:</b> <code>{stream.streamKey}</code></div>
          <div><b>Ingest URL:</b> <code>{stream.ingestUrl}</code></div>
          <div><b>Playback URL:</b> <code>{stream.playbackUrl}</code></div>
          <div><b>Status:</b> {stream.status || 'created'}</div>
          <button onClick={startStream} disabled={loading || stream.status === 'live'} style={{ marginRight: 8 }}>Start Stream</button>
          <button onClick={stopStream} disabled={loading || stream.status === 'ended'}>Stop Stream</button>
        </div>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
}
