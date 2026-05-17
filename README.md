# Smart Loan V2

Smart Loan V2 is a role-based loan management application for providers, collectors, and customers.

## Tech Stack

- React 19 + TypeScript
- TanStack Router
- Tailwind CSS
- Express + Node.js
- SQLite (better-sqlite3)

## Prerequisites

- Node.js 20+
- npm

## Run Locally

1. Install dependencies
   npm install

2. Start the app
   npm run dev

3. Open your browser
   http://localhost:3000

## Build For Production

1. Build client and server bundles
   npm run build

2. Start production server
   npm run start

## Useful Scripts

- npm run dev: Start development server
- npm run build: Create production build
- npm run start: Run production server
- npm run lint: Type-check project

## Demo Credentials

Super Admin (System Administrator)
- Email: \
- Password: admin123

Demo Accounts (Require Seeding)
- If logged in as Super Admin, trigger Seed Demo Data from the dashboard.
- API endpoint for seeding: /api/admin/seed

Provider Admin (Finance Company Owner)
- Email: provider@demo.com
- Password: provider123

Collector (Field Agent)
- Email: sam@demo.com
- Password: collector123

Customer (Loan Recipient)
- Email: jane@demo.com
- Password: customer123