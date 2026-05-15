// Vercel serverless entry — wraps the Express app as a single handler.
// `app` does NOT call listen() when running under Vercel; see ../src/server.js.
import app from '../src/server.js';
export default app;
