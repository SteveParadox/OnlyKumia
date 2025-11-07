import { useState, useEffect } from "react";
import { 
    config, 
    useClient,
    useMicrophoneAndCameraTracks,
    channelName
} 
    from '../Utils/agora.js';
import Grid from '@mui/material/Grid';
import Video from "./Video.js";
import Controls from "./Controls.js";

export default function Stream(props) {
    const {setInCall} = props;
    const [users, setUsers]= useState([])
    const [start, setStart] = useState(false)
    const client = useClient;
    
    const {ready, tracks} =  useMicrophoneAndCameraTracks;
    console.log(ready)
  
    useEffect(()=> {
        let init = async (name) => {
            console.log("daa", name)
            client.on("user-published", async (user, mediaType) =>{
                await client.subscribe(user, mediaType);
                if (mediaType === "video "){
                    setUsers((prevUsers) => {
                        console.log('user', user)
                        return[ ...prevUsers, users];

                    });
                }
                if (mediaType === "audio"){
                    user.audioTrack.Play();
                }
            });

            client.on("user-unpublished", (user, mediaType) => {
            if (mediaType === 'audio'){
                if (user.audioTract) user.audioTrack.stop();
            }
            if (mediaType === "video"){
                setUsers((prevUsers) => {
                    return prevUsers.filter((User) => User.uid !== user.uid);

                });
            }

        });
        client.on("user-left", (user) => {
            setUsers((prevUsers) => {
                return prevUsers.filter((User) => User.uid !== user.uid);
            });
        });
        try {
            await client.join(config.appId, name, config.token, null)
        } catch (error){
            console.log("error");
        }
        if (tracks) await client.publish([tracks[0], tracks[1]]);
            setStart(true);
    };
        if (ready && tracks){
            try{
                init(channelName);
            }catch(error){
                console.log(error );
            }
        }
    }, [client, ready, tracks, users]);

        return (
        <Grid container direction="column" style={{height: "100%"}}>
            <Grid item style={{ height: "5%"}}>
                {ready && tracks && (
                <Controls tracks={tracks} setStart={setStart} setInCall={setInCall}/>
                )}
            </Grid>
            <Grid item style={{ height: "95%"}}>
            {start && tracks && (
                <Video tracks={tracks} users={users} />
                )}
            </Grid>

        </Grid>
        );
}