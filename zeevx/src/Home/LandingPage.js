import React from 'react';
import { Container, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PeopleIcon from '@mui/icons-material/People';
import TwitterIcon from '@mui/icons-material/Twitter';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { useAuth } from '../Auth/Auth'; 
import '../Css/LandingPage.css';

const features = [
  {
    icon: <VerifiedUserIcon />,
    title: 'Verified & Secure',
    desc: 'Every creator is verified through ID checks to ensure authenticity and safety.',
  },
  {
    icon: <MonetizationOnIcon />,
    title: 'Fair Payouts',
    desc: 'Keep more of what you earn with fast withdrawals and transparent fees.',
  },
  {
    icon: <VisibilityOffIcon />,
    title: 'Total Privacy Control',
    desc: 'Decide who sees your work, where it’s visible, and when it disappears.',
  },
  {
    icon: <PeopleIcon />,
    title: 'Build Your Community',
    desc: 'Connect with loyal fans, sell exclusive content, and grow your brand.',
  },
];

const testimonials = [
  {
    name: 'Ihechi A.',
    quote:
      'OnlyKumia gave me full control over my content and income. Finally, a platform that respects creators.',
  },
  {
    name: 'Micheal U.',
    quote:
      'The privacy tools are unmatched. I decide who sees what — and that changes everything.',
  },
  {
    name: 'Soludo U.',
    quote:
      'Clean interface, fair payouts, and full ownership of my content. Can’t recommend it enough.',
  },
];

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="App landing-root">
      {/* NAVIGATION */}
      <nav className="nav-bar">
        <div className="container">
          <Link className="logo-nav" to="/">
            Only<span>Kumia</span>
          </Link>
          <ul className="nav-links">
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#creators">Creators</a>
            </li>
            <li>
              <Link to="/marketplace">Marketplace</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
           <li>
            {user ? (
                <Link to="/dashboard" className="go-premium-cta">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="go-premium-cta">
                    Login
                  </Link>
                  <span style={{ margin: '0 6px' }}>|</span>
                  <Link to="/signup" className="go-premium-cta">
                    Sign Up
                  </Link>
                </>
              )}
            </li>

          </ul>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="hero-content"
          >
            <Typography variant="h3" className="hero-title">
              Empowering Adult Creators. Protecting Privacy.
            </Typography>
            <Typography variant="subtitle1" className="hero-sub">
              Monetize your work of art, moments and creativity — safely and on your terms.
            </Typography>
            <div className="hero-buttons">
              
              <Button
                variant="contained"
                color="primary"
                component={Link}
                to="/creator-signup"
                className="glow-btn"
              >
                Become a Creator
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                component={Link}
                to="/explore"
                className="ghost-btn"
              >
                Explore Creators
              </Button>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* FEATURES */}
      <section id="features" className="features-section">
        <Container>
          <Typography variant="h4" align="center" gutterBottom>
            Why Creators Choose OnlyKumia
          </Typography>
          <Grid container spacing={4} justifyContent="center" sx={{ mt: 2 }}>
            {features.map((feature, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <motion.div whileHover={{ scale: 1.05 }}>
                  <Card className="feature-card">
                    <CardContent>
                      <div className="feature-icon">{feature.icon}</div>
                      <Typography variant="h6">{feature.title}</Typography>
                      <Typography variant="body2">{feature.desc}</Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </section>

      {/* TESTIMONIALS */}
      <section id="creators" className="testimonials-section">
        <Container>
          <Typography variant="h4" align="center" gutterBottom>
            Trusted by Independent Creators Everywhere
          </Typography>
          <div className="testimonial-list">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                className="testimonial-card"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <blockquote>“{item.quote}”</blockquote>
                <cite>— {item.name}</cite>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <Container>
          <Typography variant="h4" gutterBottom>
            Start Creating, Earning and Protecting Your Work Today.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            component={Link}
            to="/creator-signup"
            className="glow-btn"
          >
            Join OnlyKumia
          </Button>
        </Container>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <Container className="footer-content">
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} OnlyKumia. Empowering creators worldwide.
          </Typography>
          <div className="socials">
            <a href="https://twitter.com" aria-label="Twitter">
              <TwitterIcon />
            </a>
            <a href="https://github.com" aria-label="GitHub">
              <GitHubIcon />
            </a>
            <a href="https://linkedin.com" aria-label="LinkedIn">
              <LinkedInIcon />
            </a>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default LandingPage;
