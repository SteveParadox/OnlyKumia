import React, { useState, useEffect } from "react";
import TinderCard from "react-tinder-card";
import "../Css/Cards.css";
import axios from "../Utils/axios";
import InfoIcon from "@mui/icons-material/Info";
import IconButton from "@mui/material/IconButton";

function Cards() {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const req = await axios.get("/cards");
      setPeople(req.data);
    }
    fetchData();
  }, []);

  const swiped = (dir, name) => {
    if (dir === "right") {
      console.log("Added:", name);
    } else if (dir === "left") {
      console.log("Removed:", name);
    }
  };

  const outOfFrame = (name) => {
    console.log(name + " left the screen");
  };

  return (
    <div className="cards">
      <div className="cards__container">
        {people.map((person) => (
          <TinderCard
            className="cards__swipe"
            key={person.name}
            preventSwipe={["up", "down"]}
            onSwipe={(dir) => swiped(dir, person.name)}
            onCardLeftScreen={() => outOfFrame(person.name)}
          >
            <div
              className="cards__card"
              style={{ backgroundImage: `url(${person.imgUrl})` }}
            >
              <div className="cards__gradient" />

              <div className="cards__footer">
                <h3>{person.name}</h3>

                <IconButton className="cards__infoBtn">
                  <InfoIcon fontSize="medium" />
                </IconButton>
              </div>
            </div>
          </TinderCard>
        ))}
      </div>
    </div>
  );
}

export default Cards;
