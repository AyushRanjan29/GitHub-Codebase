import express from "express";
import { searchCode } from "../controllers/searchController.js";

const router = express.Router();

router.post("/", searchCode);

export default router;
