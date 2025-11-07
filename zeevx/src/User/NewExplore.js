import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../Utils/axios';
import { useAuth } from '../Auth/Auth';
import { useLocation } from 'react-router-dom';

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

const ContentCard = ({ content, index, onLike, onSave, onFollow, onShare }) => {
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
      <img 
        src={content.mediaUrl} 
        alt={content.caption}
        className="content-img"
      />
      
      <div className="content-overlay" style={{ opacity: isHovered ? 1 : 0 }}>
        <div className="creator-info">
          <img 
            src={content.creatorAvatar} 
            alt={content.creatorName}
            className="creator-avatar"
          />
          <div>
            <h4 className="creator-name">
              {content.creatorName}
              {content.verified && (
                <VerifiedIcon className="verified-badge" fontSize="small" />
              )}
            </h4>
            <p className="creator-handle">@{content.creatorHandle}</p>
          </div>
        </div>

        <div className="engagement-stats">
          <div className="stat-item">
            <PlayCircleIcon /> {content.views}
          </div>
          <div className="stat-item">
            <FavoriteBorderIcon /> {content.likes}
          </div>
        </div>

        <div className="action-buttons">
          <button 
            className={\`action-btn \${content.isLiked ? 'liked' : ''}\`}
            onClick={() => onLike(content.id)}
          >
            {content.isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </button>
          <button 
            className={\`action-btn \${content.isSaved ? 'saved' : ''}\`}
            onClick={() => onSave(content.id)}
          >
            {content.isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </button>
          <button 
            className="action-btn"
            onClick={() => onShare(content.id)}
          >
            <ShareIcon />
          </button>
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
  const [showPurchase, setShowPurchase] = useState(false);
  const observerRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch content with category and search
  const fetchContent = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;
    
    setLoading(true);
    try {
      const params = {
        category: activeCategory === 'all' ? undefined : activeCategory,
        q: query,
        page: reset ? 1 : page
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
      // Fallback to mock data in development
      const mockContent = generateMockContent(reset ? 1 : page);
      if (reset) {
        setContent(mockContent);
      } else {
        setContent(prev => [...prev, ...mockContent]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, query, page, loading, hasMore]);

  // Initialize infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchContent(false);
        }
      },
      { rootMargin: '300px' }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, fetchContent]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContent(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  // Content interaction handlers
  const handleLike = async (contentId) => {
    if (!auth) {
      setShowLoginPrompt(true);
      return;
    }

    setContent(prev =>
      prev.map(item =>
        item.id === contentId
          ? { ...item, isLiked: !item.isLiked, likes: item.likes + (item.isLiked ? -1 : 1) }
          : item
      )
    );

    try {
      await axios.post(\`/content/\${contentId}/like\`);
    } catch (err) {
      console.error('Like failed:', err);
      // Revert on error
      setContent(prev =>
        prev.map(item =>
          item.id === contentId
            ? { ...item, isLiked: !item.isLiked, likes: item.likes + (item.isLiked ? 1 : -1) }
            : item
        )
      );
    }
  };

  const handleSave = async (contentId) => {
    if (!auth) {
      setShowLoginPrompt(true);
      return;
    }

    setContent(prev =>
      prev.map(item =>
        item.id === contentId ? { ...item, isSaved: !item.isSaved } : item
      )
    );

    try {
      await axios.post(\`/content/\${contentId}/save\`);
    } catch (err) {
      console.error('Save failed:', err);
      setContent(prev =>
        prev.map(item =>
          item.id === contentId ? { ...item, isSaved: !item.isSaved } : item
        )
      );
    }
  };

  const handleShare = (contentId) => {
    // Implement share functionality (modal, native share, etc.)
    if (navigator.share) {
      navigator.share({
        title: 'Check out this content',
        url: \`\${window.location.origin}/content/\${contentId}\`
      });
    } else {
      // Fallback to copy link
      navigator.clipboard.writeText(\`\${window.location.origin}/content/\${contentId}\`);
      // Show toast notification
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
              className={\`category-pill \${activeCategory === category.id ? 'active' : ''}\`}
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
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      )}

      {/* Infinite Scroll Trigger */}
      <div ref={observerRef} style={{ height: 20 }} />

      {/* Modals */}
      <LoginPrompt
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        redirectTo={location.pathname}
      />
      
      <PurchaseModal
        open={showPurchase.open}
        onClose={() => setShowPurchase({ open: false })}
        userId={user?.uid}
        creatorId={showPurchase.creatorId}
      />
    </div>
  );
};

// Mock content generator for development
const generateMockContent = (page) => {
  return Array.from({ length: 12 }, (_, i) => ({
    id: \`\${page}-\${i}\`,
    mediaUrl: \`https://picsum.photos/400/400?random=\${page * 12 + i}\`,
    caption: 'Amazing content caption',
    creatorName: \`Creator \${i + 1}\`,
    creatorHandle: \`creator\${i + 1}\`,
    creatorAvatar: \`https://i.pravatar.cc/150?u=\${i}\`,
    verified: i % 3 === 0,
    views: Math.floor(Math.random() * 100000),
    likes: Math.floor(Math.random() * 10000),
    isLiked: false,
    isSaved: false
  }));
};

export default NewExplore;