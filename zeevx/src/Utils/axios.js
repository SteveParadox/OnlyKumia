import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8001'
});

// Optional: attach JSON response parsing and other defaults here if needed
export default instance;