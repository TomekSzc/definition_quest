# Definition Quest

> A memory-match web application that turns any text into an engaging flash-card style game powered by AI.

Definition Quest helps students, educators and lifelong learners master definitions faster. Paste your notes or add term–definition pairs manually and play a desktop-friendly memory game that tracks your time and progress. Boards can be shared publicly, stored in your account and regenerated anytime.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started Locally](#getting-started-locally)
3. [Available Scripts](#available-scripts)
4. [Project Scope](#project-scope)
5. [Project Status](#project-status)
6. [License](#license)

---

## Tech Stack

### Front-end

- **Astro 5** – lightning-fast static-first framework
- **React 19** – interactive components when required
- **TypeScript 5** – type-safe development & better DX
- **Tailwind CSS 4** – utility-first styling
- **Shadcn/ui** – accessible React component collection

### Back-end

- **Supabase** – PostgreSQL database, authentication & edge functions

### AI Layer

- **Openrouter.ai** – unified access to multiple LLM providers (OpenAI, Anthropic, Google …) with quota management

### Tooling & Dev Ops

- **Node 22.14.0** (see `.nvmrc`)
- **ESLint**, **Prettier**, **Husky** & **lint-staged** – code quality
- **GitHub Actions** – CI / CD pipelines
- **Docker + DigitalOcean** – production hosting

---

## Getting Started Locally

### Prerequisites

1. **Node 22.14.0** & npm ≥ 10 (or pnpm / yarn)
2. A Supabase project (URL & service role key)
3. An Openrouter.ai API key

### Installation

```bash
# 1. Clone repository
$ git clone https://github.com/<your-org>/definition-quest.git
$ cd definition-quest

# 2. Install dependencies
$ npm install

# 3. Configure environment variables
$ cp .env.example .env
# then fill in SUPABASE_URL, SUPABASE_ANON_KEY, OPENROUTER_API_KEY, …

# 4. Start dev server
$ npm run dev
```

The app will be available at `http://localhost:4321` (default Astro port).

### Building for production

```bash
# Generate optimized client & server output
$ npm run build

# Preview the production build locally
$ npm run preview
```

---

## Available Scripts

| Script            | Purpose                                                    |
|-------------------|------------------------------------------------------------|
| `npm run dev`     | Start Astro in development mode with hot reloading         |
| `npm run build`   | Generate static client & server output                     |
| `npm run preview` | Preview the production build locally                       |
| `npm run astro`   | Expose the underlying Astro CLI                            |
| `npm run lint`    | Run ESLint on the entire codebase                          |
| `npm run lint:fix`| Auto-fix lint issues where possible                        |
| `npm run format`  | Format all supported files with Prettier                   |

---

## Project Scope

### MVP Features

- **Board creation**  
  • Paste up to 5 000 chars of text and let AI extract up to 24 term-definition pairs  
  • Manually add / edit / delete pairs with validation (16 / 24 cards limit)  
- **Memory-match gameplay**  
  • Desktop-only board, select max 2 cards at a time  
  • Correct pairs disappear, timer stops when board is cleared  
  • Page refresh resets the board & timer (anti-cheat)  
- **User accounts** – registration & login via Supabase Auth (OAuth / JWT)
- **Results storage** – completion times saved to Postgres
- **Public boards** – browse, search & solve other users’ boards
- **AI usage limits** – 50 generations per user per day
- **Analytics** – Google Analytics events (`create_board`, `solve_board`, `time_spent`) with GDPR consent banner & IP anonymization
- **Basic accessibility** – proper contrast, focus rings, ARIA labels, full keyboard navigation
- **i18n-ready** – English hard-coded for MVP, JSON structure prepared for future locales

### Out of Scope (MVP)

- Mobile gameplay & full responsive layout
- Teacher / student roles & advanced permissions
- Content moderation & board versioning
- Advanced WCAG compliance beyond the basics
- Paid AI models (initial phase uses free tier)

---

## Project Status

🚧 **MVP in active development** – core gameplay and board generation are functional, remaining features are tracked in the [issue tracker](../../issues). Contributions & feedback are welcome!

Planned milestones:

- [ ] User profile & stats page
- [ ] Public board browsing with filters
- [ ] Dockerised production deployment

---

## License

This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.
