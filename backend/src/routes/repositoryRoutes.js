import express from "express";
import { indexRepository } from "../controllers/repositoryController.js";

const router = express.Router();
router.post("/index", indexRepository);
export default router;
