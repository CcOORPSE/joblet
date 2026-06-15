import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://xflfaecwzdwhlykjazcl.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmbGZhZWN3emR3aGx5a2phemNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDIxNTExNCwiZXhwIjoyMDk1NzkxMTE0fQ.dkOMp1xiuFCIkhHxeHp5uB_1cvSvqlJma5d8aXFF1hI"
);

async function setupFoloUpTables() {
  console.log("Setting up FoloUp tables in Supabase...");

  // Check if interviewer table already exists by attempting a select
  const { error: checkError } = await supabase.from("interviewer").select("id").limit(1);

  if (checkError && checkError.message.includes("does not exist")) {
    console.log("Tables do not exist. You need to run the SQL schema first.");
    console.log("Go to your Supabase SQL Editor at:");
    console.log("https://supabase.com/dashboard/project/xflfaecwzdwhlykjazcl/sql");
    console.log("And run the contents of FoloUp/supabase_schema.sql");
    console.log("");
    console.log("Attempting to create tables via RPC...");

    // Try creating tables via raw SQL through Supabase's rpc
    const createSQL = `
      -- Create enum type for plan if not exists
      DO $$ BEGIN
        CREATE TYPE plan AS ENUM ('free', 'pro', 'free_trial_over');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS organization (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          name TEXT,
          image_url TEXT,
          allowed_responses_count INTEGER,
          plan plan
      );

      CREATE TABLE IF NOT EXISTS "user" (
          id TEXT PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          email TEXT,
          organization_id TEXT REFERENCES organization(id)
      );

      CREATE TABLE IF NOT EXISTS interviewer (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          agent_id TEXT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          image TEXT NOT NULL,
          audio TEXT,
          empathy INTEGER NOT NULL,
          exploration INTEGER NOT NULL,
          rapport INTEGER NOT NULL,
          speed INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS interview (
          id TEXT PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          name TEXT,
          description TEXT,
          objective TEXT,
          organization_id TEXT,
          user_id TEXT,
          interviewer_id INTEGER,
          is_active BOOLEAN DEFAULT true,
          is_anonymous BOOLEAN DEFAULT false,
          is_archived BOOLEAN DEFAULT false,
          logo_url TEXT,
          theme_color TEXT,
          url TEXT,
          readable_slug TEXT,
          questions JSONB,
          quotes JSONB[],
          insights TEXT[],
          respondents TEXT[],
          question_count INTEGER,
          response_count INTEGER,
          time_duration TEXT
      );

      CREATE TABLE IF NOT EXISTS response (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          interview_id TEXT,
          name TEXT,
          email TEXT,
          call_id TEXT,
          candidate_status TEXT,
          duration INTEGER,
          details JSONB,
          analytics JSONB,
          is_analysed BOOLEAN DEFAULT false,
          is_ended BOOLEAN DEFAULT false,
          is_viewed BOOLEAN DEFAULT false,
          tab_switch_count INTEGER
      );

      CREATE TABLE IF NOT EXISTS feedback (
          id SERIAL PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
          interview_id TEXT,
          email TEXT,
          feedback TEXT,
          satisfaction INTEGER
      );
    `;

    const { error: rpcError } = await supabase.rpc("exec_sql", { sql: createSQL });
    if (rpcError) {
      console.log("RPC exec_sql not available (expected). Trying direct table inserts...");
    }
  } else if (checkError) {
    console.error("Unexpected error checking table:", checkError.message);
  } else {
    console.log("interviewer table already exists!");
  }

  // Now seed interviewers regardless (upsert is safe)
  console.log("Seeding interviewer data...");
  const { error: upsertError } = await supabase.from("interviewer").upsert([
    {
      id: 1,
      name: "Jessica - HR Specialist",
      description: "Focuses on behavioral, rapport-building, and workplace fit questions.",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      agent_id: "agent_hr_mock",
      empathy: 9,
      exploration: 7,
      rapport: 9,
      speed: 6,
    },
    {
      id: 2,
      name: "David - Senior Tech Lead",
      description: "Engages in core technical concepts, systems design, and problem solving.",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150",
      agent_id: "agent_tech_mock",
      empathy: 6,
      exploration: 9,
      rapport: 6,
      speed: 8,
    }
  ]);

  if (upsertError) {
    console.error("Interviewer upsert error:", upsertError.message);
    if (upsertError.message.includes("does not exist")) {
      console.log("\n========================================");
      console.log("ACTION REQUIRED: Create tables manually");
      console.log("========================================");
      console.log("1. Go to: https://supabase.com/dashboard/project/xflfaecwzdwhlykjazcl/sql");
      console.log("2. Copy contents of: FoloUp/supabase_schema.sql");
      console.log("3. Paste and run in the SQL Editor");
      console.log("4. Then re-run this script");
      console.log("========================================\n");
    }
  } else {
    console.log("Interviewers seeded successfully!");
  }

  // Verify
  const { data, error: verifyError } = await supabase.from("interviewer").select("*");
  if (verifyError) {
    console.error("Verify error:", verifyError.message);
  } else {
    console.log("Verified interviewers in DB:", data);
  }
}

setupFoloUpTables();
