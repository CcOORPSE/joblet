import express from "express";
import { getActivityFeed } from "../controller/activityController.js";

const router = express.Router();

router.get("/", getActivityFeed);

export default router;
