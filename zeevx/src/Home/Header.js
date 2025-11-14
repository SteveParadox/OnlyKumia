import React, { useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../Auth/Auth";
import {
  IconButton,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import VideoCameraFrontRoundedIcon from "@mui/icons-material/VideoCameraFrontRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import "../Css/Header.css";

function Header() {
  const { auth, handleLogout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navItems = [
    { to: "/home", icon: <HomeRoundedIcon />, label: "Home" },
    { to: "/upload", icon: <CloudUploadRoundedIcon />, label: "Upload" },
    { to: "/explore", icon: <ExploreRoundedIcon />, label: "Explore" },
    { to: "/videos/call", icon: <VideoCameraFrontRoundedIcon />, label: "Video Call" },
    { to: "/messages", icon: <ChatBubbleRoundedIcon />, label: "Messages" },
  ];

  return (
    <header className="header">
      {/* LEFT SIDE */}
      <div className="header__left">
        <IconButton
          className="header__menu"
          onClick={() => setMenuOpen(true)}
          aria-label="open menu"
        >
          <MenuRoundedIcon />
        </IconButton>

        <Link to="/home" className="header__brand">
          <img src="/logo192.png" alt="App Logo" className="header__logo" />
          <span className="header__title">OnlyKumia</span>
        </Link>
      </div>

      {/* CENTER NAV ICONS */}
      <nav className="header__nav">
        {navItems.map(({ to, icon, label }) => (
          <Tooltip key={to} title={label} arrow>
            <Link
              to={to}
              className={`header__nav-item ${location.pathname === to ? "active" : ""}`}
            >
              <IconButton className="header__icon">{icon}</IconButton>
            </Link>
          </Tooltip>
        ))}
      </nav>

      {/* RIGHT SIDE */}
      <div className="header__right">
        <Tooltip title="Profile" arrow>
          <Link to="/creator/dashboard">
            <img
              src={auth.picture}
              alt="Profile"
              className="header__profile-img"
            />
          </Link>
        </Tooltip>

        <Tooltip title="Logout" arrow>
          <IconButton onClick={handleLogout} className="header__icon">
            <LogoutRoundedIcon />
          </IconButton>
        </Tooltip>
      </div>

      {/* DRAWER MENU */}
      <Drawer anchor="left" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <List sx={{ width: 240 }}>
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
        </List>
      </Drawer>
    </header>
  );
}

export default Header;
