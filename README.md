# Sr-Project

Sr Project by Jayden, Josh, and Kenny. Built with Next.js (create-next-app).

## Getting Started

1. Create `.env.local` in the project root with your OpenAI settings and Firebase web app config:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_optional_measurement_id
```

`OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`.
Firebase persistence is optional at runtime, but required if you want question history,
per-user response storage, and lifetime accuracy reporting.
For the current auth UI, enable both Anonymous and Google providers in Firebase
Authentication.

2. Run the development server:

```bash
npm install
npm run dev
```

3. Open http://localhost:3000 in your browser.

## Tiger Phish Hunt (Repurposed)

The project view now runs as a cybersecurity True/False quiz:

- Topic input tailors generated questions (phishing, ransomware, MFA, etc.).
- Questions are generated server-side through `/api/questions`.
- Each card shows a centered `<h2>` statement with `True` and `False` buttons.
- Use `Next Round` to generate more difficult questions.
- When Firebase is configured, the nav login control supports guest alias sign-in and
  Google sign-in, and quiz sessions are stored per user in
  `users/{uid}/quizSessions/{sessionId}`.
- The top navigation supports guest sign-in with an alias, Google sign-in, and mobile-safe
  account switching indicators.

## Legacy Next.js Notes

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open http://localhost:3000 in your browser to see the app. Edit `app/page.tsx`; the page updates automatically.

## Learn More

- Next.js docs: https://nextjs.org/docs
- Interactive tutorial: https://nextjs.org/learn
- Next.js repo: https://github.com/vercel/next.js

## Deploy

Deploy easily on Vercel: https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme

Deployment docs: https://nextjs.org/docs/app/building-your-application/deploying
