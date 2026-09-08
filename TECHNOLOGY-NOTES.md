# Pathlight technology discussion

Recorded September 7, 2026. These are recommendations and options discussed, not finalized decisions or implemented features.

## Goals and current state

- Learn professional development technologies and workflows.
- Build a project that supports a strong resume and technical interviews.
- Pathlight currently contains a static HTML/CSS/JavaScript landing page with simulated analytics. It does not yet collect events, authenticate users, or call an AI service.

## Stack recommendations

The initial recommendation was TypeScript in strict mode, React with Next.js App Router, CSS Modules reusing the existing CSS, Next.js Route Handlers, PostgreSQL, and Prisma. Supporting tools: Playwright, GitHub pull requests and Actions, and Docker Compose for a local database.

After discussing Supabase, the recommended starting stack became Next.js + TypeScript + Supabase. Supabase provides PostgreSQL, authentication, storage, and realtime services. Start with its client and version-controlled SQL migrations; Prisma is optional and can be omitted initially. Learn SQL, indexes, aggregations, and customer data isolation directly.

Managed services still provide professional learning opportunities. Running a separate backend and database would add operations practice, but is not required to make this a credible project.

## Hosting options

- Vercel for the Next.js application and Supabase for database/authentication is the recommended initial combination for concentrating on application development.
- Cloudflare Workers + Supabase is an alternative for learning Cloudflare infrastructure and potentially reducing hosting costs.
- Cloudflare's current Next.js guide recommends vinext, a beta implementation of Next.js APIs using Vite; it also documents an OpenNext adapter path. Check compatibility before choosing this deployment approach. Pages is an option for static exports.
- The existing landing page can be hosted statically; full application hosting becomes relevant when backend features are implemented.

Prices checked during the discussion: Vercel Hobby is free within limits for personal noncommercial use; Pro starts at $20/month. Supabase Free includes a 500 MB database and pauses after one week of inactivity; Pro starts at $25/month. Workers has a free tier and a paid starting charge of $5/month. These are starting prices, not total-cost guarantees; usage, extra services, domains, and AI calls can add costs. Each service can be upgraded independently.

## Resume-oriented frontend choice

Recommend React + TypeScript, with Next.js for this project. React is the core UI skill; Next.js builds on it. Angular and Vue are alternatives to consider when target employers request them. Usage surveys provide context, not a count of job vacancies or a guarantee of hiring value.

Prioritize a working analytics feature, accessible responsive UI, tested authorization, SQL reporting, automated checks, and a deployed demo. Resume claims must describe completed work; performance and scale figures should come from measurements.

## Suggested implementation sequence

1. Migrate the existing design to React/Next.js and TypeScript.
2. Build an event ingestion endpoint, persist page views, query daily totals, and show them in a dashboard.
3. Add authentication, website ownership, and tested customer data isolation.
4. Add meaningful browser tests, type checking, production builds, and deployment checks.
5. Add AI explanations of calculated metrics once reporting works.

Defer Redis, Kafka, Kubernetes, and separate services until a concrete requirement justifies them.

## Sources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Prisma PostgreSQL integration](https://docs.prisma.io/docs/prisma-orm/quickstart/postgresql)
- [Playwright](https://playwright.dev/docs/intro)
- [Supabase architecture](https://supabase.com/docs/guides/getting-started/architecture)
- [Supabase pricing](https://supabase.com/pricing)
- [Vercel pricing](https://vercel.com/pricing)
- [Cloudflare Next.js deployment guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [State of JavaScript 2025: frontend frameworks](https://2025.stateofjs.com/en-US/libraries/front-end-frameworks/)
- [State of JavaScript 2025: meta-frameworks](https://2025.stateofjs.com/en-US/libraries/meta-frameworks/)
- [Stack Overflow 2025 technology survey](https://survey.stackoverflow.co/2025/technology)
