require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const attendanceRouter = require('./routes/attendance');
const authRouter = require('./routes/auth');

// Validate critical environment variables
const requiredEnv = ['APPS_SCRIPT_WEBHOOK'];
const missingEnv = requiredEnv.filter(k => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Mount API routes under /api
app.use('/api/auth', authRouter);
app.use('/api', attendanceRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  if (!process.env.APPS_SCRIPT_WEBHOOK) {
    console.warn('Warning: APPS_SCRIPT_WEBHOOK is not set in environment. Backend will fail when attempting to persist.');
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.warn('Warning: ADMIN_PASSWORD is not set. Admin routes will be unprotected (INSECURE)!');
  }
});

// health-check root route
app.get('/', (req, res) => {
  res.send('Backend running. API available at /api');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});