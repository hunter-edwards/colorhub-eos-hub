This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Floor / Shift Huddle Dashboard

The `/floor` route is a TV-scaled production-floor dashboard for the daily
shift huddle. It shows 8 station tiles in a 4×2 grid with live status, a
people bench for drag-to-assign, a tasks panel, and a live events feed.
Sub-routes:

- `/floor` — live huddle board (auto-detects 1st / 2nd shift by clock time)
- `/floor/setup` — configure stations, default operators, PM cadence, tasks
- `/floor/handoff` — end-of-shift recap + handoff notes for the next crew
- `/floor/history` — past shift sessions

Phase 1 ships with mocked Knack job data (see `src/server/floor-knack.ts`).
Phase 2 will wire real Knack field IDs into the same view-model layer.

Design + implementation notes:

- Design: `docs/plans/2026-05-07-floor-shift-huddle-design.md`
- Phase 1 plan: `docs/plans/2026-05-07-floor-shift-huddle-plan.md`

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
