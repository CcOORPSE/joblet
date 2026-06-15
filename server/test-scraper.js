/**
 * Test script for job scraper integration
 * Run with: node test-scraper.js
 */

import './config/loadEnv.js';
import { runJobScraper, checkPythonEnvironment } from './services/jobScraperService.js';

console.log('========================================');
console.log('Job Scraper Integration Test');
console.log('========================================\n');

async function testScraperIntegration() {
  try {
    // Step 1: Check Python environment
    console.log('Step 1: Checking Python environment...');
    const pythonStatus = await checkPythonEnvironment();
    
    if (pythonStatus.available) {
      console.log('✓ Python is available:', pythonStatus.version);
    } else {
      console.log('✗ Python is not available:', pythonStatus.message);
      console.log('\nPlease install Python 3.11+ and add it to your PATH');
      return;
    }
    console.log();

    // Step 2: Check Supabase configuration
    console.log('Step 2: Checking Supabase configuration...');
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('✓ Supabase URL:', process.env.SUPABASE_URL);
      console.log('✓ Supabase Service Role Key: [CONFIGURED]');
    } else {
      console.log('✗ Supabase is not configured');
      console.log('\nPlease set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
      return;
    }
    console.log();

    // Step 3: Check LLM API Key
    console.log('Step 3: Checking LLM API Key...');
    if (process.env.LLM_API_KEY || process.env.GEMINI_API_KEY) {
      console.log('✓ LLM API Key: [CONFIGURED]');
    } else {
      console.log('⚠ LLM API Key not configured (optional for basic scraping)');
    }
    console.log();

    // Step 4: Run test scrape
    console.log('Step 4: Running test scrape...');
    console.log('Query: "software developer"');
    console.log('Location: "Singapore"');
    console.log('Limit: 2 jobs per source');
    console.log('\nThis may take 30-60 seconds...\n');

    const result = await runJobScraper('software developer', 'Singapore', 2);

    console.log('========================================');
    console.log('Scraping Result:');
    console.log('========================================');
    console.log('Success:', result.success);
    console.log('New Jobs Found:', result.newJobs);
    console.log('Query:', result.query);
    console.log('Location:', result.location);
    console.log('Sources:', result.sources?.join(', ') || 'N/A');
    
    if (result.message) {
      console.log('Message:', result.message);
    }
    
    console.log('\n✓ Test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Check your Supabase dashboard to see the scraped jobs');
    console.log('2. Test the API endpoint: POST http://localhost:3000/api/jobs/scrape');
    console.log('3. Integrate the scraper button in your frontend');

  } catch (error) {
    console.error('\n✗ Test failed with error:');
    console.error('Message:', error.message || error);
    if (error.error) {
      console.error('Details:', error.error);
    }
    
    console.log('\nTroubleshooting:');
    console.log('1. Ensure Python dependencies are installed: cd job-scraper && pip install -r requirements.txt');
    console.log('2. Verify your .env configuration');
    console.log('3. Check that Supabase tables are created (run init.sql)');
    console.log('4. See INTEGRATION_GUIDE.md for detailed setup instructions');
  }
}

// Run the test
testScraperIntegration();
