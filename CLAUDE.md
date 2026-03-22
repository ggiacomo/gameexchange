# Gamexchange — Claude Code Context

## Project Overview

Gamexchange is a peer-to-peer platform for swapping physical console video games. Users build a personal library, browse other users' available games, and send structured swap proposals. Swaps happen in person (same city/province). No payments handled by the platform in MVP.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router), React, Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Hosting | Vercel |
| Game Catalog | IGDB API (Twitch/Amazon) — free, 200K+ titles |
| Auth | Supabase Auth — email/password + Google OAuth |
| Email | Resend |
| Language | TypeScript throughout |

---

## Project Structure

```
/app
  /(auth)
    /login
    /register
    /confirm
    /reset-password
  /(main)
    /page.tsx                  # Home feed
    /browse/page.tsx           # Browse all available games
    /games/[slug]/page.tsx     # Game detail page
    /profile/[username]/page.tsx
    /profile/me/page.tsx
    /library/page.tsx
    /wishlist/page.tsx
    /proposals/page.tsx
    /proposals/[id]/page.tsx
    /inbox/page.tsx
    /inbox/[proposalId]/page.tsx
    /notifications/page.tsx
    /settings/page.tsx
  /onboarding/page.tsx
  /admin
    /page.tsx
    /users/page.tsx
    /proposals/page.tsx
    /reviews/page.tsx
    /analytics/page.tsx
/components
  /ui                          # Reusable UI primitives
  /library                     # Library-related components
  /proposals                   # Proposal flow components
  /chat                        # Chat/inbox components
  /onboarding                  # Onboarding step components
  /admin                       # Admin dashboard components
/lib
  /supabase                    # Supabase client + server helpers
  /igdb                        # IGDB API wrapper
  /utils
/types
  /database.ts                 # Generated Supabase types
  /igdb.ts
```

---

## Database Schema (Supabase / PostgreSQL)

### users
Extends Supabase `auth.users`.
```sql
id              uuid PRIMARY KEY REFERENCES auth.users
username        text UNIQUE NOT NULL
avatar_url      text
bio             text                          -- max 160 chars
city            text NOT NULL
country         text NOT NULL                 -- ISO code
email_confirmed boolean DEFAULT false
plan            text DEFAULT 'free'           -- free | pro
plan_expires_at timestamptz
rating_avg      numeric(3,2) DEFAULT 0
swaps_completed integer DEFAULT 0
is_suspended    boolean DEFAULT false
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### games
Local cache of IGDB data.
```sql
id           integer PRIMARY KEY             -- IGDB id
title        text NOT NULL
cover_url    text
platforms    text[]
genres       text[]
release_year integer
igdb_slug    text
```

### user_library
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id          uuid REFERENCES users NOT NULL
game_id          integer REFERENCES games NOT NULL
status           text DEFAULT 'private'      -- private | available | with_compensation
min_compensation numeric(8,2)                -- EUR, only if status = with_compensation
condition        text DEFAULT 'good'         -- mint | good | fair
notes            text                        -- max 200 chars
created_at       timestamptz DEFAULT now()
updated_at       timestamptz DEFAULT now()
UNIQUE(user_id, game_id)
```

### user_wishlist
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid REFERENCES users NOT NULL
game_id             integer REFERENCES games NOT NULL
platform_preference text
created_at          timestamptz DEFAULT now()
UNIQUE(user_id, game_id)
```

### proposals
```sql
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
proposer_id        uuid REFERENCES users NOT NULL
receiver_id        uuid REFERENCES users NOT NULL
requested_item_id  uuid REFERENCES user_library NOT NULL  -- game of B that A wants
status             text DEFAULT 'pending'
-- pending | counter_proposed | accepted | declined | expired | cancelled | completed
message            text                                    -- max 300 chars
expires_at         timestamptz DEFAULT now() + interval '7 days'
completed_at       timestamptz
created_at         timestamptz DEFAULT now()
updated_at         timestamptz DEFAULT now()
```

### proposal_items
Games offered by A (or counter-offered by B).
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
proposal_id         uuid REFERENCES proposals NOT NULL
library_item_id     uuid REFERENCES user_library NOT NULL
compensation_amount numeric(8,2) DEFAULT 0              -- EUR added for this game
offered_by          text NOT NULL                       -- proposer | receiver
created_at          timestamptz DEFAULT now()
```

### messages
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
proposal_id uuid REFERENCES proposals NOT NULL          -- chat is tied to an accepted proposal
sender_id   uuid REFERENCES users NOT NULL
content     text NOT NULL                               -- max 1000 chars
read_at     timestamptz
created_at  timestamptz DEFAULT now()
```

### reviews
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
proposal_id uuid REFERENCES proposals NOT NULL
reviewer_id uuid REFERENCES users NOT NULL
reviewee_id uuid REFERENCES users NOT NULL
rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5)
comment     text                                        -- max 200 chars
created_at  timestamptz DEFAULT now()
UNIQUE(proposal_id, reviewer_id)
```

---

## Core Business Logic

### Proposal Flow
1. A finds a game on B's profile (status = available or with_compensation)
2. A selects games from their own library to offer in exchange
3. A can add optional monetary compensation per game offered (EUR amount)
4. A sends proposal — system checks active proposal limit
5. B receives notification (in-app + email via Resend)
6. B can: Accept / Decline / Counter-propose (modify items/compensation)
7. On Accept → chat opens automatically for coordinating the in-person swap
8. Both confirm "Swap completed" in-app → review form unlocks
9. Swapped games are removed from both libraries automatically

