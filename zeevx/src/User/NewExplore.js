import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../Utils/axios';
import { useAuth } from '../Auth/Auth';
import { useLocation } from 'react-router-dom';
import '../Css/Explore.css';


// Icons
import SearchIcon from '@mui/icons-material/Search';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShareIcon from '@mui/icons-material/Share';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';

// Components
import LoginPrompt from '../Components/LoginPrompt';
import PurchaseModal from '../Components/PurchaseModal';

const CATEGORIES = [
  { id: 'all', label: 'For You', icon: '🔥' },
  { id: 'trending', label: 'Trending', icon: '📈' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'food', label: 'Food', icon: '🍳' },
  { id: 'tech', label: 'Tech', icon: '💻' },
];

const ContentCard = ({ content, index, onLike, onSave, onFollow, onShare, onSubscribe }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="content-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <img src={content.mediaUrl} alt={content.caption} className="content-img" />

      <div className="content-overlay" style={{ opacity: isHovered ? 1 : 0 }}>
        <div className="creator-info">
          <img src={content.creatorAvatar} alt={content.creatorName} className="creator-avatar" />
          <div>
            <h4 className="creator-name">
              {content.creatorName}
              {content.verified && <VerifiedIcon className="verified-badge" fontSize="small" />}
            </h4>
            <p className="creator-handle">@{content.creatorHandle}</p>
            {content.tags && (
              <div className="creator-tags">
                {content.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="engagement-stats">
          <div className="stat-item">
            <PlayCircleIcon /> {content.views}
          </div>
          <div className="stat-item">
            {content.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </div>
          <div className="stat-item">
            {content.isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </div>
          {content.verified && (
            <div className="stat-item verified-stat">
              <VerifiedIcon fontSize="small" /> Verified Creator
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button
            className={'action-btn follow-btn ' + (content.following ? 'liked' : '')}
            onClick={() => onFollow(content.id)}
          >
            <PersonAddIcon />
          </button>
          <button
            className={`action-btn ${content.isLiked ? 'liked' : ''}`}
            onClick={() => onLike(content.id)}
          >
            {content.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </button>
          <button
            className={`action-btn ${content.isSaved ? 'saved' : ''}`}
            onClick={() => onSave(content.id)}
          >
            {content.isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </button>
          <button className="action-btn" onClick={() => onShare(content.id)}>
            <ShareIcon />
          </button>
          {content.price && (
            <button className="subscribe-btn" onClick={() => onSubscribe(content.id)}>
              Subscribe • ${content.price}/mo
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const NewExplore = () => {
  const { user, auth } = useAuth() || {};
  const location = useLocation();

  const [activeCategory, setActiveCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPurchase, setShowPurchase] = useState({ open: false, creatorId: null, price: null });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef(null);

  // Fetch content function
  const fetchContent = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    try {
      const params = {
        category: activeCategory === 'all' ? undefined : activeCategory,
        q: query,
        page: reset ? 1 : page,
      };
      const res = await axios.get('/content', { params });
      const newContent = res.data?.data || [];

      if (reset) {
        setContent(newContent);
        setPage(2);
      } else {
        setContent(prev => [...prev, ...newContent]);
        setPage(prev => prev + 1);
      }

      setHasMore(newContent.length > 0);
    } catch (err) {
      console.warn('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, query, page, loading, hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchContent(false);
        }
      },
      { rootMargin: '300px' }
    );

    if (observerRef.current) observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [hasMore, loading, fetchContent]);

  // Debounced search/category effect
  useEffect(() => {
    const timer = setTimeout(() => fetchContent(true), 300);
    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  // Interaction handlers
  const handleLike = async (contentId) => {
    if (!auth) return setShowLoginPrompt(true);
    setContent(prev =>
      prev.map(item =>
        item.id === contentId ? { ...item, isLiked: !item.isLiked, likes: item.likes + (item.isLiked ? -1 : 1) } : item
      )
    );
    try {
      await axios.post(`/content/${contentId}/like`);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleSave = async (contentId) => {
    if (!auth) return setShowLoginPrompt(true);
    setContent(prev =>
      prev.map(item => (item.id === contentId ? { ...item, isSaved: !item.isSaved } : item))
    );
    try {
      await axios.post(`/content/${contentId}/save`);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleShare = (contentId) => {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this content',
        url: window.location.origin + '/content/' + contentId,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + '/content/' + contentId);
    }
  };

  const handleSubscribe = (contentId) => {
    if (!auth) return setShowLoginPrompt(true);
    const contentItem = content.find(item => item.id === contentId);
    if (contentItem) {
      setShowPurchase({ open: true, creatorId: contentId, price: contentItem.price });
    }
  };

  return (
    <div className="explore-page">
      {/* Category Pills */}
      <div className="category-scroll">
        <div className="category-pills">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`category-pill ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span>{category.icon}</span> {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <SearchIcon className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Search creators, tags, or topics..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        <AnimatePresence>
          {content.map((item, index) => (
            <ContentCard
              key={item.id}
              content={item}
              index={index}
              onLike={handleLike}
              onSave={handleSave}
              onShare={handleShare}
              onFollow={handleSubscribe} // If you implement follow separately
              onSubscribe={handleSubscribe}
            />
          ))}
        </AnimatePresence>

        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-card" />
        ))}

        <div ref={observerRef} style={{ height: 20 }} />
      </div>

      {/* Modals */}
      <LoginPrompt
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        redirectTo={location.pathname}
      />
      <PurchaseModal
        open={showPurchase.open}
        onClose={() => setShowPurchase({ open: false, creatorId: null, price: null })}
        userId={user?.uid}
        creatorId={showPurchase.creatorId}
        price={showPurchase.price}
      />
    </div>
  );
};

// Mock content generator for development
const generateMockContent = (page) => {
  return Array.from({ length: 12 }, (_, i) => ({
    id: `${page}-${i}`,
    mediaUrl: `https://picsum.photos/400/400?random=${page * 12 + i}`,
    caption: 'Amazing content caption',
    creatorName: `Creator ${i + 1}`,
    creatorHandle: `creator${i + 1}`,
    creatorAvatar: `https://i.pravatar.cc/150?u=${i}`,
    verified: i % 3 === 0,
    views: Math.floor(Math.random() * 100000),
    likes: Math.floor(Math.random() * 10000),
    isLiked: false,
    isSaved: false,
    following: false,
    price: i % 2 === 0 ? 9.99 : 4.99,
    tags: ['Lifestyle', 'Art', 'Photography'].slice(0, Math.floor(Math.random() * 3) + 1),
  }));
};

export default NewExplore;
