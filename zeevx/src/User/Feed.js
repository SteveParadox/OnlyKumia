import { Container, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Feed= () => {
	return (

<section className="fan-dashboard min-h-screen bg-gradient-to-b from-[#0E0E10] to-[#1B1B1E] text-white">
  {/* NAVBAR */}
  <header className="sticky top-0 z-20 bg-[#141416]/80 backdrop-blur-md border-b border-gray-800 px-6 py-3 flex items-center justify-between">
    <h2 className="text-xl font-semibold tracking-wide">Your Feed</h2>
    <nav className="flex items-center gap-6 text-gray-400 text-sm">
      <a href="#" className="hover:text-cyan-400">Home</a>
      <a href="#" className="hover:text-cyan-400">Messages</a>
      <a href="#" className="hover:text-cyan-400">Subscriptions</a>
      <a href="#" className="hover:text-cyan-400">Settings</a>
    </nav>
  </header>

  {/* STORIES ROW */}
  <div className="flex overflow-x-auto gap-4 px-6 py-4 border-b border-gray-800">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        whileHover={{ scale: 1.05 }}
        className="flex flex-col items-center shrink-0 cursor-pointer"
      >
        <div className="w-16 h-16 rounded-full border-2 border-cyan-400 p-[2px] bg-[#1E1E20]">
          <img
            src={`/avatars/story-${i + 1}.jpg`}
            alt="Creator Story"
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <span className="text-xs text-gray-400 mt-1">Creator {i + 1}</span>
      </motion.div>
    ))}
  </div>

  {/* FEED */}
  <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
    {[...Array(4)].map((_, index) => (
      <motion.div
        key={index}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
        className="bg-[#141416]/80 rounded-2xl border border-gray-800 hover:border-cyan-500 transition overflow-hidden"
      >
        {/* POST HEADER */}
        <div className="flex items-center gap-3 px-5 py-4">
          <img
            src={`/avatars/poster-${index + 1}.jpg`}
            alt="Creator Avatar"
            className="w-10 h-10 rounded-full object-cover border border-gray-700"
          />
          <div>
            <h4 className="font-medium">Creator Name {index + 1}</h4>
            <p className="text-xs text-gray-500">2h ago</p>
          </div>
        </div>

        {/* POST MEDIA */}
        <div className="w-full h-72 bg-[#1E1E20]">
          <img
            src={`/posts/post-${index + 1}.jpg`}
            alt="Creator Post"
            className="w-full h-full object-cover"
          />
        </div>

        {/* POST ACTIONS */}
        <div className="px-5 py-3 flex items-center justify-between text-gray-400 text-sm">
          <div className="flex items-center gap-4">
            <span className="cursor-pointer hover:text-cyan-400">❤️ 1.2k</span>
            <span className="cursor-pointer hover:text-cyan-400">💬 123</span>
          </div>
          <span className="cursor-pointer hover:text-cyan-400">🔗 Share</span>
        </div>

        {/* CAPTION */}
        <div className="px-5 pb-4">
          <p className="text-gray-300 text-sm">
            “Behind the scenes of my latest shoot. More in DMs for subscribers 💫”
          </p>
        </div>
      </motion.div>
    ))}
  </div>

  {/* FLOATING NEW CONTENT INDICATOR */}
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 3 }}
    className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full px-5 py-3 shadow-lg cursor-pointer"
  >
    New Content Available ⟳
  </motion.div>
</section>
  );
};

export default Feed;
