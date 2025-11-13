import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Button, CircularProgress, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import VerificationStatus from '../Components/VerificationStatus';
import PurchaseModal from '../Components/PurchaseModal';
import mockPayments from '../Utils/mockPayments';
import { useAuth } from '../Auth/Auth';
import './CreatorDashboard.css';

// Lazy load heavy components
const CreatorStream = lazy(() => import('../Components/CreatorStream'));
const StreamChat = lazy(() => import('../Components/StreamChat'));
const TipCreator = lazy(() => import('../Components/TipCreator'));

const CreatorDashboard = () => {
  const { user } = useAuth() || {};
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [balance, setBalance] = useState(null);
  const [streamInfo, setStreamInfo] = useState(null);
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('Posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Simulate data load
  useEffect(() => {
    if (user) {
      try {
        const userBalance = mockPayments.getUserTokenBalance(user.uid);
        setBalance(userBalance);
        setTimeout(() => setLoading(false), 800);
      } catch (err) {
        setError('Failed to load user data.');
        setLoading(false);
      }
    }
  }, [user]);

  const handleStreamCreated = (info) => setStreamInfo(info);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <section className="creator-profile">
      {/* --- HERO SECTION --- */}
      <div className="creator-hero">
        <div className="creator-hero-content">
          <img
            src="/avatars/creator-avatar.jpg"
            alt="Creator Avatar"
            className="creator-avatar-large"
          />
          <div className="creator-info-main">
            <div className="creator-title">
              <h1>Aurora Lane</h1>
              <VerificationStatus className="verified-badge-large" />
            </div>
            <p className="creator-handle">@aurora.fit</p>
            <p className="creator-bio">
              Empowering fitness and mindfulness through daily workouts, wellness tips, and motivation.
            </p>
            <div className="creator-tags">
              <span className="tag">Fitness</span>
              <span className="tag">Lifestyle</span>
              <span className="tag">Motivation</span>
            </div>

            <div className="creator-stats">
              <div className="stat">
                <span className="stat-value">15.3k</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat">
                <span className="stat-value">120</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <span className="stat-value">45</span>
                <span className="stat-label">Videos</span>
              </div>
              <div className="stat">
                <span className="stat-value">{balance ?? 0}</span>
                <span className="stat-label">Tokens</span>
              </div>
            </div>

            <div className="creator-actions">
              <button className="follow-btn-large">Follow</button>
              <button
                className="subscribe-btn-large"
                onClick={() => setPurchaseOpen(true)}
              >
                Subscribe $9.99/mo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="tabs-bar">
        {['Posts', 'Photos', 'Videos', 'About'].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            whileTap={{ scale: 0.95 }}
          >
            {tab}
          </motion.button>
        ))}
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="creator-content">
        {activeTab === 'Posts' && (
          <motion.div
            layout
            className="content-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {[...Array(8)].map((_, index) => (
              <motion.div
                key={index}
                className="content-card"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <img
                  src={`/posts/post-${index + 1}.jpg`}
                  alt={`Post ${index + 1}`}
                  className="content-img"
                />
                <div className="content-overlay">
                  <div className="content-stats">
                    <span>❤️ 2.4k</span>
                    <span>💬 120</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'About' && (
          <div className="about-section">
            <h3>About Aurora</h3>
            <p>
              Aurora is a certified fitness coach dedicated to helping people live
              healthier, more balanced lives. She offers guided sessions, motivation,
              and personalized training streams.
            </p>
          </div>
        )}
      </div>

      {/* --- STREAMING SECTION --- */}
      <div className="stream-section">
        <h3>Creator Live Stream Panel</h3>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter Firebase Token"
          className="token-input"
        />

        <Suspense fallback={<CircularProgress color="primary" />}>
          <CreatorStream token={token} onStreamCreated={handleStreamCreated} />
          {streamInfo?.streamId && token && (
            <>
              <StreamChat streamId={streamInfo.streamId} token={token} />
              <TipCreator creatorId={user?.uid} token={token} />
            </>
          )}
        </Suspense>
      </div>

      {/* --- PURCHASE MODAL --- */}
      <PurchaseModal
        open={purchaseOpen}
        onClose={() => setPurchaseOpen(false)}
        userId={user?.uid}
        creatorId={null}
        onSuccess={() => {
          setPurchaseOpen(false);
          setBalance(mockPayments.getUserTokenBalance(user?.uid));
        }}
      />
    </section>
  );
};

export default CreatorDashboard;
