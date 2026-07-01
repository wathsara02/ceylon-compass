# Ceylon Compass

A directory and submission platform for Sri Lankan restaurants, accommodations, and events. Users submit listings for admin approval; approved listings are browsable publicly by country/city.

## Stack

- **Frontend**: React 19 + Vite, React Router
- **Backend**: Express (Node.js)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (email/password)
- **Images**: Cloudinary (unsigned upload widget, client-side)
- **Email**: Nodemailer via Gmail SMTP (approval/rejection notifications)
- **Deployment**: Vercel (both `frontend/` and `backend/`)

## Project Structure

```
backend/
  config/          Firebase Admin SDK init, email transport config
  middleware/       Firebase ID token verification, admin-role guard
  repositories/     Firestore data-access layer (one file per collection)
  routes/           Express route handlers
  scripts/          One-off scripts (seed admin, seed dummy data)
  utils/            Shared helpers (event cleanup job, creator lookup)
frontend/
  src/
    components/     Reusable UI components
    context/         AuthContext (Firebase session), LocationContext
    lib/             Firebase client SDK init
    pages/           Route-level views
firestore.rules       Firestore security rules (backend-only access via Admin SDK)
firestore.indexes.json Composite indexes required by repository queries
firebase.json         Firebase CLI deploy config
```

## Prerequisites

- Node.js 18+
- A Firebase project with **Firestore** and **Authentication (Email/Password)** enabled
- A [Cloudinary](https://cloudinary.com) account with unsigned upload presets configured (image uploads stay on Cloudinary — Firebase Storage requires the paid Blaze plan)
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) (for sending approval/rejection emails)

## Setup

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Copy the example files and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**`backend/.env`** — Firebase Admin SDK credentials (Project Settings → Service Accounts → Generate new private key), plus Gmail SMTP credentials:

```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
PORT=5001
EMAIL_USER=
EMAIL_PASS=
SEED_ADMIN_EMAIL=admin@ceyloncompass.dummy
SEED_ADMIN_PASSWORD=password123
SEED_ADMIN_USERNAME=admin_dummy
```

**`frontend/.env`** — API base URL and Firebase web app config (Project Settings → General → Your apps → Web app):

```
VITE_API_URL=http://localhost:5001/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 3. Deploy Firestore rules and indexes

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your Firebase project
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Seed initial data

```bash
cd backend
npm run seed:admin   # creates an admin login (see SEED_ADMIN_* env vars above)
npm run seed:dummy   # creates a sample restaurant, event, accommodation, and location list
```

### 5. Run the app

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend runs at `http://localhost:3000`, backend API at `http://localhost:5001/api`.

## Data Model

Firestore collections (see `backend/repositories/` for the exact fields each one uses):

| Collection | Purpose |
|---|---|
| `users` | Profile data (`username`, `email`, `country`, `city`, `role`), keyed by Firebase Auth UID |
| `restaurants` / `events` / `accommodations` | Approved, publicly-listed entries |
| `restaurantreq` / `eventreq` / `accommodationreq` | Pending submissions awaiting admin approval |
| `locations` | Country → city list, doc ID is the country name |
| `messages` | Contact form submissions |
| `notifications` | In-app notifications (approval/rejection, etc.) |

Admin role is stored both as a Firestore field (`role: "admin"`) and a Firebase Auth custom claim, set via `scripts/seedAdmin.js` or by promoting a user manually with the Firebase Admin SDK.

## Auth Flow Notes

- Registration: the frontend creates the Firebase Auth account directly via the client SDK, then calls `POST /api/auth/register-profile` with the ID token to create the Firestore profile (this also enforces username uniqueness and rolls back the Auth account if the username is taken).
- Login: since Firebase Auth only supports email/password (not "username or email"), the frontend first calls `GET /api/auth/resolve-login?identifier=...` to resolve a username to its email, then signs in via the Firebase client SDK.
- Password reset: handled entirely by Firebase's built-in flow (`sendPasswordResetEmail` / `confirmPasswordReset`), not the app's backend.
- All protected API routes verify the Firebase ID token server-side via `middleware/auth.js` and load the matching Firestore profile.

## Known Limitations

- Firebase Storage isn't used (requires the paid Blaze plan) — all image uploads go through Cloudinary's unsigned upload widget instead.
- Firestore composite indexes must be deployed before certain queries work (e.g. filtering approved events by date). If you see a `FAILED_PRECONDITION` error in the backend logs, either click the index-creation link in the error message or run `firebase deploy --only firestore:indexes`.
