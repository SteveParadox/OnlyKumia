import React from 'react';
import { useAuth } from '../Auth/Auth';

import "../Css/Header.css";
import Person4Icon from '@mui/icons-material/Person4';
import IconButton from "@mui/material/IconButton";
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ForumIcon from '@mui/icons-material/Send';
import HomeIcon from '@mui/icons-material/Home';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import CategoryIcon from '@mui/icons-material/Category';

import { Link, Navigate, useLocation } from 'react-router-dom';


function Header() {
  // const { user, handleLogout } = AuthProvider();
// onClick={handleLogout}
  const { auth } = useAuth();
  const location = useLocation();

  console.log(auth);
  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="header">
        <>
        <Link to="/profile">
            <IconButton>
            <img src={auth.picture} alt="Profile" className="header__profile-img " />
            </IconButton>
          </Link>
          <Link to="/home">
            <IconButton>
              <HomeIcon fontSize="medium" className="header__icon" />
            </IconButton>
          </Link> 
          <Link to="/upload">
            <IconButton>
              <AcUnitIcon fontSize="medium" className="header__icon" />
            </IconButton>
          </Link>
          <Link to="/explore">
            <IconButton>
              <CategoryIcon fontSize="medium" className="header__icon" />
            </IconButton>
          </Link>
          
          <Link to="/video/call">
            <IconButton>
              <VideoCallIcon fontSize="medium" className="header__icon" />
            </IconButton>
          </Link>
        </>
     
    </div>
  );
}

export default Header;
