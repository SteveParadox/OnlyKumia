import { useState } from "react";
import Button from '@mui/material/Button';
import Stream from './Stream';

function VideoCallComponent(){
  const [inCall, setInCall] = useState(false);


  return (
    <div className="App" style={{ height: "100%" }}>
      {inCall ? (
        <Stream setInCall={setInCall} />
      ) : (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setInCall(true)}
        >
          Join Call
        </Button>
      )}
    </div>
  );
}



export default VideoCallComponent;
