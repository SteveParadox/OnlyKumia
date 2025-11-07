import React from 'react';
import { Chip, Box, Typography } from '@mui/material';
import { useAuth } from '../Auth/Auth';

// Small verification status component
// Looks for user.verified_creator or user.verification_status
// Accepts optional `status` prop to override.
const VerificationStatus = ({ status: propStatus }) => {
  const { user, auth } = useAuth() || {};
  // prefer explicit prop, then user fields -- use nullish coalescing to avoid mixing with || which causes parser issues
  const raw =
    (propStatus !== undefined && propStatus !== null ? propStatus : undefined) ??
    (user && user.verified_creator !== undefined && user.verified_creator !== null ? user.verified_creator : undefined) ??
    (auth && auth.verified_creator !== undefined && auth.verified_creator !== null ? auth.verified_creator : undefined) ??
    (user && user.verification_status ? user.verification_status : undefined) ??
    (auth && auth.verification_status ? auth.verification_status : undefined);

  let status = 'unverified';
  if (raw === true || String(raw).toLowerCase() === 'verified') status = 'verified';
  else if (String(raw).toLowerCase() === 'pending') status = 'pending';
  else if (String(raw).toLowerCase() === 'flagged' || String(raw).toLowerCase() === 'review') status = 'flagged';

  const mapping = {
    verified: { label: 'Verified Creator', color: 'success' },
    pending: { label: 'Verification Pending', color: 'warning' },
    flagged: { label: 'Verification Flagged', color: 'error' },
    unverified: { label: 'Not Verified', color: 'default' },
  };

  const meta = mapping[status] || mapping.unverified;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Chip label={meta.label} color={meta.color} size="small" />
      <Typography variant="caption" color="text.secondary">
        {status === 'verified' ? 'Good to go' : status === 'pending' ? 'Under review' : status === 'flagged' ? 'Action required' : 'Start verification'}
      </Typography>
    </Box>
  );
};

export default VerificationStatus;
