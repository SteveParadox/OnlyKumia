import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/Auth";

import {
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Popover,
  Badge,
  Avatar,
  InputBase,
  Box,
} from "@mui/material";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import VideoCameraFrontRoundedIcon from "@mui/icons-material/VideoCameraFrontRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SearchIcon from "@mui/icons-material/Search";
import WbSunnyRoundedIcon from "@mui/icons-material/WbSunnyRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";

import "../Css/Header.css";

/**
 * Production-ready Header with:
 * - Expandable search (icon -> input)
 * - Messages preview popover (mini chat list)
 * - Dark/light toggle persisted in localStorage
 * - Responsive drawer for mobile
 */
function Header() {
  const { auth, handleLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messagesAnchor, setMessagesAnchor] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const searchInputRef = useRef(null);

  // Mock messages (replace with real data)
  const [messages] = useState([
    {
      id: "m1",
      name: "Lina Gardner",
      avatar: "/avatars/user1.jpg",
      snippet: "Hey — loved your last workout stream!",
      time: "2h",
      unread: 2,
    },
    {
      id: "m2",
      name: "Marcus Li",
      avatar: "/avatars/user2.jpg",
      snippet: "Can you share the reps?",
      time: "Yesterday",
      unread: 0,
    },
    {
      id: "m3",
      name: "Studio Support",
      avatar: "/avatars/support.jpg",
      snippet: "Your payout was processed.",
      time: "3d",
      unread: 0,
    },
  ]);

  useEffect(() => {
    // Apply theme on initial load
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navItems = [
    { to: "/home", icon: <HomeRoundedIcon />, label: "Home" },
    { to: "/upload", icon: <CloudUploadRoundedIcon />, label: "Upload" },
    { to: "/explore", icon: <ExploreRoundedIcon />, label: "Explore" },
    { to: "/videos/call", icon: <VideoCameraFrontRoundedIcon />, label: "Video Call" },
  ];

  const unreadCount = messages.reduce((acc, m) => acc + (m.unread || 0), 0);

  const onSearchSubmit = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    // Navigate to a search results page (implement server or client search)
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="header">
      {/* LEFT */}
      <div className="header__left">
        <IconButton
          className="header__menu"
          onClick={() => setMenuOpen(true)}
          aria-label="open navigation menu"
        >
          <MenuRoundedIcon />
        </IconButton>

        <Link to="/home" className="header__brand" aria-label="Go to homepage">
          <img src="/logo192.png" alt="App Logo" className="header__logo" />
          <span className="header__title">OnlyKumia</span>
        </Link>
      </div>

      {/* CENTER NAV ICONS */}
      <nav className="header__nav" role="navigation" aria-label="Main navigation">
        {navItems.map(({ to, icon, label }) => (
          <Tooltip key={to} title={label} arrow>
            <Link
              to={to}
              className={`header__nav-item ${location.pathname === to ? "active" : ""}`}
              aria-current={location.pathname === to ? "page" : undefined}
            >
              <IconButton className="header__icon" aria-label={label}>
                {icon}
              </IconButton>
            </Link>
          </Tooltip>
        ))}
      </nav>

      {/* RIGHT: search (expandable), messages, theme toggle, profile, logout */}
      <div className="header__right">
        {/* Expandable Search */}
        <form onSubmit={onSearchSubmit} className={`search-form ${searchOpen ? "open" : ""}`} role="search" aria-label="Site search">
          <InputBase
            inputRef={searchInputRef}
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            inputProps={{ "aria-label": "Search" }}
            onBlur={() => { /* keep it open until click outside or explicit close */ }}
          />
          <IconButton
            className="search-icon-btn"
            aria-label="Open search"
            onClick={(ev) => {
              if (!searchOpen) {
                setSearchOpen(true);
              } else {
                // if already open, submit
                onSearchSubmit(ev);
              }
            }}
          >
            <SearchIcon />
          </IconButton>
          {searchOpen && (
            <button
              type="button"
              className="search-close"
              aria-label="Close search"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            >
              ✕
            </button>
          )}
        </form>

        {/* Messages preview */}
        <Tooltip title="Messages" arrow>
          <IconButton
            aria-label="Open messages preview"
            onClick={(e) => setMessagesAnchor(e.currentTarget)}
            className="header__icon"
          >
            <Badge badgeContent={unreadCount} color="info" invisible={unreadCount === 0}>
              <ChatBubbleRoundedIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Popover
          open={Boolean(messagesAnchor)}
          anchorEl={messagesAnchor}
          onClose={() => setMessagesAnchor(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ className: "messages-popover" }}
        >
          <Box sx={{ width: 340, maxWidth: "calc(100vw - 20px)" }}>
            <div className="messages-header">
              <strong>Messages</strong>
              <Link to="/messages" className="messages-see-all" onClick={() => setMessagesAnchor(null)}>See all</Link>
            </div>

            <List>
              {messages.map((m) => (
                <ListItem
                  key={m.id}
                  button
                  component={Link}
                  to={`/messages/${m.id}`}
                  onClick={() => setMessagesAnchor(null)}
                  className={`message-item ${m.unread ? "unread" : ""}`}
                  alignItems="flex-start"
                >
                  <ListItemIcon>
                    <Badge badgeContent={m.unread || 0} color="info" invisible={!m.unread}>
                      <Avatar src={m.avatar} alt={m.name} />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={<span className="message-name">{m.name} <span className="message-time">{m.time}</span></span>}
                    secondary={<span className="message-snippet">{m.snippet}</span>}
                  />
                </ListItem>
              ))}
            </List>
            <div className="messages-footer">
              <small className="muted">Encrypted · Replies only to followers</small>
            </div>
          </Box>
        </Popover>

        {/* Theme toggle (sun / moon) */}
        <Tooltip title={theme === "dark" ? "Switch to light" : "Switch to dark"} arrow>
          <IconButton
            aria-label="Toggle theme"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="header__icon"
          >
            {theme === "dark" ? <WbSunnyRoundedIcon /> : <DarkModeRoundedIcon />}
          </IconButton>
        </Tooltip>

        {/* Profile */}
        <Tooltip title="Profile" arrow>
          <Link to="/creator/dashboard" className="profile-link" aria-label="Go to profile">
            <Avatar src={auth.picture} alt={`${auth.name || "Profile"}`} className="header__profile-img" />
          </Link>
        </Tooltip>

        {/* Logout */}
        <Tooltip title="Logout" arrow>
          <IconButton onClick={handleLogout} className="header__icon" aria-label="Logout">
            <LogoutRoundedIcon />
          </IconButton>
        </Tooltip>
      </div>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <List sx={{ width: 260 }}>
          {navItems.map(({ to, icon, label }) => (
            <ListItem
              button
              key={to}
              component={Link}
              to={to}
              onClick={() => setMenuOpen(false)}
              selected={location.pathname === to}
            >
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={label} />
            </ListItem>
          ))}

          <ListItem button component={Link} to="/messages" onClick={() => setMenuOpen(false)}>
            <ListItemIcon><ChatBubbleRoundedIcon /></ListItemIcon>
            <ListItemText primary="Messages" />
          </ListItem>

          <ListItem>
            <ListItemIcon>{theme === "dark" ? <WbSunnyRoundedIcon /> : <DarkModeRoundedIcon />}</ListItemIcon>
            <ListItemText primary="Theme" />
            <IconButton onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}>
              {theme === "dark" ? <WbSunnyRoundedIcon /> : <DarkModeRoundedIcon />}
            </IconButton>
          </ListItem>
        </List>
      </Drawer>
    </header>
  );
}

export default Header;
