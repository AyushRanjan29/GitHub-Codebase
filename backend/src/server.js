import express from "express";
import cors from "cors";
import "dotenv/config";
import repositoryRoutes from "./routes/repositoryRoutes.js";
import { connectMongoDB } from "./config/mongodb.js";
import searchRoutes from "./routes/searchRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
  }),
);

app.use(express.json());

// Routes
app.use("/api/repository", repositoryRoutes);
app.use("/api/search", searchRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GitHub Codebase backend is running",
  });
});

// API 404 handler
app.use("/api", (req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

connectMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  });
