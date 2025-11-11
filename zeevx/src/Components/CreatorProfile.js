import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from '../Utils/axios';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import { useAuth } from '../Auth/Auth';
import LoginPrompt from './LoginPrompt';
import PurchaseModal from './PurchaseModal';

const CreatorProfile = () => {
  const { handle } = useParams();
  const { user, auth } = useAuth() || {};
  const [creator, setCreator] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPurchase, setShowPurchase] = useState({ open: false, creatorId: null, price: null });

  useEffect(() => {
    const fetchCreatorData = async () => {
      setLoading(true);
      try {
        // Fetch creator info
        const creatorRes = await axios.get(`/creators/${handle}`);
        setCreator(creatorRes.data);

        // Fetch creator's content
        const contentRes = await axios.get(`/creators/${handle}/content`);
        setContent(contentRes.data);
      } catch (err) {
        console.error('Failed to fetch creator data:', err);
        setError('Failed to load creator profile');
        // Use mock data in development
        setCreator({
          name: 'Creator Name',
          handle,
          avatar: 'https://i.pravatar.cc/150',
          verified: true,
          bio: 'Creator bio goes here. This is a short description about the creator.',
          followers: 1234,
          following: 567,
          posts: 89,
          price: 9.99,
          tags: ['Art', 'Photography', 'Lifestyle']
        });
        setContent([
          // Mock content items
          {
            id: 1,
            mediaUrl: 'https://picsum.photos/400/400',
            caption: 'Amazing content',
            likes: 1234,
            views: 5678
          }
          // Add more mock content items as needed
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorData();
  }, [handle]);

  const handleSubscribe = () => {
    if (!auth) {
      setShowLoginPrompt(true);
      return;
    }

    setShowPurchase({
      open: true,
      creatorId: creator.id,
      price: creator.price
    });
  };

  if (loading) {
    return <div className="loading">Loading creator profile...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="creator-profile">
      {/* Hero Section */}
      <div className="creator-hero">
        <div className="creator-hero-content">
          <motion.img
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="creator-avatar-large"
            src={creator.avatar}
            alt={creator.name}
          />
          
          <div className="creator-info-main">
            <div className="creator-title">
              <h1>{creator.name}</h1>
              {creator.verified && (
                <VerifiedIcon className="verified-badge-large" color="primary" />
              )}
            </div>
            
            <h2 className="creator-handle">@{creator.handle}</h2>
            
            {creator.tags && (
              <div className="creator-tags">
                {creator.tags.map((tag, i) => (
                  <span key={i} className="tag">#{tag}</span>
                ))}
              </div>
            )}
            
            <p className="creator-bio">{creator.bio}</p>
            
            <div className="creator-stats">
              <div className="stat">
                <span className="stat-value">{creator.followers}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat">
                <span className="stat-value">{creator.following}</span>
                <span className="stat-label">Following</span>
              </div>
              <div className="stat">
                <span className="stat-value">{creator.posts}</span>
                <span className="stat-label">Posts</span>
              </div>
            </div>
            
            <div className="creator-actions">
              {creator.price && (
                <button 
                  className="subscribe-btn-large"
                  onClick={handleSubscribe}
                >
                  Subscribe • ${creator.price}/mo
                </button>
              )}
              
              <button className="follow-btn-large">
                <PersonAddIcon /> Follow
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="creator-content">
        <div className="content-grid">
          {content.map((item) => (
            <motion.div
              key={item.id}
              className="content-card"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <img 
                src={item.mediaUrl}
                alt={item.caption}
                className="content-img"
              />
              <div className="content-overlay">
                <div className="content-stats">
                  <span><PlayCircleIcon /> {item.views}</span>
                  <span><FavoriteBorderIcon /> {item.likes}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <LoginPrompt
        open={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
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

export default CreatorProfile;