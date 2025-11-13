import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Button, TextField, MenuItem, Select, CircularProgress, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import axios from '../Utils/axios';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import '../Css/Explore.css';
import LoginPrompt from '../Components/LoginPrompt';
import PurchaseModal from '../Components/PurchaseModal';
import { useAuth } from '../Auth/Auth';
import { useLocation } from 'react-router-dom';

const DEFAULT_CATEGORIES = ['For You', 'Trending', 'Fitness', 'Art & Photography', 'Gaming', 'Fashion', 'Music'];

const SkeletonCard = () => (
  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1A1A1D] to-[#0E0E10] border border-gray-800 shadow-lg p-0">
    <div className="w-full h-48 bg-gray-800 animate-pulse" />
    <div className="p-4">
      <div className="h-4 bg-gray-800 rounded w-3/5 mb-3 animate-pulse" />
      <div className="h-3 bg-gray-800 rounded w-4/5 mb-4 animate-pulse" />
      <div className="flex justify-between items-center">
        <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-16 bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

const CreatorCard = ({ c, onFollow, onSubscribe }) => (
  <motion.div
    whileHover={{ scale: 1.03, y: -4 }}
    transition={{ duration: 0.2 }}
    className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1A1A1D] to-[#0E0E10] border border-gray-800 shadow-lg"
  >
    <div className="relative">
      <img src={c.avatar || `/creators/creator-${(c.id % 8) + 1}.jpg`} alt={c.name} className="w-full h-48 object-cover" />
      {c.verified && (
        <div className="absolute top-3 left-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-[11px] px-3 py-1 rounded-full font-semibold tracking-wide shadow-md">
          VERIFIED
        </div>
      )}
    </div>

    <div className="p-4">
      <h3 className="text-lg font-semibold mb-1 tracking-wide">{c.name}</h3>
      <p className="text-gray-400 text-sm mb-3">{c.tags?.slice(0,3).join(' • ') || c.category}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="contained"
            size="small"
            onClick={() => onSubscribe(c.id)}
            sx={{
              background: 'linear-gradient(45deg, #06B6D4, #3f51b5)',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.85rem',
            }}
          >
            {c.subscribed ? 'Subscribed' : 'Subscribe'}
          </Button>
          <span className="text-gray-400 text-sm">{c.price ? `$${c.price}/mo` : ''}</span>
        </div>

        <div className="flex items-center gap-2">
          <IconButton size="small" onClick={() => onFollow(c.id)} title={c.following ? 'Unfollow' : 'Follow'}>
            <PersonAddAltIcon sx={{ color: c.following ? '#06B6D4' : 'inherit' }} />
          </IconButton>
          <IconButton size="small" title="Like">
            <FavoriteBorderIcon />
          </IconButton>
          <IconButton size="small" title="Bookmark">
            <BookmarkBorderIcon />
          </IconButton>
        </div>
      </div>
    </div>
  </motion.div>
);

const Explore = () => {
  const { user, auth } = useAuth() || {};
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('For You');
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const sentinelRef = useRef(null);
  const [purchase, setPurchase] = useState({ open: false, mode: 'subscription', creatorId: null, contentId: null });

  const toggleLocal = useCallback((id, key) => {
    setCreators((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: !p[key] } : p)));
  }, []);

  const fetchCreators = useCallback(async ({ reset = false } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = { q: query || undefined, category: category !== 'For You' ? category : undefined, page: reset ? 1 : page };
      const res = await axios.get('/creators', { params });
      const data = res.data?.data || res.data || [];

      if (reset) {
        setCreators(data);
        setPage(2);
        setHasMore(Array.isArray(data) && data.length > 0);
      } else {
        setCreators((prev) => [...prev, ...(Array.isArray(data) ? data : [])]);
        setPage((p) => p + 1);
        setHasMore(Array.isArray(data) && data.length > 0);
      }
    } catch (err) {
      console.warn('Fetch creators failed, falling back to mock data:', err.message || err);
      if (reset) setCreators(mockData.slice(0, 8));
      else setCreators((prev) => [...prev, ...mockData.slice(prev.length, prev.length + 8)]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [query, category, page]);

  useEffect(() => {
    const t = setTimeout(() => fetchCreators({ reset: true }), 350);
    return () => clearTimeout(t);
  }, [query, category]);

  useEffect(() => {
    fetchCreators({ reset: true });
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) fetchCreators({ reset: false });
      },
      { root: null, rootMargin: '300px' }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [sentinelRef.current, hasMore, loading, fetchCreators]);

  const onFollow = async (id) => {
    if (!user && !auth) return setShowLoginPrompt(true);
    toggleLocal(id, 'following');
    try {
      await axios.post(`/creators/${id}/follow`);
    } catch (err) {
      console.warn('Follow failed, reverting', err);
      toggleLocal(id, 'following');
    }
  };

  const onSubscribe = async (id) => {
    if (!user && !auth) return setShowLoginPrompt(true);
    setPurchase({ open: true, mode: 'subscription', creatorId: id, contentId: null });
  };

  const results = creators;

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#101013] to-[#1C1C1F] text-white px-6 py-12">
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6"
        >
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Discover Creators
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Browse, filter and subscribe to verified creators.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <TextField
                size="small"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search creators, tags, or topics..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'gray' }} />,
                  sx: { background: '#0F0F11', borderRadius: '12px', input: { color: '#fff' } },
                }}
                fullWidth
              />
            </div>

            <Select
              value={category}
              size="small"
              onChange={(e) => setCategory(e.target.value)}
              sx={{ minWidth: 160, background: '#0F0F11', borderRadius: '12px' }}
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </div>
        </motion.div>

        {/* Centered category pills */}
        <div className="flex justify-center mb-10">
          <div className="flex flex-wrap justify-center gap-4">
            {DEFAULT_CATEGORIES.map((c) => (
              <div
                key={c}
                onClick={() => setCategory(c)}
                className={`px-5 py-2 rounded-full cursor-pointer text-sm font-medium transition-all duration-300 ${
                  category === c
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'bg-[#1f1f1f] text-gray-300 hover:text-white hover:bg-[#2a2a2a]'
                }`}
              >
                {c}
              </div>
            ))}
          </div>
        </div>

        {loading && creators.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <motion.div layout className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {results.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-12">
                No creators found. Try another search or category.
              </div>
            ) : (
              results.map((c) => (
                <CreatorCard key={c.id} c={c} onFollow={onFollow} onSubscribe={onSubscribe} />
              ))
            )}
          </motion.div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />

        <PurchaseModal
          open={purchase.open}
          onClose={() => setPurchase((p) => ({ ...p, open: false }))}
          userId={user?.uid}
          creatorId={purchase.creatorId}
          contentId={purchase.contentId}
          onSuccess={() => {
            setPurchase((p) => ({ ...p, open: false }));
            fetchCreators({ reset: true });
          }}
        />

        <LoginPrompt open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} redirectTo={location.pathname} />

        <div className="flex justify-center mt-8">
          {loading && creators.length > 0 ? (
            <CircularProgress color="inherit" size={24} />
          ) : (
            !hasMore && <div className="text-gray-500">No more results</div>
          )}
        </div>
      </div>
    </section>
  );
};

const mockData = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  name: `Creator ${i + 1}`,
  category: DEFAULT_CATEGORIES[(i % (DEFAULT_CATEGORIES.length - 1)) + 1],
  verified: i % 3 === 0,
  price: i % 2 === 0 ? 9.99 : 4.99,
  following: false,
  subscribed: false,
  tags: ['Lifestyle', 'Art', 'Exclusive']
}));

export default Explore;
