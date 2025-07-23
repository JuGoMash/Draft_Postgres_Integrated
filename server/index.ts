import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes'; // Update path if necessary

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', router);

// Health check (optional)
app.get('/', (_req, res) => {
  res.send('🚀 Server is running!');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server is running on port ${PORT}`);
});
