import app from '../src/server.js';
import { connectDB } from '../src/config/db.js';

// Connect to database once for serverless
connectDB().catch(err => console.error('DB connection error:', err));

// Export the Express app as a serverless function
export default app;
