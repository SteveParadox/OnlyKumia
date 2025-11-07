import React, { useRef, useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  Avatar,
  CssBaseline,
  Box,
  Container,
  FormControlLabel,
  Checkbox,
  Link as MLink
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import MicrosoftIcon from '@mui/icons-material/Microsoft';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import { signInWithPopup } from 'firebase/auth';
import { FirebaseAuth, provider } from './Firebase';
import MicrosoftLogin from './MicrosoftLogin';
import { useAuth } from './Auth';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import axios from '../Utils/axios';
import '../Css/Login.css';

const theme = createTheme();

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {'Copyright © '}
      <MLink color="inherit" href="/">
        OnlyKumia
      </MLink>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const Login = () => {
  const { auth, setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const userRef = useRef(null);
  const errRef = useRef(null);

  const [user, setUser] = useState('');
  const [pwd, setPwd] = useState('');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    setErrMsg('');
  }, [user, pwd]);

  /** -------------------------------
   *  Regular Login (Email + Password)
   *  ------------------------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:8001/login',
        JSON.stringify({ user, pwd }),
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
        }
      );

      const { accessToken, roles, role } = response?.data || {};
      setAuth({ user, roles, accessToken });

      setUser('');
      setPwd('');

      // Redirect based on user role
      if (role === 'creator') navigate('/creator-dashboard', { replace: true });
      else if (role === 'fan') navigate('/fan-dashboard', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      if (!err?.response) setErrMsg('No Server Response');
      else if (err.response?.status === 400) setErrMsg('Missing Username or Password');
      else if (err.response?.status === 401) setErrMsg('Unauthorized');
      else setErrMsg('Login Failed');
      errRef.current.focus();
    }
  };

  /** -------------------------------
   *  Google Login
   *  ------------------------------- */
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(FirebaseAuth, provider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await fetch('http://localhost:8001/auth/google-login', {
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

      const data = await response.json();

      if (data.success) {
        setAuth(data.user);
        // Conditional redirection
        if (data.user.role === 'creator') navigate('/creator-dashboard', { replace: true });
        else if (data.user.role === 'fan') navigate('/fan-dashboard', { replace: true });
        else navigate(from, { replace: true });
      } else {
        console.error('Google Login failed:', data.error);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
    }
  };

  /** -------------------------------
   *  Microsoft Login Handler
   *  ------------------------------- */
  const handleMicrosoftLogin = (loginResponse) => {
    console.log('Microsoft login response:', loginResponse);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />

        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>

          <Typography component="h1" variant="h5">
            Sign In
          </Typography>

          {errMsg && (
            <Typography
              color="error"
              variant="body2"
              align="center"
              ref={errRef}
              sx={{ mt: 1 }}
            >
              {errMsg}
            </Typography>
          )}

          <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={user}
              onChange={(e) => setUser(e.target.value)}
              ref={userRef}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
            />

            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, mb: 1 }}>
              Sign In
            </Button>

            <Grid container spacing={2} justifyContent="center" sx={{ mt: 1 }}>
              <Grid item>
                <Button
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleLogin}
                  color="error"
                >
                
                </Button>
              </Grid>
              <Grid item>
                <MicrosoftLogin onMicrosoftLogin={handleMicrosoftLogin} />
              </Grid>
              <Grid item>
                <Button startIcon={<AppleIcon />} disabled>
                  Apple
                </Button>
              </Grid>
            </Grid>

            <Grid container sx={{ mt: 2 }}>
              <Grid item xs>
                <MLink href="#" variant="body2">
                  Forgot password?
                </MLink>
              </Grid>
              <Grid item>
                <RouterLink to="/entry" style={{ textDecoration: 'none' }}>
                  <MLink variant="body2">{"Don't have an account? Sign Up"}</MLink>
                </RouterLink>
              </Grid>
            </Grid>
          </Box>
        </Box>

        <Copyright sx={{ mt: 8, mb: 4 }} />
      </Container>
    </ThemeProvider>
  );
};

export default Login;
