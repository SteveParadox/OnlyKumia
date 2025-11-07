import React, { useState, useRef } from 'react';
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';

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

const KYCForm = ({ onSubmit, isLoading, error }) => {
  const [form, setForm] = useState({
    fullName: '',
    dateOfBirth: '',
    country: '',
    documentType: '',
    documentNumber: '',
    documentExpiry: '',
  });
  
  const [files, setFiles] = useState({
    idDocument: null,
    selfie: null,
  });

  const [preview, setPreview] = useState({
    idDocument: null,
    selfie: null,
  });

  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: uploadedFiles } = e.target;
    if (uploadedFiles?.[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: uploadedFiles[0]
      }));
      
      // Create preview URL
      const url = URL.createObjectURL(uploadedFiles[0]);
      setPreview(prev => ({
        ...prev,
        [name]: url
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.idDocument || !files.selfie) {
      alert('Please upload both ID document and selfie');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    Object.entries(files).forEach(([key, file]) => {
      if (file) formData.append(key, file);
    });

    onSubmit(formData);
  };

  return (
    <Card>
      <CardContent>
        <Box component="form" ref={formRef} onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Identity Verification
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="fullName"
                label="Full Legal Name"
                value={form.fullName}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                name="dateOfBirth"
                label="Date of Birth"
                InputLabelProps={{ shrink: true }}
                value={form.dateOfBirth}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="country"
                label="Country of Residence"
                value={form.country}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Document Type</InputLabel>
                <Select
                  name="documentType"
                  value={form.documentType}
                  onChange={handleChange}
                  label="Document Type"
                >
                  <MenuItem value="passport">Passport</MenuItem>
                  <MenuItem value="national_id">National ID</MenuItem>
                  <MenuItem value="drivers_license">Driver's License</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="documentNumber"
                label="Document Number"
                value={form.documentNumber}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                name="documentExpiry"
                label="Document Expiry Date"
                InputLabelProps={{ shrink: true }}
                value={form.documentExpiry}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                component="label"
                variant="outlined"
                fullWidth
                sx={{ height: '100%' }}
              >
                Upload ID Document
                <VisuallyHiddenInput
                  type="file"
                  name="idDocument"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </Button>
              {preview.idDocument && (
                <Box mt={1}>
                  <img
                    src={preview.idDocument}
                    alt="ID Preview"
                    style={{ maxWidth: '100%', maxHeight: '100px' }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Button
                component="label"
                variant="outlined"
                fullWidth
                sx={{ height: '100%' }}
              >
                Upload Selfie
                <VisuallyHiddenInput
                  type="file"
                  name="selfie"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </Button>
              {preview.selfie && (
                <Box mt={1}>
                  <img
                    src={preview.selfie}
                    alt="Selfie Preview"
                    style={{ maxWidth: '100%', maxHeight: '100px' }}
                  />
                </Box>
              )}
            </Grid>

            {error && (
              <Grid item xs={12}>
                <Alert severity="error">{error}</Alert>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Submit for Verification'
                )}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default KYCForm;