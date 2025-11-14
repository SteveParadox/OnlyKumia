import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Css/Error.css";

const Error = ({ title = "Oops!", message = "Page not found.", code = 404 }) => {
  const navigate = useNavigate();
  const primaryCtaRef = useRef(null);

  useEffect(() => {
    // Put focus on primary CTA for keyboard users / screen readers
    if (primaryCtaRef.current) primaryCtaRef.current.focus();

    // Example: report this error to analytics / logging (replace with real logger)
    // logError({ page: window.location.pathname, code, message });
  }, [code, message]);

  return (
    <main className="error-page" role="main" aria-labelledby="error-title">
      <section className="error-panel" role="alert" aria-live="polite">
        <div className="error-illustration" aria-hidden="true">
          {/* Minimal inline SVG illustration—scales nicely and matches theme */}
          <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="sky" x1="0" x2="1">
                <stop offset="0" stopColor="#0ea5e9" stopOpacity="1" />
                <stop offset="1" stopColor="#0284c7" stopOpacity="1" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" rx="24" fill="#0b0b0c" />
            <g transform="translate(50,40)">
              <circle cx="180" cy="140" r="95" fill="url(#sky)" opacity="0.12" />
              <g transform="translate(60,40)">
                <text x="160" y="120" textAnchor="middle" fontSize="120" fill="#ffffff22" fontFamily="Inter, system-ui, -apple-system">
                  404
                </text>
              </g>
            </g>
          </svg>
        </div>

        <div className="error-content">
          <h1 id="error-title" className="error-title">
            {title}
            <span className="error-code" aria-hidden="true"> — {code}</span>
          </h1>

          <p className="error-message">{message}</p>

          <div className="error-actions">
            <Link
              to="/"
              ref={primaryCtaRef}
              className="btn btn-primary"
              aria-label="Go to homepage"
            >
              Go to Homepage
            </Link>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              Go back
            </button>

            <Link to="/contact" className="btn btn-link" aria-label="Report issue">
              Report issue
            </Link>
          </div>

          <div className="error-hint" aria-hidden="true">
            Tip: If you typed the URL, check it for mistakes or try searching from the homepage.
          </div>
        </div>
      </section>
    </main>
  );
};

export default Error;
