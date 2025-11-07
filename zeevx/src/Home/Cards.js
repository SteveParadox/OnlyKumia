import React, { useState, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import '../Css/Cards.css';
import axios from '../Utils/axios';
import InfoIcon from '@mui/icons-material/Info';
import IconButton from "@mui/material/IconButton";
// import SwipeButtons from './SwipeButtons';


function Cards() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const req = await axios.get('/cards');
      setPeople(req.data);
    }
    fetchData();
  }, [])

  const swiped = (direction, nameToDelete) => {
    if (direction === 'right') {
      // Logic to add the item
      console.log('Adding ' + nameToDelete);
    } else if (direction === 'left') {
      // Logic to delete the item
      console.log('Removing ' + nameToDelete);
    } else {
      // Handle other directions (if needed)
      console.log('Unknown direction: ' + direction);
    }
  };
  

  const outOfFrame = (name) => {
    console.log(name + ' left the screen');
  };

  return (
    <div className="Cards">
      <div className="Card__cardContainer">
        {people.map((person) => (
          <TinderCard
            className="swipe"
            key={person.name}
            preventSwipe={['up', 'down']}
            onSwipe={(dir) => swiped(dir, person.name)}
            onCardLeftScreen={() => outOfFrame(person.name)}
          >
            <div style={{ backgroundImage: `url(${person.imgUrl})` }} className="card">
              <h3>
                {person.name}
                <IconButton>
                  <InfoIcon fontSize="medium" className="header__icon" />
                </IconButton>
              </h3>
            </div>
          </TinderCard>
        ))}
      </div>
     {/* <SwipeButtons
        onLeftSwipe={swipeLeft}
        onRightSwipe={swipeRight}
        onRepeat={goBack}
        /> */}
    </div>
  );
}

export default Cards;