### Proposal Limits
- Free users: max 3 active proposals per title (as proposer or receiver)
- Pro users: max 10 active proposals per title
- Proposals auto-expire after 7 days if no response
- On close (any status), slot frees up immediately

### Email Confirmation (Soft Gate)
- Email confirmation is NOT required to register or browse
- Email confirmation IS required to send or accept the first proposal
- Show persistent banner until confirmed
- On blocked action: show modal with "Resend confirmation email" CTA

### Library States
- `private` — default, not visible to others
- `available` — visible, can be included in proposals
- `with_compensation` — visible, but min_compensation EUR required in proposal

### Plan Limits
| Feature | Free | Pro |
|---|---|---|
| Library size | 50 games | Unlimited |
| Wishlist | 10 titles | Unlimited |
| Active proposals per title | 3 | 10 |
| Proposal notifications | Daily digest | Real-time |
| Profile badge | — | Pro badge |

---

## Auth Setup (Supabase)

- Email/password via Supabase Auth
- Google OAuth (single provider in MVP)
- Persistent sessions with auto refresh token
- After registration → redirect to `/onboarding`
- After login → redirect to `/` (home feed)
- RLS (Row Level Security) enabled on all tables
- Users can only read/write their own data except public profiles and available library items

---

## IGDB Integration

Base URL: `https://api.igdb.com/v4`
Auth: Twitch Client Credentials flow → Bearer token

Key endpoints used:
- `POST /games` — search by name, return id, name, cover, platforms, genres, first_release_date, slug
- `POST /covers` — fetch cover image URLs

Caching strategy: cache IGDB results in the `games` table. On search, check local DB first, fall back to IGDB API if not found, then persist to local cache.

```typescript
// Example IGDB search query
fields name, cover.url, platforms.name, genres.name, first_release_date, slug;
search "Elden Ring";
limit 10;
```

---

## Onboarding Flow (4 steps)

1. **Welcome** — headline + CTA, skip link available
2. **Select consoles** — multi-select grid (PS5, PS4, Xbox Series, Xbox One, Switch, PC, Other). Min 1 required.
3. **Add your games** — IGDB autocomplete search, filter by selected consoles, add to library. Min 3 recommended, not required.
4. **Add wishlist** — same autocomplete, add games you are looking for. Optional step.

On completion → redirect to home with match count message.

---

## Notifications

All notifications stored in DB. Email sent via Resend for:
- New proposal received
- Proposal accepted
- Counter-proposal received
- New message in chat (async — not real-time in MVP)
- Swap completed — leave a review
- Wishlist match (max 1 per game per week to avoid spam)
- Email confirmation reminder (48h after registration if not confirmed)

In-app notifications via Supabase Realtime subscriptions.

---

## Chat

- Async (not real-time WebSocket in MVP)
- One chat thread per accepted proposal
- Text only, max 1000 chars per message
- No file/image uploads in MVP
- Chat persists after swap completion (read-only)
- No direct messaging outside of accepted proposals (prevents spam)

---

## Admin Dashboard (`/admin`)

Protected route — admin role only. Sections:
- **Overview** — KPIs: total users, active users (7/30d), proposals sent, swaps completed, conversion rate
- **Users** — list, search, filter, suspend, delete (GDPR), force password reset
- **Proposals** — all proposals with status filter, detail view
- **Reviews** — moderation, remove inappropriate content
- **Geography** — user density by city/country
- **Config** — feature flags, proposal limits, expiry duration

---

## Design System

Inspired by Vinted — clean, minimal, card-based.
- **Colors**: neutral palette, green accent (`#1A6B3C`)
- **Typography**: Inter or system sans-serif
- **Layout**: mobile-first, max content width 1280px
- **Cards**: game covers prominent, rounded corners, subtle shadows
- **No dark mode in MVP**

Use Tailwind CSS utility classes. Keep components simple and composable.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
IGDB_CLIENT_ID=
IGDB_CLIENT_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Development Conventions

- TypeScript strict mode
- Server Components by default, Client Components only when needed (interactivity, hooks)
- Supabase SSR client for server-side data fetching
- Use `zod` for form validation and API input validation
- Use `react-hook-form` for form state
- Error boundaries on all major page sections
- All user-facing text in English only
- No `any` types
- Prefer explicit return types on functions

---

## MVP Scope (build first)

### Must Have
- [ ] Auth (email + Google OAuth)
- [ ] Email confirmation soft gate
- [ ] Onboarding 4-step with IGDB autocomplete
- [ ] User library with 3 states
- [ ] Wishlist
- [ ] Browse + search with filters (console, city)
- [ ] Public user profile
- [ ] Full proposal flow (send, counter, accept, decline)
- [ ] Proposal limits enforcement
- [ ] Proposal auto-expiry (7 days)
- [ ] Async chat (post-accepted proposal)
- [ ] In-app + email notifications
- [ ] Post-swap review system
- [ ] Admin dashboard

### Out of Scope for MVP
- Real-time chat (WebSocket)
- Payments / escrow
- Mobile native app (PWA is fine)
- Multilingual UI
- Proactive matching notifications (Phase 2)
- Pro subscription billing (Phase 2)
