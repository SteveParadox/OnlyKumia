import React from "react";
import { useNavigate } from "react-router-dom";
import "../Css/Entry.css";

const Entry = () => {
  const navigate = useNavigate();

  return (
    <main className="landing-root">
      {/* HERO SECTION */}
      <section className="hero" aria-labelledby="hero-title">
        <img
          src="/logo.svg"
          alt="OnlyKumia Logo"
          className="hero-logo"
          loading="lazy"
        />
        <h1 id="hero-title" className="hero-title">
          Welcome to <span className="brand-highlight">OnlyKumia</span>
        </h1>
        <p className="hero-sub">
          Empowering creators and fans through verified, secure, and transparent
          interaction. Join today to connect, create and grow.
        </p>

        <div className="hero-buttons">
          <button
            type="button"
            onClick={() => navigate("/creator-signup")}
            className="glow-btn"
            aria-label="Sign up as a Creator"
          >
            Join as Creator
          </button>
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="ghost-btn"
            aria-label="Sign up as a Fan"
          >
            Join as Fan
          </button>
        </div>
      </section>

    </main>
  );
};

export default Entry;
