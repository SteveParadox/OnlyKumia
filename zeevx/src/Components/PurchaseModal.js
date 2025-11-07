import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, RadioGroup, FormControlLabel, Radio, TextField, Box } from '@mui/material';
import mockPayments from '../Utils/mockPayments';

const PurchaseModal = ({ open, onClose, userId, creatorId, contentId, onSuccess }) => {
  const [mode, setMode] = useState('subscription'); // subscription | ppv | tokens
  const [processing, setProcessing] = useState(false);
  const [amount, setAmount] = useState(9.99);
  const [tokens, setTokens] = useState(100);
  const [msg, setMsg] = useState('');

  const doPurchase = async () => {
    setProcessing(true);
    setMsg('');
    try {
      if(mode === 'subscription'){
        const { orderId } = await mockPayments.createOrder({ userId, type: 'subscription', amount, creatorId });
        await mockPayments.confirmPayment(orderId);
        setMsg('Subscription purchased — access granted for this creator.');
        onSuccess?.({ type: 'subscription', creatorId });
      }
      if(mode === 'ppv'){
        const { orderId } = await mockPayments.createOrder({ userId, type: 'ppv', amount, contentId });
        await mockPayments.confirmPayment(orderId);
        setMsg('Content purchased — you can now access this content.');
        onSuccess?.({ type: 'ppv', contentId });
      }
      if(mode === 'tokens'){
        const { orderId } = await mockPayments.createOrder({ userId, type: 'tokens', amount: tokens/100, tokens });
        await mockPayments.confirmPayment(orderId);
        setMsg('Tokens purchased and added to your balance.');
        onSuccess?.({ type: 'tokens', tokens });
      }
    } catch (err){
      console.error(err);
      setMsg('Purchase failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Purchase</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Choose a purchase option. This is a frontend mock — no real payment is processed.
        </Typography>

        <Box sx={{ mt: 2 }}>
          <RadioGroup row value={mode} onChange={(e)=>setMode(e.target.value)}>
            <FormControlLabel value="subscription" control={<Radio />} label="Monthly subscription" />
            <FormControlLabel value="ppv" control={<Radio />} label="Pay-per-view (single)" />
            <FormControlLabel value="tokens" control={<Radio />} label="Buy tokens" />
          </RadioGroup>
        </Box>

        {mode === 'subscription' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Subscribe to creator</Typography>
            <Typography variant="body2" color="textSecondary">Recurring monthly: <strong>$9.99</strong> (mock)</Typography>
          </Box>
        )}

        {mode === 'ppv' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Pay-per-view</Typography>
            <TextField label="Amount (USD)" type="number" value={amount} onChange={(e)=>setAmount(parseFloat(e.target.value||0))} fullWidth sx={{ mt:1 }} />
          </Box>
        )}

        {mode === 'tokens' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Tokens</Typography>
            <TextField label="Tokens" type="number" value={tokens} onChange={(e)=>setTokens(parseInt(e.target.value||0))} fullWidth sx={{ mt:1 }} />
          </Box>
        )}

        {msg && <Typography sx={{ mt:2 }} color="primary">{msg}</Typography>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={processing}>Cancel</Button>
        <Button variant="contained" onClick={doPurchase} disabled={processing}>{processing ? 'Processing...' : 'Purchase'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseModal;
