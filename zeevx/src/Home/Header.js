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
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import CategoryIcon from "@mui/icons-material/Category";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import LogoutIcon from "@mui/icons-material/Logout";
import "../Css/Header.css";

function Header() {
  const { auth, handleLogout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const navItems = [
    { to: "/home", icon: <HomeIcon />, label: "Home" },
    { to: "/upload", icon: <AcUnitIcon />, label: "Upload" },
    { to: "/explore", icon: <CategoryIcon />, label: "Explore" },
    { to: "/video/call", icon: <VideoCallIcon />, label: "Video Call" },
  ];

  return (
    <header className="header">
      <div className="header__left">
        <IconButton
          className="header__menu"
          onClick={() => setMenuOpen(true)}
          aria-label="open menu"
        >
          <MenuIcon />
        </IconButton>

        <Link to="/home" className="header__brand">
          <img
            src="/logo192.png"
            alt="App Logo"
            className="header__logo"
          />
          <span className="header__title">MyApp</span>
        </Link>
      </div>

      <nav className="header__nav">
        {navItems.map(({ to, icon, label }) => (
          <Tooltip key={to} title={label} arrow>
            <Link
              to={to}
              className={`header__nav-item ${
                location.pathname === to ? "active" : ""
              }`}
            >
              <IconButton color="primary">{icon}</IconButton>
            </Link>
          </Tooltip>
        ))}
      </nav>

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
          <IconButton onClick={handleLogout} color="primary">
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </div>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      >
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