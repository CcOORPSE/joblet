import { runJobScraper, checkPythonEnvironment } from '../services/jobScraperService.js';
import { db } from '../config/firebaseAdmin.js';

/**
 * Scrape jobs on-demand using the Python scraper
 * POST /api/jobs/scrape
 * Body: { query: "software developer", location: "Singapore", limit: 2 }
 */
export const scrapeJobs = async (req, res) => {
  try {
    const { location, limit: rawLimit } = req.body;
    const query = req.body.query || req.body.title;
    const limit = Math.min(Math.max(Number(rawLimit) || 2, 1), 10);

    // Validate required parameters
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "Query/Title parameter is required",
        newJobs: 0,
      });
    }

    if (query.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Query/Title must be 100 characters or fewer",
        newJobs: 0,
      });
    }

    console.log(`Starting job scrape: query="${query}", location="${location || 'Singapore'}", limit=${limit}`);

    // Run the Python scraper
    const result = await runJobScraper(
      query,
      location || 'Singapore',
      limit
    );

    console.log(`Scraping completed: ${result.newJobs} new jobs found`);

    let savedCount = 0;
    if (result.success && result.jobs && result.jobs.length > 0) {
      console.log(`Saving ${result.jobs.length} jobs to Firestore...`);

      // Fetch existing job_ids to avoid duplicates in this run
      const existingSnap = await db.collection("jobs").where("isScraped", "==", true).get();
      const existingJobIds = new Set();
      existingSnap.forEach(doc => {
        const d = doc.data();
        if (d.job_id) existingJobIds.add(String(d.job_id));
      });

      for (const scrapedJob of result.jobs) {
        try {
          const jobIdStr = String(scrapedJob.job_id);
          // Skip if already exists
          if (existingJobIds.has(jobIdStr)) {
            console.log(`Skipping duplicate job_id: ${jobIdStr}`);
            continue;
          }

          const externalLink = scrapedJob.provider === "linkedin"
            ? `https://www.linkedin.com/jobs/view/${scrapedJob.job_id}`
            : `https://www.mycareersfuture.gov.sg/job/${scrapedJob.job_id}`;

          const newJob = {
            title: scrapedJob.job_title || "Job Listing",
            description: scrapedJob.description || "No description available.",
            location: (scrapedJob.location || location || "Singapore").trim(),
            salary: 0, // Negotiable
            level: scrapedJob.level || "Intermediate",
            category: query,
            date: Date.now(),
            visible: true,
            isScraped: true,
            job_id: jobIdStr,
            externalLink: externalLink,
            companyIdDetails: {
              name: scrapedJob.company || "Premium Recruiter",
              image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=200"
            }
          };

          // Save to Firestore jobs collection
          await db.collection("jobs").add(newJob);
          existingJobIds.add(jobIdStr); // prevent duplicates within this batch
          savedCount++;
        } catch (saveError) {
          console.error("Failed to save scraped job to Firestore:", saveError);
        }
      }
    }

    res.json({
      success: true,
      newJobs: savedCount,
      query,
      location: location || 'Singapore',
      sources: result.sources || []
    });
  } catch (error) {
    console.error('Error in scrapeJobs controller:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || "Failed to scrape jobs",
      error: error.error || error.message,
      newJobs: 0,
    });
  }
};

/**
 * Check Python environment status
 * GET /api/jobs/scraper-status
 */
export const getScraperStatus = async (req, res) => {
  try {
    const pythonStatus = await checkPythonEnvironment();
    
    res.json({
      success: true,
      python: pythonStatus,
      firebase: {
        configured: true,
        url: "Firestore jobs collection active"
      },
      ready: pythonStatus.available
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check scraper status",
      error: error.message
    });
  }
};
