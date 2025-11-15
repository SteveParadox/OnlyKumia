import express from 'express';
import User from '../DB/User.js';
import Content from '../DB/Content.js';
import authMiddleware from '../Auth/authMiddleware.js';

const router = express.Router();

/**
 * Unified Search Endpoint
 * Searches across creators, content, and messages
 * 
 * Query Parameters:
 * - q: search query (required)
 * - type: filter type ('all', 'creators', 'content') - default: 'all'
 * - sort: sort order ('relevance', 'newest', 'popular') - default: 'relevance'
 * - limit: result limit per category - default: 10
 * - offset: pagination offset - default: 0
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, type = 'all', sort = 'relevance', limit = 10, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const query = q.trim();
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50); // cap at 50
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

    const results = {};

    // SEARCH CREATORS
    if (type === 'all' || type === 'creators') {
      try {
        let creatorQuery = User.find({
          $or: [
            { displayName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { 'metadata.fullName': { $regex: query, $options: 'i' } }
          ],
          role: 'creator',
          isBlacklisted: false
        })
          .select('_id displayName email picture verified_creator metadata')
          .lean();

        // Apply sort
        if (sort === 'newest') {
          creatorQuery = creatorQuery.sort({ createdAt: -1 });
        } else if (sort === 'popular') {
          // TODO: Add followers count to User schema for true popularity sorting
          // For now, verified creators first
          creatorQuery = creatorQuery.sort({ verified_creator: -1 });
        } else {
          // 'relevance' - prioritize verified creators
          creatorQuery = creatorQuery.sort({ verified_creator: -1 });
        }

        const creators = await creatorQuery.skip(offsetNum).limit(limitNum);

        results.creators = creators.map(c => ({
          id: c._id,
          type: 'creator',
          name: c.displayName,
          avatar: c.picture || '/avatars/default.jpg',
          email: c.email,
          verified: c.verified_creator,
          bio: c.metadata?.bio || 'Creator',
          followers: c.metadata?.followers || 0
        }));
        results.creatorCount = await User.countDocuments({
          $or: [
            { displayName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } },
            { 'metadata.fullName': { $regex: query, $options: 'i' } }
          ],
          role: 'creator',
          isBlacklisted: false
        });
      } catch (err) {
        console.error('Creator search error:', err);
        results.creators = [];
        results.creatorCount = 0;
      }
    }

    // SEARCH CONTENT
    if (type === 'all' || type === 'content') {
      try {
        let contentQuery = Content.find({
          $or: [
            { 'metadata.title': { $regex: query, $options: 'i' } },
            { 'metadata.description': { $regex: query, $options: 'i' } }
          ],
          status: 'published'
        })
          .populate('user', 'displayName picture verified_creator')
          .select('_id user metadata status createdAt')
          .lean();

        // Apply sort
        if (sort === 'newest') {
          contentQuery = contentQuery.sort({ createdAt: -1 });
        } else if (sort === 'popular') {
          // TODO: Add view count tracking
          contentQuery = contentQuery.sort({ 'metadata.views': -1 });
        } else {
          // 'relevance' - recent + views
          contentQuery = contentQuery.sort({ createdAt: -1 });
        }

        const content = await contentQuery.skip(offsetNum).limit(limitNum);

        results.content = content.map(c => ({
          id: c._id,
          type: 'content',
          title: c.metadata?.title || 'Untitled',
          description: c.metadata?.description || '',
          thumbnail: c.metadata?.thumbnail || '/placeholders/content.jpg',
          creator: c.user?.displayName || 'Unknown',
          creatorId: c.user?._id,
          creatorVerified: c.user?.verified_creator,
          views: c.metadata?.views || 0,
          duration: c.metadata?.duration || '0:00',
          uploadedAt: c.createdAt
        }));
        results.contentCount = await Content.countDocuments({
          $or: [
            { 'metadata.title': { $regex: query, $options: 'i' } },
            { 'metadata.description': { $regex: query, $options: 'i' } }
          ],
          status: 'published'
        });
      } catch (err) {
        console.error('Content search error:', err);
        results.content = [];
        results.contentCount = 0;
      }
    }

    res.json({
      query,
      results,
      total: (results.creatorCount || 0) + (results.contentCount || 0),
      pagination: { limit: limitNum, offset: offsetNum }
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Trending Creators Endpoint
 * Returns verified/popular creators
 */
router.get('/trending/creators', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);

    const creators = await User.find({
      role: 'creator',
      verified_creator: true,
      isBlacklisted: false
    })
      .select('_id displayName picture verified_creator metadata')
      .sort({ verified_creator: -1 })
      .limit(limitNum)
      .lean();

    res.json({
      creators: creators.map(c => ({
        id: c._id,
        type: 'creator',
        name: c.displayName,
        avatar: c.picture || '/avatars/default.jpg',
        verified: c.verified_creator,
        bio: c.metadata?.bio || 'Creator',
        followers: c.metadata?.followers || 0
      }))
    });
  } catch (err) {
    console.error('Trending creators error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Trending Content Endpoint
 * Returns popular/recent content
 */
router.get('/trending/content', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 10, 50);

    const content = await Content.find({ status: 'published' })
      .populate('user', 'displayName picture verified_creator')
      .select('_id user metadata status createdAt')
      .sort({ 'metadata.views': -1, createdAt: -1 })
      .limit(limitNum)
      .lean();

    res.json({
      content: content.map(c => ({
        id: c._id,
        type: 'content',
        title: c.metadata?.title || 'Untitled',
        description: c.metadata?.description || '',
        thumbnail: c.metadata?.thumbnail || '/placeholders/content.jpg',
        creator: c.user?.displayName || 'Unknown',
        creatorId: c.user?._id,
        creatorVerified: c.user?.verified_creator,
        views: c.metadata?.views || 0,
        duration: c.metadata?.duration || '0:00',
        uploadedAt: c.createdAt
      }))
    });
  } catch (err) {
    console.error('Trending content error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
