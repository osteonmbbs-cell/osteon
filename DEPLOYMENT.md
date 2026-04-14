# Osteon Deployment Guide

This guide will walk you through deploying Osteon securely using Vercel, Firebase, and Google Cloud OAuth.

## 1. Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Navigate to **Firestore Database** and click **Create database** (start in production mode).
3. Go to **Project Settings** > **Service Accounts**.
4. Click **Generate new private key** and download the JSON file. Use these values inside your `.env.local` variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`).

## 2. Google Cloud OAuth Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Firebase project at the top.
3. Open **APIs & Services** > **Credentials**.
4. Click **Create Credentials** -> **OAuth client ID** (Application type: *Web application*).
5. Set the **Authorized redirect URIs** to your production domain: `https://yourdomain.vercel.app/api/auth/callback/google`.
6. Copy the Generated Client ID and Secret to your `.env.local`.

## 3. Vercel Deployment
1. Commit all your code and push it to a new GitHub repository.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New** > **Project** and import your Git repository.
3. In the deployment configuration, add all your variables from `.env.local` to the **Environment Variables** section. Make sure to keep `FIREBASE_PRIVATE_KEY` formatting exactly as standard.

## 4. First Admin Login
1. To bootstrap securely, update the `ADMIN_EMAILS` environment variable strictly in Vercel to contain your admin Gmail address (e.g. `your-email@gmail.com`).
2. Redeploy the environment on Vercel to capture the variable.

## 5. Adding Students
1. Navigate directly to `https://yourdomain.vercel.app/admin` and log in via your newly established admin account.
2. Go to the **Students** tab, type in a student Gmail address and click "Add Verified Student" to whitelist them.

## 6. Adding Tests
1. Create a raw test in Google Forms. Go to form **Settings** -> enable **Make this a quiz** and optionally toggle **Collect email addresses**.
2. **Publish** the form and copy the long display link (`/viewform`).
3. Back in the Osteon Admin panel navigate to **Tests**, log the title, paste the Form URL, and submit.

## 7. Apps Script Setup
1. In your newly created Google Form editor, click the three dots menu (top right) -> **Script editor**.
2. Paste your Webhook Apps Script exactly as outlined in the initial architectural prompt. 
3. Explicitly define the internal script variables `TEST_ID` matching the Document ID auto-generated within the Osteon admin dashboard, and map `WEBHOOK_SECRET` securely to your `.env.local` token.
4. Click on the **Triggers** Alarm Clock icon -> **Add Trigger** -> Event Source: **From form**, Event Type: **On form submit**. Save and authorize.

## 8. Test The Full Flow
- Login End-To-End: Open an incognito tab and follow the student flow to ensure the error rejection functions properly, add the explicit test user into the system, refresh the dashboard, navigate into the Form iFrame and submit dummy results to guarantee the graph plots flawlessly.
