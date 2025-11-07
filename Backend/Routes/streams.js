import express from 'express';
import crypto from 'crypto';
import Stream from '../DB/Stream.js';
import authMiddleware from '../Auth/authMiddleware.js';

const router = express.Router();

function genKey() {
  return crypto.randomBytes(12).toString('hex');
}

// Create a stream session — returns ingest info and playback placeholder
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    const creator = req.user && req.user._id ? req.user._id : null;
    if (!creator) return res.status(401).json({ error: 'Unauthorized' });

    const streamKey = genKey();
    const ingestHost = process.env.RTMP_INGEST_HOST || 'rtmp://ingest.example.com/live';
    const ingestUrl = `${ingestHost}/${streamKey}`;
    const playbackUrl = (process.env.CDN_BASE || 'https://cdn.example.com') + `/hls/${streamKey}/index.m3u8`;

    const s = await Stream.create({ title, creator, streamKey, ingestUrl, playbackUrl, status: 'created' });
    res.json({ streamId: s._id, streamKey, ingestUrl, playbackUrl });
  } catch (err) {
    console.error('create stream error', err);
    res.status(500).json({ error: err.message });
  }
});

// Mark stream started
router.post('/:id/start', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const s = await Stream.findById(id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    if (String(s.creator) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    s.status = 'live';
    s.startedAt = new Date();
    await s.save();
    res.json({ message: 'started', streamId: s._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark stream stopped
router.post('/:id/stop', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const s = await Stream.findById(id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    if (String(s.creator) !== String(req.user._id)) return res.status(403).json({ error: 'Forbidden' });
    s.status = 'ended';
    s.endedAt = new Date();
    await s.save();
    res.json({ message: 'stopped', streamId: s._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ingest webhook — e.g., moderation worker or transcoder posts events here
// body: { streamKey, event: 'flag'|'critical'|'start'|'stop', reason }
router.post('/ingest-webhook', async (req, res) => {
  try {
    const { streamKey, event, reason, meta } = req.body;
    const s = await Stream.findOne({ streamKey });
    if (!s) return res.status(404).json({ error: 'Stream not found' });

    s.moderation.push({ reason: reason || (event || 'event'), level: event === 'critical' ? 'critical' : (event === 'flag' ? 'flag' : 'info'), meta });
    if (event === 'critical') {
      s.status = 'killed';
      s.endedAt = new Date();
      s.isFlagged = true;
      await s.save();
      // TODO: notify via websocket / push to creator and moderators
      return res.json({ message: 'stream killed', streamId: s._id });
    }

    if (event === 'flag') {
      s.isFlagged = true;
      await s.save();
      return res.json({ message: 'stream flagged for review', streamId: s._id });
    }

    if (event === 'start') {
      s.status = 'live';
      s.startedAt = s.startedAt || new Date();
      await s.save();
      return res.json({ message: 'stream started', streamId: s._id });
    }

    if (event === 'stop') {
      s.status = 'ended';
      s.endedAt = new Date();
      await s.save();
      return res.json({ message: 'stream stopped', streamId: s._id });
    }

    await s.save();
    res.json({ message: 'ok', streamId: s._1d });
  } catch (err) {
    console.error('ingest webhook error', err);
    res.status(500).json({ error: err.message });
  }
});

// Stream details/status
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const s = await Stream.findById(id).populate('creator', 'displayName email');
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json({ stream: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
