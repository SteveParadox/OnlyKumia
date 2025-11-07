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

const Signup = () => {
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
    country: '',
    gender: '',
    website: '', // honeypot
  });
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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (form.website) {
      setErrMsg('Bot detected.');
      return;
    }
    if (submitDisabled) return;
    setSubmitDisabled(true);
    setTimeout(() => setSubmitDisabled(false), 5000);

    const { email, password, confirm, gender, country } = form;

    if (!email || !password) {
      setErrMsg('Email and password are required.');
      return;
    }
    if (password !== confirm) {
      setErrMsg('Passwords do not match.');
      return;
    }

    try {
      const response = await axios.post(
        '/auth/signUp',
        { email, password, gender, country },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );

      setAuth(response.data?.data?.user);
      navigate(from, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const messages = {
        409: 'Account already exists.',
        406: 'Invalid input.',
        default: 'Signup failed.',
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
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAuth(data.user);
        navigate(from, { replace: true });
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
            Sign Up
          </Typography>

          <Box component="form" noValidate onSubmit={handleSignup} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              name="email"
              label="Email Address"
              autoComplete="email"
              autoFocus
              value={form.email}
              onChange={handleChange}
              inputRef={userRef}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="confirm"
              name="confirm"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              value={form.confirm}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="country"
              name="country"
              label="Country"
              value={form.country}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="gender"
              name="gender"
              label="Gender"
              value={form.gender}
              onChange={handleChange}
            />

            <FormControlLabel
              control={<Checkbox required color="primary" />}
              label="I agree to terms and conditions"
            />

            {/* Hidden honeypot input */}
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              style={{ display: 'none' }}
              autoComplete="off"
              tabIndex={-1}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 1 }}
              disabled={submitDisabled}
            >
              Create Account
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
                  Already have an account? Sign in
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

export default Signup;
