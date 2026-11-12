
const express = require("express");

const app = express();

// Middleware to read JSON request bodies
app.use(express.json());

// Import routes
const healthRoutes = require("./routes/health.routes");

// Register routes
app.use("/api", healthRoutes);

module.exports = app;
