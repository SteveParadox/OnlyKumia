import React, { useRef, useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Checkbox,
  FormControlLabel,
  Avatar,
  Container,
  CssBaseline,
  Link,
  Box,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import AppleIcon from '@mui/icons-material/Apple';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { FirebaseAuth, provider } from '../Auth/Firebase';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../Auth/Auth';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../Utils/axios';
import MicrosoftLogin from '../Auth/MicrosoftLogin';
import '../Css/Login.css';

const defaultTheme = createTheme();

const CreatorSignup = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const userRef = useRef(null);
  const errRef = useRef(null);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm: '',
    fullName: '',
    country: '',
    dob: '',
    gender: '',
    website: '', // honeypot
  });
  const [idFile, setIdFile] = useState(null);
  const [errMsg, setErrMsg] = useState('');
  const [submitDisabled, setSubmitDisabled] = useState(false);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    setErrMsg('');
  }, [form]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size < 10 * 1024 * 1024) {
      setIdFile(file);
    } else {
      setErrMsg('File too large (max 10MB).');
    }
  };

  // compute SHA-256 hash of a file and return hex string
  const computeSHA256 = async (file) => {
    const buf = await file.arrayBuffer();
    const hashBuffer = await (window.crypto || window.msCrypto).subtle.digest('SHA-256', buf);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    // honeypot bot detection
    if (form.website) {
      setErrMsg('Bot detected.');
      return;
    }
    if (submitDisabled) return;
    setSubmitDisabled(true);
    setTimeout(() => setSubmitDisabled(false), 5000);
    const { email, password, confirm, fullName, gender, country, dob } = form;

    if (!email || !password || !fullName) {
      setErrMsg('All required fields must be filled.');
      return;
    }
    if (password !== confirm) {
      setErrMsg('Passwords do not match.');
      return;
    }

    try {
      const data = new FormData();
      data.append('email', email);
      data.append('password', password);
      data.append('fullName', fullName);
      data.append('gender', gender);
      data.append('country', country);
      data.append('dob', dob);
      if (idFile) {
        data.append('idDocument', idFile);
        try {
          const hash = await computeSHA256(idFile);
          data.append('idHash', hash);
        } catch (err) {
          console.warn('Failed to compute id file hash:', err);
        }
      }

      const response = await axios.post('/creator/signup', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      setAuth(response.data?.data?.user);
      navigate('/creator-dashboard', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const messages = {
        409: 'Account already exists.',
        406: 'Invalid input or failed verification.',
        422: 'KYC validation failed.',
        default: 'Signup failed. Please try again.',
      };
      setErrMsg(messages[status] || 'No Server Response');
      errRef.current?.focus();
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(FirebaseAuth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const res = await fetch('/auth/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          displayName: user.displayName,
          email: user.email,
          creator: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAuth(data.user);
        navigate('/creator-dashboard', { replace: true });
      } else {
        setErrMsg('Google signup failed.');
      }
    } catch (error) {
      console.error('Google signup error:', error.message);
      setErrMsg('Google signup error.');
    }
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            mt: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Creator Sign Up
          </Typography>

          <Box component="form" noValidate onSubmit={handleSignup} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="fullName"
              name="fullName"
              label="Full Name"
              value={form.fullName}
              onChange={handleChange}
              autoFocus
              inputRef={userRef}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value={form.password}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirm"
              label="Confirm Password"
              type="password"
              id="confirm"
              value={form.confirm}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              name="country"
              label="Country"
              id="country"
              value={form.country}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              name="dob"
              label="Date of Birth"
              type="date"
              id="dob"
              InputLabelProps={{ shrink: true }}
              value={form.dob}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              name="gender"
              label="Gender"
              id="gender"
              value={form.gender}
              onChange={handleChange}
            />

            <Typography variant="body2" sx={{ mt: 2 }}>
              Upload Government ID (for verification)
            </Typography>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              style={{ marginTop: '0.5rem' }}
            />

            <FormControlLabel
              control={<Checkbox required color="primary" />}
              label="I agree to terms and conditions"
            />

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }}>
              Submit for Verification
            </Button>

            <Grid container justifyContent="center" sx={{ my: 2 }}>
              <Button startIcon={<GoogleIcon />} onClick={handleGoogleSignup}>
                Google
              </Button>
              <MicrosoftLogin
                onMicrosoftLogin={() => console.log('Microsoft signup')}
                icon={<MicrosoftIcon />}
              />
              <Button startIcon={<AppleIcon />}>Apple</Button>
            </Grid>

            <Grid container justifyContent="flex-end">
              <Grid item>
                <Link href="/login" variant="body2">
                  Already verified? Sign in
                </Link>
              </Grid>
            </Grid>
          </Box>
          {errMsg && (
            <Typography ref={errRef} color="error" align="center" sx={{ mt: 2 }}>
              {errMsg}
            </Typography>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 6, mb: 2 }}
          >
            © {new Date().getFullYear()} OnlyKumia
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default CreatorSignup;
