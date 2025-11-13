
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Container, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import VerificationStatus from '../Components/VerificationStatus';
import PurchaseModal from '../Components/PurchaseModal';
import mockPayments from '../Utils/mockPayments';
import { useAuth } from '../Auth/Auth';
import CreatorStream from '../Components/CreatorStream';
import StreamChat from '../Components/StreamChat';
import TipCreator from '../Components/TipCreator';
import '../Css/CreatorDashboard.css';



const CreatorDashboard = () => {
  const { user } = useAuth() || {};
  const [purchaseOpen, setPurchaseOpen] = React.useState(false);
  const [balance, setBalance] = React.useState(null);
  const [streamInfo, setStreamInfo] = React.useState(null);
  const [token, setToken] = React.useState('');

  React.useEffect(() => {
    if (user) {
      setBalance(mockPayments.getUserTokenBalance(user.uid));
    }
  }, [user]);

  // Handler to receive stream info from CreatorStream
  const handleStreamCreated = (info) => {
    setStreamInfo(info);
  };

  return (
    <section className="creator-profile min-h-screen bg-gradient-to-b from-[#0E0E10] to-[#1B1B1E] text-white">
      {/* STREAMING CONTROLS */}
      <div style={{ margin: '2rem auto', maxWidth: 600 }}>
        <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="Paste Firebase ID token for stream/chat/tip" style={{ width: '100%', margin: '8px 0' }} />
        <CreatorStream token={token} onStreamCreated={handleStreamCreated} />
        {streamInfo?.streamId && token && (
          <>
            <StreamChat streamId={streamInfo.streamId} token={token} />
            <TipCreator creatorId={user?.uid} token={token} />
          </>
        )}
      </div>

      {/* HEADER BANNER */}
      <div className="relative h-60 md:h-72 w-full">
        <img
          src="/banners/sample-banner.jpg"
          alt="Creator Banner"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-0 left-0 flex items-end gap-4 px-6 pb-6">
          <img
            src="/avatars/creator-avatar.jpg"
            alt="Creator Avatar"
            className="w-24 h-24 rounded-full border-4 border-cyan-400 object-cover"
          />
          <div>
            <h2 className="text-2xl font-semibold">Aurora Lane</h2>
            <div className="flex items-center gap-3">
              <p className="text-gray-400 text-sm">Fitness • Lifestyle • Motivation</p>
              <div>
                <VerificationStatus />
              </div>
              <div className="text-sm text-gray-300 ml-4">Tokens: {balance ?? 0}</div>
              <div>
                <Button variant="contained" size="small" onClick={() => setPurchaseOpen(true)} sx={{ ml: 2 }}>Subscribe</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#141416]/50 backdrop-blur-md">
        <div className="flex items-center gap-4 mb-3 sm:mb-0">
          <span className="text-gray-400 text-sm">💎 15.3k followers</span>
          <span className="text-gray-400 text-sm">📸 120 posts</span>
          <span className="text-gray-400 text-sm">🎥 45 videos</span>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outlined"
            color="inherit"
            className="border-gray-600 hover:border-cyan-500 text-gray-300 hover:text-white rounded-xl px-5"
          >
            Follow
          </Button>
          <Button
            variant="contained"
            color="primary"
            className="bg-cyan-600 hover:bg-cyan-700 rounded-xl px-6"
          >
            Subscribe $9.99/mo
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="px-6 mt-6 border-b border-gray-800 flex gap-8 overflow-x-auto">
        {["Posts", "Photos", "Videos", "About"].map((tab, i) => (
          <button
            key={i}
            className={`pb-3 px-2 font-medium text-sm border-b-2 transition ${
              i === 0 ? "border-cyan-500 text-white" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* CONTENT GRID */}
      <motion.div
        layout
        className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 px-6 py-8"
      >
        {[...Array(8)].map((_, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
            className="bg-[#141416] rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500 transition"
          >
            <img
              src={`/posts/post-${index + 1}.jpg`}
              alt="Creator Post"
              className="w-full h-48 object-cover"
            />
          </motion.div>
        ))}
      </motion.div>

      <PurchaseModal open={purchaseOpen} onClose={() => setPurchaseOpen(false)} userId={user?.uid} creatorId={null} onSuccess={() => { setPurchaseOpen(false); setBalance(mockPayments.getUserTokenBalance(user?.uid)); }} />

      {/* ABOUT SECTION (optional when tab = 'About') */}
      {/* Replace content grid with bio, achievements, and social links */}
    </section>
  );
};

export default CreatorDashboard;
