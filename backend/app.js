require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const batchRoutes = require("./routes/batchRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const reportRoutes = require("./routes/reportRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
const hasFrontendBuild = fs.existsSync(frontendDistPath);
const parseOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = Array.from(
  new Set([
    ...parseOrigins(process.env.CORS_ORIGIN),
    ...parseOrigins(process.env.CLIENT_URL),
    ...(process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://127.0.0.1:5173"])
  ])
);
const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server and same-origin requests that may not send Origin.
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

  if (allowedOrigins.length > 0) {
    console.log("Allowed CORS origins:", allowedOrigins.join(", "));
  }
}

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "SkillBridge API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api", reportRoutes);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api|health).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
