import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { motion } from 'framer-motion';

const Loading = ({ message = 'Loading, please wait...' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0E0E10] text-gray-200">
      {/* Logo or icon animation */}
      <motion.div
        className="mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
      >
        <img src="/logo.svg" alt="Loading Logo" className="w-24 h-24 opacity-80" />
      </motion.div>

      {/* Spinner */}
      <CircularProgress size={64} thickness={5} color="inherit" />

      {/* Text animation */}
      <motion.p
        className="mt-6 text-sm tracking-wide text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      >
        {message}
      </motion.p>
    </div>
  );
};

export default Loading;
