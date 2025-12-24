# Badlands UI

A production-grade, security-hardened ChatGPT-like web UI built with Next.js App Router.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Badlands UI                             │
│                   (Next.js Frontend)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Login     │  │   Chat      │  │   Auth Callback     │ │
│  │   Page      │  │   Page      │  │   Page              │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│  ┌──────▼────────────────▼─────────────────────▼──────────┐ │
│  │                    API Client                          │ │
│  │               (lib/api.ts)                             │ │
│  └─────────────────────────┬──────────────────────────────┘ │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ HTTP/SSE
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Badlands Backend                           │
│                   (Go REST API)                              │
├─────────────────────────────────────────────────────────────┤
│  - OAuth Authentication (Google, Discord, Apple)             │
│  - Session/Message Persistence (PostgreSQL)                  │
│  - LLM Streaming (OpenAI)                                   │
│  - MCP Tool Integration                                      │
│  - Budget Tracking                                           │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (UI state) + TanStack Query (server state)
- **Streaming**: Server-Sent Events (SSE)
- **Testing**: Vitest (unit) + Playwright (E2E)

## Security Model

### Authentication
- OAuth 2.0 via backend (Google, Discord, Apple)
- JWT tokens stored in HttpOnly, Secure, SameSite cookies (set by backend)
- Automatic token refresh on 401 responses
- No tokens stored in localStorage

### Content Security
- Strict CSP headers configured in `next.config.ts`
- All markdown output sanitized with rehype-sanitize
- No raw HTML allowed in markdown
- URLs validated before rendering as links
- Code blocks rendered safely with syntax highlighting

### Input Validation
- Maximum message length: 32KB
- All inputs validated before sending to backend

### Headers Applied
- `Content-Security-Policy`: Strict policy allowing only self and backend
- `X-Frame-Options`: DENY
- `X-Content-Type-Options`: nosniff
- `Strict-Transport-Security`: max-age=63072000
- `Referrer-Policy`: strict-origin-when-cross-origin

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Backend URL (badlands-backend)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080

# Frontend URL (for OAuth redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Started

### Prerequisites
- Node.js 18+
- Running badlands-backend instance

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Testing

### Unit Tests

```bash
# Run unit tests
npm test

# Run with watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

## How Streaming Works

1. User sends a message via `ChatInput`
2. Message is sent to backend via SSE stream
3. `lib/streaming.ts` parses SSE events:
   - `content`: Token chunks appended to response
   - `tool_call_start`: Tool invocation begins
   - `tool_call_end`: Tool completes with output/error
   - `citation`: Source attribution added
   - `usage`: Token consumption tracked
   - `done`: Stream completed
   - `error`: Error handling
4. Zustand store (`store/chat-store.ts`) manages streaming state
5. UI updates in real-time as content arrives
6. Stop button aborts the stream via `AbortController`

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── auth/callback/      # OAuth callback handler
│   ├── chat/              # Chat interface
│   │   └── [sessionId]/   # Session-specific chat
│   ├── login/             # Login page
│   ├── layout.tsx         # Root layout with providers
│   └── providers.tsx      # React Query + Auth providers
├── components/
│   ├── chat/              # Chat-specific components
│   │   ├── chat-input.tsx
│   │   ├── code-block.tsx
│   │   ├── message-item.tsx
│   │   ├── message-list.tsx
│   │   ├── tool-call.tsx
│   │   └── citation.tsx
│   ├── layout/            # Layout components
│   │   ├── chat-layout.tsx
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── api.ts             # API client
│   ├── auth.ts            # Auth helpers
│   ├── auth-context.tsx   # Auth React context
│   ├── hooks/             # TanStack Query hooks
│   ├── markdown.ts        # Markdown sanitization
│   ├── streaming.ts       # SSE client
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Utility functions
├── store/
│   ├── chat-store.ts      # Chat/streaming state
│   └── session-store.ts   # Session state
├── tests/
│   ├── unit/              # Vitest unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # Playwright E2E tests
├── middleware.ts          # Route protection
└── next.config.ts         # Next.js + security config
```

## Known Limitations

1. **Session rename**: Not implemented (backend doesn't support it yet)
2. **Message editing**: Not supported
3. **File uploads**: Not implemented
4. **Mobile responsiveness**: Basic support, needs optimization
5. **Dark mode toggle**: Uses system preference only

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |

## License

Private - All rights reserved
