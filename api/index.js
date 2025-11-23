import app from '../src/server.js';
import { connectDB } from '../src/config/db.js';

// Ensure database connection for serverless
let cachedDb = null;

export default async function handler(req, res) {
  if (!cachedDb) {
    cachedDb = await connectDB();
  }
  
  return app(req, res);
}
