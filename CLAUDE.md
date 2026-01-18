# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Badlands UI is a ChatGPT-like web interface built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. It communicates with a Go backend API at `localhost:8080`, featuring OAuth authentication, real-time SSE streaming, and budget tracking.

## Commands

This project uses a Makefile for common tasks. Run `make help` to see all targets.

```bash
make dev             # Start development server (port 3000)
make build           # Production build
make lint            # ESLint check
make test            # Run unit tests (Vitest)
make test-watch      # Unit tests in watch mode
make test-e2e        # Playwright E2E tests
make test-all        # Run all tests (unit + e2e)
make clean           # Remove build artifacts
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

## Browser Testing with Agent Browser (MCP)

The `chrome-devtools` MCP server provides browser automation tools for visually testing UI changes. Use these tools to verify UI implementations without requiring manual testing.

### When to Use

- After making UI/component changes to verify they render correctly
- Testing interactive elements (buttons, forms, navigation)
- Debugging visual issues or layout problems
- Verifying responsive behavior

### Key Tools

| Tool | Purpose |
|------|---------|
| `navigate_page` | Navigate to a URL (use `http://localhost:3000` for dev) |
| `take_snapshot` | Get page content as accessible text (preferred over screenshots) |
| `take_screenshot` | Capture visual screenshot of page or element |
| `click` | Click on elements by their `uid` from snapshot |
| `fill` | Fill form inputs/textareas by `uid` |
| `hover` | Hover over elements to trigger hover states |
| `list_console_messages` | Check for console errors/warnings |
| `list_network_requests` | Inspect API calls |

### Typical Workflow

1. **Navigate**: `navigate_page` to `http://localhost:3000` (or specific route)
2. **Snapshot**: `take_snapshot` to get element UIDs and page structure
3. **Interact**: Use `click`, `fill`, `hover` with UIDs from snapshot
4. **Verify**: Take another snapshot or screenshot to confirm changes
5. **Debug**: Check `list_console_messages` for errors if something fails

### Best Practices

- Always take a fresh snapshot before interacting (UIDs change between page loads)
- Prefer `take_snapshot` over `take_screenshot` for understanding page structure
- Use `list_console_messages` to catch JavaScript errors after interactions
- The dev server (`npm run dev`) must be running for browser testing
