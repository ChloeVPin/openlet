<div align="center">
  <picture>
    <img src="https://raw.githubusercontent.com/ChloeVPin/openlet/master/public/og-image.jpg" alt="Openlet Hero Banner" width="100%" />
  </picture>
</div>

<br />

<div align="center">
  <strong>Openlet</strong> is a free, open-source flashcard application featuring spaced repetition. It delivers a premium study experience without a paywall.
</div>

<div align="center">
  <br />
  <a href="https://openletapp.vercel.app">Live Demo</a>
  <span>&nbsp;&nbsp;&bull;&nbsp;&nbsp;</span>
  <a href="#getting-started">Getting Started</a>
  <span>&nbsp;&nbsp;&bull;&nbsp;&nbsp;</span>
  <a href="LICENSE">License</a>
</div>

<br />

<div align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  </a>
  <a href="https://openletapp.vercel.app">
    <img src="https://img.shields.io/badge/deployed-Vercel-000?logo=vercel" alt="Deployed on Vercel" />
  </a>
</div>

<br />

## Features

* **Five study modes:** Engage with Flashcards, Learn (FSRS spaced repetition), Write, Match, and Test environments.
* **Spaced repetition:** Utilize a custom FSRS implementation for highly optimized memory scheduling and retention.
* **AI generation:** Automatically generate flashcards directly from lecture notes or textbooks.
* **Image occlusion:** Create visually engaging cards by hiding specific parts of images.
* **Importing:** Support for direct CSV file uploads and bulk text pasting.
* **Collaboration:** Share sets via public links with built-in visibility toggles.
* **Authentication:** Seamless Google and GitHub sign-in powered by Supabase Auth.
* **Security:** Postgres-backed token bucket rate limiting on all API routes to protect endpoints.

## Technology Stack

| Component | Choice |
| :--- | :--- |
| **Framework** | [TanStack Start](https://tanstack.com/start) (React 19, Server-Side Rendering) |
| **Routing** | [TanStack Router](https://tanstack.com/router) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **Database** | [Postgres](https://postgresql.org) hosted on [Supabase](https://supabase.com) |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team) |
| **Authentication** | [Supabase Auth](https://supabase.com/auth) utilizing SSR cookie sessions |
| **Hosting** | [Vercel](https://vercel.com) |
| **Algorithms** | Custom [FSRS](https://github.com/open-spaced-repetition/fsrs.js) implementation |

## Getting Started

### Prerequisites

Ensure the following tools are installed on your system before proceeding:

* Node.js v20 or higher
* [pnpm](https://pnpm.io) package manager
* A Supabase project (the free tier is fully supported)

### Local Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/ChloeVPin/openlet.git
cd openlet
pnpm install
```

Configure your environment variables:

```bash
cp .env.example .env
```

Open the `.env` file and populate the `DATABASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` fields with your Supabase credentials.

Push the database schema and apply RLS policies:

```bash
pnpm drizzle-kit push
node --env-file=.env scripts/apply-migration.mjs
```

Start the development server:

```bash
pnpm dev
```

Navigate to `http://localhost:3000` in your browser.

### Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Yes | Postgres connection string (Supabase pooler port 6543) |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL from API settings |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous public key from API settings |
| `VITE_SITE_URL` | No | Your deployment URL (defaults to Vercel preview environments) |
| `NODE_ENV` | No | Target environment (development or production) |

### Configuring OAuth Providers

To enable Google or GitHub authentication:

1. Navigate to the **Authentication > Providers** section in your Supabase dashboard.
2. Enable Google and GitHub.
3. Input the OAuth client ID and secret from each respective provider's developer console.
4. Set the callback redirect URL to: `https://your-domain.co/auth/callback`

### Password Reset Emails

Supabase provides a built-in email service out of the box for development purposes. For production deployments, configure a custom SMTP provider such as Resend or SendGrid within the **Supabase > Authentication > Email Templates** dashboard.

## Project Architecture

```
src/
├── components/        # React components (UI primitives, study chrome, flashcards)
│   └── ui/            # Base UI primitives (button, input, dialog, tooltip, etc.)
├── lib/
│   ├── auth/          # Supabase Auth actions (signup, signin, signout, middleware)
│   ├── supabase/      # Supabase SSR client (server + browser configuration)
│   └── actions/       # Server functions (sets, study, preferences, sharing)
├── routes/            # TanStack Router file-based route definitions
│   ├── api/           # API endpoints (dashboard, card metadata, sets, search)
│   └── set.$id.*      # Study mode controllers (flashcards, learn, write, match, test)
├── router.tsx         # Router configuration and registry
└── start.ts           # TanStack Start entry point

lib/
├── db/                # Database schema definitions and connection pooling
├── fsrs.ts            # FSRS spaced repetition algorithm logic
└── types.ts           # Shared TypeScript types and interfaces

drizzle/               # Database migration states
public/                # Static assets (logos, icons, banner images)
scripts/               # Utility scripts (logo generation, schema migration, test seeding)
tests/                 # Comprehensive unit, security, and integration test suites
```

## Contributing

Openlet is fully open source. Pull requests are welcome and appreciated.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-capability`
3. Commit your changes: `git commit -m 'Add new capability'`
4. Push to the branch: `git push origin feature/new-capability`
5. Open a pull request against the master branch

## License

MIT License. See the LICENSE file for more details.
