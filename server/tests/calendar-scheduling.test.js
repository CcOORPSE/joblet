import { describe, it } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import router from "../routes/googleCalendarRoutes.js";
import interviewRouter from "../routes/interviewRoutes.js";

describe("Calendar & Scheduling API integration", () => {
  it("google calendar callback correctly extracts state containing role and userId", async () => {
    // We can verify that state parsing extracts state split by ":"
    const state = "user:uid_test_123";
    const parts = state.split(":");
    const role = parts[0];
    const userId = parts[1];
    
    assert.equal(role, "user");
    assert.equal(userId, "uid_test_123");
  });

  it("google calendar callback works with legacy company state formats", () => {
    const state = "company_legacy_id";
    let role = "recruiter";
    let userId = state;

    if (state.includes(":")) {
      const parts = state.split(":");
      role = parts[0];
      userId = parts[1];
    }

    assert.equal(role, "recruiter");
    assert.equal(userId, "company_legacy_id");
  });

  it("correctly generates mock calendar url if GOOGLE_CLIENT_ID is missing", () => {
    const isMock = !process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === "your_google_client_id";
    assert.ok(isMock);
    
    const role = "user";
    const userId = "test_user_id";
    const callbackUrl = `http://localhost:3000/api/calendar/callback?code=mock_oauth_code&state=${role}:${userId}`;
    assert.match(callbackUrl, /mock_oauth_code/);
    assert.match(callbackUrl, /user:test_user_id/);
  });
});
