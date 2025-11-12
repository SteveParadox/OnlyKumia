import React, { useRef, useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Avatar,
  CssBaseline,
  Box,
  Container,
  FormControlLabel,
  Checkbox,
  Link as MLink,
  Paper,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { signInWithPopup } from 'firebase/auth';
import { FirebaseAuth, provider } from './Firebase';
import MicrosoftLogin from './MicrosoftLogin';
import { useAuth } from './Auth';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import axios from '../Utils/axios';
import '../Css/Login.css';

const theme = createTheme();

const Copyright = () => (
  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
    {'Copyright © '}
    <MLink color="inherit" href="/">
      OnlyKumia
    </MLink>{' '}
    {new Date().getFullYear()}
    {'.'}
  </Typography>
);

const Login = () => {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/home';

  const userRef = useRef(null);
  const errRef = useRef(null);

  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => userRef.current?.focus(), []);
  useEffect(() => setErrMsg(''), [email, pwd]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        '/auth/login',
        { email, password: pwd },
        { headers: { 'Content-Type': 'application/json' }, withCredentials: true }
      );

      const { data } = response;
      const { user, accessToken, role } = data;
      if (!accessToken) throw new Error('No token received');

      setUser({ ...user, accessToken });

      if (role === 'creator') navigate('/creator-dashboard', { replace: true });
      else if (role === 'fan') navigate('/explore', { replace: true });
      else navigate(from, { replace: true });
    } catch (err) {
      if (!err?.response) setErrMsg('Server not responding.');
      else if (err.response?.status === 400) setErrMsg('Missing email or password.');
      else if (err.response?.status === 401) setErrMsg('Invalid credentials.');
      else setErrMsg('Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(FirebaseAuth, provider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const response = await axios.post(
        '/auth/google-login',
        { email: firebaseUser.email, displayName: firebaseUser.displayName },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      const { data } = response;
      setUser(data.user || firebaseUser);
      navigate(data.user?.role === 'creator' ? '/creator-dashboard' : from, { replace: true });
    } catch (error) {
      console.error('Google login failed:', error);
      setErrMsg('Google login failed. Try again.');
    }
  };

  const handleMicrosoftLogin = (loginResponse) => {
    console.log('Microsoft login response:', loginResponse);
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />

        {/* Login Card */}
        <Paper
          component="section"
          elevation={3}
          sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <header>
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign In
            </Typography>
          </header>

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

          {/* Form */}
          <Box
            component="form"
            onSubmit={handleLogin}
            noValidate
            sx={{ mt: 2, width: '100%' }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 2, mb: 1 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          {/* Social Login */}
          <Box component="section" sx={{ mt: 3, width: '100%' }}>
            <Grid container spacing={2} justifyContent="center">
              <Grid item xs={12} sm={4}>
                <Button
                  startIcon={<GoogleIcon />}
                  onClick={handleGoogleLogin}
                  fullWidth
                  color="error"
                  variant="outlined"
                >
                  Google
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <MicrosoftLogin onMicrosoftLogin={handleMicrosoftLogin} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button startIcon={<AppleIcon />} disabled fullWidth variant="outlined">
                  Apple
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Links */}
          <Box component="footer" sx={{ mt: 3, width: '100%' }}>
            <Grid container justifyContent="space-between">
              <Grid item>
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
        </Paper>

        <Copyright />
      </Container>
    </ThemeProvider>
  );
};

export default Login;
