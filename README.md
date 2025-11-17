Welcome to **PromptHub**, a TanStack Start-powered playground that turns rough ideas into production-ready prompts for AI application generators.

## Getting Started

```bash
bun install
cp env.example .env # add your real OpenAI key
bun run dev
```

Visit `http://localhost:3000` and start ideating.

## Environment

PromptHub relies on OpenAI for prompt enhancement. Supply your API key via `.env`:

```
OPENAI_API_KEY=sk-your-key-here
```

Restart the dev server whenever you change environment variables.

## Available Scripts

```bash
bun run dev     # Start the Vite dev server
bun run build   # Build for production
bun run preview # Preview the production build
bun run test    # Run Vitest (no domain tests yet)
```

## Tech Stack

- **TanStack Start + TanStack Router** for full-stack React routing and server functions
- **Tailwind CSS v4** for rapid dark-mode styling
- **OpenAI SDK** for prompt enhancement
- **Bun** for package + script management

## Feature Overview

- Dark-mode hero experience highlighting PromptHub
- Input canvas for your raw idea
- Platform selector (Web App, React Native, Native iOS)
- Server function that calls OpenAI (`gpt-4o-mini`) to craft titles, goals, stacks, and edge cases
- Copy-ready output panel

## Troubleshooting

- **429 / insufficient quota** – Your OpenAI account is out of credit. Add funds or move the project to an account with quota, then restart `bun run dev`.
- **401 / invalid key** – The `OPENAI_API_KEY` value is missing or incorrect. Re-create `.env` from `env.example`, paste a valid key, and restart the dev server.
- **Other OpenAI errors** – The UI will surface a concise error message. Most transient issues resolve by retrying after a short wait.

## Next Steps

- Swap in your preferred OpenAI-compatible model provider
- Persist prompt history or favorites
- Add authentication for team workspaces
- Extend platform presets with stack scaffolds
