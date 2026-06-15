import express from "express";
import { getJobById, getJobs } from "../controller/jobController.js";
import { scrapeJobs, getScraperStatus } from "../controller/scraperController.js";
import { scrapeRateLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.get('/', getJobs);

router.get('/scraper-status', scrapeRateLimiter, getScraperStatus);

router.post('/scrape', scrapeRateLimiter, scrapeJobs);

// Route to get a single job by ID
router.get('/:id', getJobById);

export default router;