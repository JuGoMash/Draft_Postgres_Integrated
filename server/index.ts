import express from 'express';
import dotenv from 'dotenv';
import { registerRoutes } from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
registerRoutes(app);

app.listen(Number(port), () => {
  console.log(`Server listening on port ${port}`);
});
