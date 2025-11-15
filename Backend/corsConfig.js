// corsConfig.js

const corsOptions = {
  origin: [/\.app\.github\.dev$/, 'http://localhost:3000', 'http://localhost:8001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
  
export default corsOptions;
