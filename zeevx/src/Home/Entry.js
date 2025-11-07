import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Css/LandingPage.css';

const Entry = () => {
  const navigate = useNavigate();

  return (
    <section className="entry-screen min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#0E0E10] to-[#1B1B1E] text-white px-4">
      <div className="text-center space-y-8">
        <img
          src="/logo.svg"
          alt="OnlyKumia Logo"
          className="w-24 h-24 mx-auto opacity-80"
        />

        <h1 className="text-4xl font-bold tracking-wide">Welcome to OnlyKumia</h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Empowering creators and fans through secure, verified, and direct
          interaction.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <button
            onClick={() => navigate('/creator-signup')}
            className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 rounded-2xl font-medium shadow-md transition"
          >
            Join as Creator
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="border border-gray-600 hover:border-indigo-500 px-8 py-3 rounded-2xl font-medium transition"
          >
            Join as Fan
          </button>
        </div>

        <p className="text-gray-500 text-xs mt-6">
          18+ only. All users must pass ID verification.
        </p>
      </div>
    </section>
  );
};

export default Entry;
