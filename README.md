# Sr-Project

Sr Project by Jayden, Josh, and Kenny. Built with Next.js (create-next-app).

## Getting Started

1. Create `.env.local` in the project root with your OpenAI settings:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`.

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
