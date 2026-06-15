import React from "react";

const FirebaseSetupError = ({ message }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
    <div className="max-w-lg w-full bg-white border border-red-100 rounded-2xl shadow-lg p-8">
      <h1 className="text-xl font-bold text-red-600 mb-2">Firebase not configured</h1>
      <p className="text-sm text-slate-600 mb-4">{message}</p>
      <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
        <li>Open Firebase Console → Project settings → Your apps → Web app</li>
        <li>Copy the config into <code className="bg-slate-100 px-1 rounded">client/.env</code></li>
        <li>Restart the client from the <code className="bg-slate-100 px-1 rounded">client</code> folder: <code className="bg-slate-100 px-1 rounded">npm run dev</code></li>
        <li>
          If the key is set but still fails: Google Cloud → Credentials → your API key → allow{" "}
          <code className="bg-slate-100 px-1 rounded">localhost</code> or set Application restrictions to None for dev
        </li>
      </ol>
    </div>
  </div>
);

export default FirebaseSetupError;
