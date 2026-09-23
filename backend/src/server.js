import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import repositoryRoutes from "./routes/repositoryRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.use(express.json());

// Routes
app.use("/api/repository", repositoryRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GitHub Codebase RAG backend is running",
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
