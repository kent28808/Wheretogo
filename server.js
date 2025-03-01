require('dotenv').config();
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const express = require("express");
const PORT = process.env.PORT || 3001;
const routes = require("./routes")
const cors = require('cors');
const app = express();

// Mongoose stuff

const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || "mongodb+srv://kent28808:TestTest@cluster0.z8hx5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const clientOptions = { 
  serverApi: { version: '1', strict: true, deprecationErrors: true }
};

// Initialize MongoDB connection before starting server
const initializeMongoDB = async () => {
  try {
    await mongoose.connect(uri, clientOptions);
    console.log("Connected to MongoDB!");
    return true;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return false;
  }
};

// Middleware
app.use(favicon(path.join(__dirname, 'client/public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.VERCEL_URL, 'https://wheretogo.vercel.app'] // Add your Vercel domain
    : ['http://localhost:3002', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// User context middleware
app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

// Static files middleware
if (process.env.NODE_ENV === "production") {
  // Serve any static files
  app.use(express.static(path.join(__dirname, 'client/build')));
} else {
  app.use(express.static(path.join(__dirname, 'client/public')));
}

// Error logging middleware
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`${req.method} ${req.path} - Status: ${res.statusCode}`);
    if (res.statusCode >= 400) {
      console.error('Response Error:', data);
    }
    originalSend.apply(res, arguments);
  };
  next();
});

// Add this before your routes
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    body: req.body
  });
  next();
});

// API Routes - make sure these come before the catch-all route
app.use('/api/saved', require('./routes/saved'));
app.use('/api', routes);

// Add error handling for 404s
app.use('/api/*', (req, res) => {
  console.log('404 for API route:', req.originalUrl);
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Handle React routing, return all requests to React app
app.get('*', function(req, res) {
  if (process.env.NODE_ENV === "production") {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'client/public', 'index.html'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something broke!',
    details: err.message
  });
});

// Move this before module.exports
const startServer = () => {
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('MongoDB Status:', mongoose.connection.readyState);
      console.log(`🌎 ==> API server now on port ${PORT}!`);
      console.log(`Local: http://localhost:${PORT}/`);
    });

    server.on('error', (error) => {
      console.error('Server startup error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
        process.exit(1);
      }
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server only after MongoDB connects
if (process.env.NODE_ENV !== 'production') {
  initializeMongoDB().then(connected => {
    if (connected) {
      startServer();
    } else {
      console.error('Failed to connect to MongoDB. Not starting server.');
      process.exit(1);
    }
  });
}

module.exports = app;