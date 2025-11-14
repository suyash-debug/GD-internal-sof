# Work Documentation Tool

An internal work documentation tool for tracking daily work logs and discussion notes.

## Features

- **Daily Work Logs**: Track daily tasks, time spent, blockers, and plans
- **Discussion Notes**: Log meetings and important conversations (coming soon)
- **Google OAuth**: Secure authentication for company employees
- **Mobile Responsive**: Works on all devices

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Firebase (Firestore + Authentication)
- **Hosting**: Vercel
- **Routing**: React Router

## Setup Instructions

### 1. Install Dependencies

```bash
cd work-docs-app
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing one)
3. Enable **Authentication** > **Google** sign-in provider
4. Enable **Firestore Database** in test mode (or production mode with rules)
5. Get your Firebase config from Project Settings > General > Your apps

### 3. Update Firebase Configuration

Edit `src/services/firebase.js` and replace the placeholder values with your actual Firebase credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Set Up Firestore Security Rules

In Firebase Console > Firestore Database > Rules, add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Daily logs - users can only read/write their own logs
    match /dailyLogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Discussions - all authenticated users can read, only creator can write
    match /discussions/{discussionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
```

## Deployment to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts to deploy

Or connect your GitHub repo to Vercel for automatic deployments.

## Project Structure

```
work-docs-app/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout.jsx
│   │   ├── DailyLogForm.jsx
│   │   └── LogHistory.jsx
│   ├── pages/            # Page components
│   │   ├── Home.jsx
│   │   ├── DailyLogs.jsx
│   │   └── Discussions.jsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.jsx
│   ├── services/         # Firebase configuration
│   │   └── firebase.js
│   ├── App.jsx          # Main app component with routing
│   └── main.jsx         # Entry point
├── public/              # Static assets
└── package.json
```

## Usage

1. Sign in with your Google account
2. Navigate to "Daily Logs" to create a new log entry
3. Fill in your daily activities and save
4. View your log history below the form
5. Discussions feature coming soon!

## Next Steps / Future Enhancements

- [ ] Implement discussions/meeting notes feature
- [ ] Add filtering and search for logs
- [ ] Export logs to PDF/CSV
- [ ] Add team view for managers
- [ ] Add tags/categories for better organization
- [ ] Email notifications for important updates

## License

Internal use only
