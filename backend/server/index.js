require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const attendanceRouter = require('./routes/attendance');
const authRouter = require('./routes/auth');
const messagesRouter = require('./routes/messages');
const eventsRouter = require('./routes/events');
const analyticsRouter = require('./routes/analytics');
const testimoniesRouter = require('./routes/testimonies');
const membersRouter = require('./routes/members');
const prayerRouter = require('./routes/prayer');
const departmentsRouter = require('./routes/departments');

// Warn about optional environment variables
if (!process.env.APPS_SCRIPT_WEBHOOK) {
  console.warn('Warning: APPS_SCRIPT_WEBHOOK is not set. Google Sheets sync will be disabled.');
}

const app = express();

// Restrict CORS to known origins
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain and render.com (for internal calls)
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      /\.onrender\.com$/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(bodyParser.json({ limit: '2mb' }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Mount API routes under /api
app.use('/api/auth', authRouter);
app.use('/api', attendanceRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/events', eventsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/testimonies', testimoniesRouter);
app.use('/api/members', membersRouter);
app.use('/api/prayer', prayerRouter);
app.use('/api/departments', departmentsRouter);

const { dbReady } = require('./database');
const PORT = process.env.PORT || 4000;

dbReady.then(() => {
  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('Warning: ADMIN_PASSWORD is not set. Admin routes will be unprotected (INSECURE)!');
    }
  });
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