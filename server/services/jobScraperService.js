import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/firebaseAdmin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fetch all existing job_ids from Firestore to pass to the scraper
 */
const getExistingJobIds = async () => {
  try {
    const snapshot = await db.collection("jobs").get();
    const ids = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.job_id) {
        ids.push(String(data.job_id));
      }
    });
    return ids;
  } catch (error) {
    console.error("Error fetching existing job IDs from Firestore:", error);
    return [];
  }
};

/**
 * Execute the Python job scraper script
 * @param {string} query - Job search query (e.g., "software developer")
 * @param {string} location - Location for search (e.g., "Singapore")
 * @param {number} limit - Maximum number of jobs to scrape per source
 * @returns {Promise<Object>} - Scraping result with success status and job count
 */
export const runJobScraper = (query, location = 'Singapore', limit = 2) => {
  return new Promise((resolve, reject) => {
    const scraperPath = path.join(__dirname, '..', 'job-scraper', 'scrape_on_demand.py');
    
    // Spawn Python process with arguments
    const pythonProcess = spawn('python', [
      scraperPath,
      '--query', query,
      '--location', location,
      '--limit', limit.toString()
    ]);

    let outputData = '';
    let errorData = '';

    // Pass existing job IDs from Firestore to the Python scraper via stdin
    getExistingJobIds().then(existingIds => {
      try {
        pythonProcess.stdin.write(JSON.stringify(existingIds));
      } catch (err) {
        console.error("Error writing to python process stdin:", err);
      } finally {
        pythonProcess.stdin.end();
      }
    }).catch(err => {
      console.error("Failed to query existing job IDs:", err);
      pythonProcess.stdin.end();
    });

    // Collect stdout data
    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    // Collect stderr data
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
      console.error(`Python scraper stderr: ${data}`);
    });

    // Handle process completion
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python scraper exited with code ${code}`);
        console.error(`Error output: ${errorData}`);
        
        return reject({
          success: false,
          message: `Scraper failed with exit code ${code}`,
          error: errorData,
          newJobs: 0
        });
      }

      try {
        // Parse the JSON output from Python script
        const result = JSON.parse(outputData);
        resolve(result);
      } catch (parseError) {
        console.error('Failed to parse scraper output:', outputData);
        reject({
          success: false,
          message: 'Failed to parse scraper output',
          error: parseError.message,
          newJobs: 0
        });
      }
    });

    // Handle process errors
    pythonProcess.on('error', (error) => {
      console.error('Failed to start Python scraper:', error);
      reject({
        success: false,
        message: 'Failed to start Python scraper. Ensure Python is installed.',
        error: error.message,
        newJobs: 0
      });
    });
  });
};

/**
 * Check if Python and required dependencies are available
 * @returns {Promise<Object>} - Status of Python environment
 */
export const checkPythonEnvironment = () => {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', ['--version']);
    
    let versionOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      versionOutput += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      versionOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          available: true,
          version: versionOutput.trim(),
          message: 'Python is available'
        });
      } else {
        resolve({
          available: false,
          message: 'Python is not available or not in PATH'
        });
      }
    });
    
    pythonProcess.on('error', () => {
      resolve({
        available: false,
        message: 'Python is not installed or not in PATH'
      });
    });
  });
};
