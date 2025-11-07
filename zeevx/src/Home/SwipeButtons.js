import React from 'react';
import '../Css/SwipeButtons.css';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import CloseIcon from '@mui/icons-material/Close';
import StarRateIcon from '@mui/icons-material/StarRate';
import FavoriteIcon from '@mui/icons-material/Favorite';
import IconButton from "@mui/material/IconButton";
// import { useSwipeActions } from '../Hooks/SwipeContext';


function SwipeButtons({swipeLeft, swipeRight, goBack}) {
  

  return (
    <div className="swipeButtons">
      <IconButton className="swipeButtons__left" onClick={swipeLeft}>
        <CloseIcon fontSize="medium" />
      </IconButton>

      <IconButton className="swipeButtons__star" onClick={goBack}>
        <StarRateIcon fontSize="medium" />
      </IconButton>

      <IconButton className="swipeButtons__right" onClick={swipeRight}>
        <FavoriteIcon fontSize="medium" />
      </IconButton>

      <IconButton className="swipeButtons__repeat" onClick={goBack}>
        <FastRewindIcon fontSize="medium" />
      </IconButton>
    </div>
  );
}
export default SwipeButtons;
