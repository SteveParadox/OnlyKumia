import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LoginPrompt = ({ open, onClose, redirectTo }) => {
  const navigate = useNavigate();

  const goToLogin = () => {
    onClose?.();
    navigate('/login', { state: { from: redirectTo || '/' } });
  };

  const goToSignup = () => {
    onClose?.();
    navigate('/signup');
  };

  return (
    <Dialog open={!!open} onClose={onClose}>
      <DialogTitle>Sign in required</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary">
          You need to be signed in to follow or subscribe to creators. Sign in to continue or create an account.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={goToSignup}>Create account</Button>
        <Button onClick={goToLogin} variant="contained">Sign in</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginPrompt;
