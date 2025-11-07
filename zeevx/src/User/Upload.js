import React, { useState, useEffect, useRef } from 'react';

import "../Css/Upload.css";
import { useParams } from 'react-router-dom';
import axios from '../Utils/axios';
import { FirebaseAuth } from '../Auth/Firebase';

import { Container, Button, Grid, Typography } from '@mui/material';
import Popover from '@mui/material/Popover';
import AppBar from '@mui/material/AppBar';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Link from '@mui/material/Link';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import PreviewIcon from '@mui/icons-material/Preview';

import { useAuth } from '../Auth/Auth';
import LinearProgress from '@mui/material/LinearProgress';


function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        Your Website
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

// Note: backend should provide presigned upload URLs at POST /uploads/presign
// and a completion endpoint at POST /uploads/complete. The frontend will
// PUT to the presigned URL directly and then notify the backend to start
// moderation.

const defaultTheme = createTheme();
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

function Upload() {

  const { auth } = useAuth();
  const [images, setImages] = useState([]);


  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const pollingRefs = useRef({});

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

 


  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  // compute SHA-256 hash of a file and return hex string
  const computeSHA256 = async (file) => {
    const buf = await file.arrayBuffer();
    const hashBuffer = await (window.crypto || window.msCrypto).subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  // Request a presigned URL from backend for a single file upload
  const requestPresign = async (file) => {
    const idToken = await FirebaseAuth.currentUser?.getIdToken?.();
    const res = await axios.post('/uploads/presign', {
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }, {
      headers: { Authorization: idToken ? `Bearer ${idToken}` : undefined }
    });
    return res.data;
  };

  // Upload file via PUT to presigned URL with progress using XHR
  const uploadToPresignedUrl = (file, url, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.responseText || true);
        else reject(new Error(`Upload failed with status ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    });
  };

  // Notify backend that upload is complete so it can start moderation
  const completeUpload = async ({ uploadId, metadata }) => {
    const idToken = await FirebaseAuth.currentUser?.getIdToken?.();
    return axios.post('/uploads/complete', { uploadId, metadata, fileHash: metadata.hash, publicUrl: metadata.url }, {
      headers: { Authorization: idToken ? `Bearer ${idToken}` : undefined }
    });
  };

    const fetchData = async () => {
      try {
        const response = await axios.get(`/uploads/user/${auth.uid}/images`);
        // expect response.data to be array of { id, name, imgUrl, status }
        setImages(response.data || []);
      } catch (error) {
        console.error('Error fetching user images:', error);
      }
    };
  useEffect(() => {
    fetchData();
  }, [auth.uid]); 

  const handleUpload = async () => {
    if (!selectedFile) {
      console.warn('No file selected for upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // compute file hash for evidence pointer
      const fileHash = await computeSHA256(selectedFile);

      // request presigned URL from backend
      let presign;
      try {
        presign = await requestPresign(selectedFile);
      } catch (err) {
        console.warn('Presign request failed, falling back to firebase upload if configured', err.message || err);
      }

      let remoteUrl;
      let uploadId = presign?.uploadId;

      if (presign?.url) {
        // single PUT presigned URL
        await uploadToPresignedUrl(selectedFile, presign.url, (p) => setUploadProgress(p));
        remoteUrl = presign.publicUrl || presign.url.split('?')[0];
      } else {
        // Fallback: if presign not available, attempt original Firebase flow (best-effort)
        try {
          const storageMod = await import('../Auth/Firebase');
          const { storage } = storageMod;
          const { ref: fbRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
          const fileRef = fbRef(storage, `images/${Date.now()}_${selectedFile.name}`);
          const snapshot = await uploadBytes(fileRef, selectedFile);
          remoteUrl = await getDownloadURL(snapshot.ref);
          console.log('Uploaded via Firebase fallback', remoteUrl);
        } catch (err) {
          console.error('Fallback Firebase upload failed:', err);
          throw err;
        }
      }

      // notify backend to start moderation and create record
      const metadata = {
        name: selectedFile.name,
        size: selectedFile.size,
        contentType: selectedFile.type,
        hash: fileHash,
        url: remoteUrl,
      };

      const completeRes = await completeUpload({ uploadId, metadata });

      // optimistic insert into UI with status 'quarantine' or 'pending'
      const record = completeRes.data?.data || completeRes.data || { id: completeRes.data?.id || Date.now(), ...metadata, status: 'pending' };
      setImages((prev) => [record, ...prev]);

      // start polling moderation status
      const uid = record.id;
      if (!pollingRefs.current[uid]) {
        pollingRefs.current[uid] = true;
        (async function pollStatus() {
          try {
            let attempts = 0;
            while (pollingRefs.current[uid] && attempts < 60) {
              const idToken = await FirebaseAuth.currentUser?.getIdToken?.();
              const sres = await axios.get(`/uploads/${uid}/status`, { headers: { Authorization: idToken ? `Bearer ${idToken}` : undefined } });
              const status = sres.data?.status || sres.data;
              setImages((prev) => prev.map((it) => (it.id === uid ? { ...it, status } : it)));
              if (status === 'published' || status === 'flagged' || status === 'rejected') {
                pollingRefs.current[uid] = false;
                break;
              }
              attempts += 1;
              await new Promise((r) => setTimeout(r, 3000));
            }
          } catch (err) {
            console.warn('Polling status failed', err);
            pollingRefs.current[uid] = false;
          }
        })();
      }

      // refresh the list eventually
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      await fetchData();
    }
  };
  

  const handleButtonClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };


  return (
    <>
      <div>
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
        >
          <Container maxWidth="sm" className="upload" style={{ padding: '16px', minWidth: 360 }}>
            <Typography variant="h6" gutterBottom>
              Upload new media
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <Button component="label" variant="contained" startIcon={<CloudUploadIcon />} fullWidth>
                  Choose File
                  <input hidden type="file" accept="image/*,video/*" onChange={handleFileChange} />
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button variant="outlined" color="primary" fullWidth onClick={handleUpload} disabled={!selectedFile || uploading}>
                  {uploading ? 'Uploading...' : 'Start Upload'}
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">{selectedFile ? selectedFile.name : 'No file selected'}</Typography>
                {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />}
              </Grid>
            </Grid>
          </Container>
        </Popover>
      </div>

      <ThemeProvider theme={defaultTheme}>

        <main>
          {/* Hero unit */}
          <Box
            sx={{
              bgcolor: 'background.paper',
              pt: 8,
              pb: 6,
            }}
          >
            <Container maxWidth="sm">
              <Typography
                component="h1"
                variant="h2"
                align="center"
                color="text.primary"
                gutterBottom
              >
                Album 
              </Typography>
              <Typography variant="h5" align="center" color="text.secondary" paragraph>
               
              </Typography>
              <Fab color="secondary" aria-label="add" onClick={handleButtonClick}>
                <AddIcon />
              </Fab>
            </Container>
          </Box>
          <Container sx={{ py: 8 }} maxWidth="md">
            {/* End hero unit */}
            
            <Grid container spacing={4}>
              {images.map((item) => (
                <Grid item key={item.id} xs={12} sm={6} md={4}>
                  <Card
                    sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia component="img" sx={{ pt: '0%' }} src={item.imgUrl} alt={item.name} />
                      {/* status chip */}
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        {item.status === 'published' && <Box component="span" sx={{ bgcolor: 'green', color: 'white', px: 1.2, py: 0.4, borderRadius: 1, fontSize: 12 }}>Published</Box>}
                        {(!item.status || item.status === 'pending' || item.status === 'quarantine') && <Box component="span" sx={{ bgcolor: 'orange', color: 'white', px: 1.2, py: 0.4, borderRadius: 1, fontSize: 12 }}>Pending Review</Box>}
                        {item.status === 'flagged' && <Box component="span" sx={{ bgcolor: 'crimson', color: 'white', px: 1.2, py: 0.4, borderRadius: 1, fontSize: 12 }}>Flagged</Box>}
                        {item.status === 'rejected' && <Box component="span" sx={{ bgcolor: 'gray', color: 'white', px: 1.2, py: 0.4, borderRadius: 1, fontSize: 12 }}>Rejected</Box>}
                      </Box>
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h6" sx={{ fontSize: '14px' }}>
                            {item.name} 
                  </Typography>

                      <Typography>
                        {item.description} {/* Replace with your actual data structure */}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small"><PreviewIcon/></Button>
                      <Button size="small"><EditIcon/></Button>
                      <Button variant="" color="error" size="small">
                      <DeleteForeverIcon/>
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </main>
      {/* Footer */}
      <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
        <Typography variant="h6" align="center" gutterBottom>
          Footer
        </Typography>
        <Typography
          variant="subtitle1"
          align="center"
          color="text.secondary"
          component="p"
        >
          Something here to give the footer a purpose!
        </Typography>
        <Copyright />
      </Box>
      {/* End footer */}
    </ThemeProvider>
    </>
  );
};

export default Upload;