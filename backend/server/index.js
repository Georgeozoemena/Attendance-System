require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const attendanceRouter = require('./routes/attendance');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Mount API routes under /api
app.use('/api', attendanceRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  if (!process.env.APPS_SCRIPT_WEBHOOK) {
    console.warn('Warning: APPS_SCRIPT_WEBHOOK is not set in environment. Backend will fail when attempting to persist.');
  }
});

// health-check root route
app.get('/', (req, res) => {
  res.send('Backend running. API available at /api');
});