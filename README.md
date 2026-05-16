<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2906443a-1305-49f9-8aa4-0dbbd7bb15aa

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


Super Admin (System Administrator)
Email: admin@lendflow.com
Password: admin123
Demo Accounts (Require Seeding)
If you are logged in as the Super Admin, you can navigate to the dashboard and trigger a "Seed Demo Data" action (via the API endpoint /api/admin/seed) to create the following test accounts:
Provider Admin (Finance Company Owner)
Email: provider@demo.com
Password: provider123
Collector (Field Agent)
Email: sam@demo.com
Password: collector123
Customer (Loan Recipient)
Email: jane@demo.com
Password: customer123