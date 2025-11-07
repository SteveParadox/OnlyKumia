import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 10, 
    skipSuccessfulRequests: true,
});

export default limiter;
