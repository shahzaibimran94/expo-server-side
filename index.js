const express = require('express');
const cors = require('cors');
const helmet = require("helmet");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const utils = require('./utils/index');
const timeout = require('connect-timeout')

// Routes
const registerRoutes = require('./routes/register');
const userRoutes = require('./routes/user');

const PORT = 3000;
const app = express();

// DB Connection
utils.db_connect(mongoose);

// Basic Configurations
app.use(timeout('900s'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors());
app.use(helmet());

// End-points
app.use('/api/client', registerRoutes);
app.use('/api/client', userRoutes);

// Express Main Error Handler
app.use(function (error, req, res, next) {
  const { message } = error;
  if (res.headersSent) {
    return next(error);
  }
  res.status(500);
  return res.json({ error: message });
});

app.use(function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
});

app.get('/', (req, res) => {
  res.send('Server Running');
});

process
.on('unhandledRejection', (reason, p) => {
  console.error(reason, 'Unhandled Rejection at Promise', p);
})
.on('uncaughtException', err => {
  console.error(err, 'Uncaught Exception thrown');
  process.exit(1);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});