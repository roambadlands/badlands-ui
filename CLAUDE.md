# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Badlands UI is a ChatGPT-like web interface built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. It communicates with a Go backend API at `localhost:8080`, featuring OAuth authentication, real-time SSE streaming, and budget tracking.

## Commands

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run unit tests (Vitest)
npm run test:watch   # Unit tests in watch mode
npm run test:e2e     # Playwright E2E tests
```

## Architecture

### State Management (Hybrid)

- **Server State**: TanStack Query v5 for sessions, messages, budget (caching, auto-refetch)
- **UI State**: Zustand v5 stores in `store/`
  - `chat-store.ts`: streaming state, tool calls, citations
  - `session-store.ts`: active session ID

### API Layer (`lib/api.ts`)

Singleton API client with:
- CSRF token handling (double-submit cookie pattern - reads `csrf_token` cookie, sends value in `X-CSRF-Token` header)
- Automatic token refresh on 401 (prevents duplicate refresh requests)
- Cookie-based auth (`credentials: "include"`)

Backend endpoints at `NEXT_PUBLIC_BACKEND_URL`:
- `/v1/auth/*` - OAuth and session management
- `/v1/sessions/*` - Chat sessions and messages (SSE streaming for responses)
- `/v1/tenant/budget` - Usage tracking

### Streaming (`lib/streaming.ts`)

SSE parser handling event types: `content`, `tool_call_start`, `tool_call_end`, `citation`, `usage`, `done`, `error`

### Route Protection

- `proxy.ts` checks `access_token` cookie (Next.js 16 convention)
- Protected routes: `/chat/*`
- Auth routes redirect to `/chat` if authenticated: `/login`

## Key Patterns

- All interactive components use `"use client"` directive
- TanStack Query hooks in `lib/hooks/` for data fetching
- shadcn/ui components in `components/ui/` (Radix UI based, New York style)
- Path alias: `@/*` maps to project root

## Security

- HttpOnly cookies for auth tokens (no localStorage tokens)
- CSRF protection via double-submit cookie pattern (`csrf_token` cookie is readable by JS)
- CSP headers configured in `next.config.ts`
- Markdown sanitized via `rehype-sanitize` (no scripts/forms)
- Max 32KB per message

## Environment Variables

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
