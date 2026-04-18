# BookLens 📚

A social reading tracker — log, rate, and review every book you read, discover what friends are reading, and build your literary identity.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Architecture Notes](#architecture-notes)

---

## Overview

BookLens is a full-stack web application for book lovers. It integrates with the **Open Library API** (no API key required) to give users access to millions of books. Users can log their reading activity, write reviews, follow other readers, build custom lists, and receive personalised recommendations.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| React Router | 7 | Client-side routing |
| TanStack Query | 5 | Server state, caching & data fetching |
| Zustand | 5 | Auth state management |
| Axios | 1.14 | HTTP client with JWT interceptors |
| `@react-oauth/google` | 0.13 | Google One-Tap / OAuth login |
| CSS Modules | — | Scoped component styles |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Spring Boot | 3.2.5 | REST API framework |
| Spring Security + JWT | — | Authentication & authorisation |
| Spring Data JPA / Hibernate | — | ORM & database access |
| PostgreSQL | — | Primary database |
| Redis | — | Caching (books, recommendations) |
| Spring WebFlux WebClient | — | Reactive HTTP client for Open Library |
| Lombok | — | Boilerplate reduction |

---

## Project Structure

```
BookLens-main/
├── booklens-app/               # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/                # Axios API modules (auth, books, lists, logs, reviews, users)
│   │   ├── components/
│   │   │   ├── book/           # BookCard, ReviewCard
│   │   │   ├── feed/           # ActivityItem, Sidebar (reading challenge, trending lists, suggestions)
│   │   │   ├── layout/         # Navbar, Footer, Layout wrapper
│   │   │   └── ui/             # Badge, StarRating, Toast, Skeleton, PageIndicator, ErrorBoundary
│   │   ├── data/               # Static mock data (fallback seeds)
│   │   ├── hooks/              # useBooks, useReviews, useUser (React Query wrappers)
│   │   ├── pages/              # Route-level page components
│   │   ├── store/              # Zustand auth store
│   │   ├── styles/             # Global CSS design tokens
│   │   └── main.jsx
│   ├── .env.example
│   └── vite.config.js
│
└── booklens-backend/           # Spring Boot backend
    ├── src/main/java/com/booklens/
    │   ├── books/              # OpenLibraryClient, BookApiService
    │   ├── config/             # Security, Cache, WebClient configuration
    │   ├── controller/         # REST controllers (Auth, Book, BookList, BookLog, Review, User, GoogleAuth)
    │   ├── dto/                # Request/response DTOs
    │   ├── entity/             # JPA entities (User, BookLog, Review, BookList, UserRecommendation)
    │   ├── exception/          # Global exception handler
    │   ├── repository/         # Spring Data JPA repositories
    │   ├── security/           # JWT filter, JwtUtils, UserDetailsServiceImpl
    │   └── service/            # Business logic (Auth, BookLog, Review, User, Recommendation)
    ├── src/main/resources/
    │   └── application.yml
    ├── setup.sql
    └── pom.xml
```

---

## Features

### Authentication
- **Email/password registration and login** with JWT access tokens (24-hour expiry) and refresh tokens (7-day expiry).
- **Google OAuth2 Sign-In** — the frontend sends a Google ID token; the backend verifies it and issues a BookLens JWT. No Google token handling is required after that point.
- Automatic silent token refresh on 401 responses via Axios interceptors. Failed requests are queued and replayed after the refresh succeeds.

### Home Feed
- Hero landing section for unauthenticated visitors.
- **Activity feed** — a chronological stream of reading events from people you follow.
- **Popular books** — top 8 books by community activity, fetched from the API.
- **Popular reviews** — top 6 reviews by likes.
- **Reading challenge progress** — annual challenge widget in the sidebar.
- **Personalised recommendations** — shown in the sidebar for authenticated users.

### Book Discovery
- **Search** (`/search`) — full-text book search via Open Library. Results are debounced (minimum 2 characters) and paginated.
- **Browse by genre** (`/browse`) — 18 genre filters (Fiction, Sci-Fi, Fantasy, Mystery, Romance, Thriller, Historical, Horror, Biography, Philosophy, Poetry, Psychology, History, Adventure, Classics, Young Adult, Literary Fiction, Non-Fiction) backed by Open Library's subjects API.
- **Book detail** (`/book/:externalId`) — full metadata (title, author, cover, description, publish year, genres), community stats (average rating, ratings count, reviews count, logs count), a star rating distribution chart, and all reviews. Authenticated users also see their personal reading status and rating.

### Reading Log (`/log`)
- Search for any book and log it with:
  - **Status**: `Read`, `Currently Reading`, or `Want to Read`
  - **Star rating** (half-star increments, 0.5–5.0)
  - **Written review**
  - **Start and finish dates**
  - **Flags**: spoiler marker, private entry, re-read indicator
  - **Tags** (comma-separated)
- View and manage your personal reading diary below the log form.
- Delete individual log entries.

### Profile (`/profile`)
- Five-tab profile view: **Overview**, **Diary**, **Reviews**, **Lists**, **Network**.
- Edit display name, bio, location, and website.
- Manage **favourite books** (shown on the Overview tab).
- Annual **reading challenge** progress bar.
- **Statistics**: total books read, total reviews, followers count, following count.

### Book Lists (`/lists`)
- Every user gets three default lists automatically: **Read**, **Currently Reading**, **Want to Read**.
- Create, rename, and delete custom lists.
- Add or remove books from any list.
- A curated **Discover Lists** section showcases community lists (e.g. "Books to Read Before 30", "Nobel Prize Winners, Ranked").

### Members & Social (`/members`)
- Browse and search the reader community.
- **Follow / Unfollow** users.
- View member profiles with their reading stats, bio, location, and top genres.
- **Suggested users** widget recommends people to follow based on your network.
- Inline preview of a member's recent reviews.

### Recommendations
- Netflix-style persistent recommendation pool (up to 15 items per user).
- Pool is seeded from the user's highest-rated books on first access.
- On every new log or rating, fresh candidates are computed from the newly logged book and injected at the front of the pool. Older items drift down and are dropped once the pool exceeds 15 entries.
- Recommendations are cached in Redis (default 60-minute TTL) so reads are fast DB lookups, not re-computations.

---

## API Reference

All endpoints are under `/api/v1`. JWT is required for protected routes (sent as `Authorization: Bearer <token>`).

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register with username, email, password |
| POST | `/auth/login` | — | Login; returns `accessToken` + `refreshToken` |
| POST | `/auth/refresh` | — | Exchange refresh token for new tokens |
| POST | `/auth/google` | — | Verify Google ID token, return BookLens JWT |

### Books

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/books/search?q=&page=&size=` | Optional | Search Open Library (paginated) |
| GET | `/books/{externalId}` | Optional | Full book detail + community stats |
| GET | `/books/{externalId}/rating-distribution` | — | Star rating breakdown for a book |
| GET | `/books/subjects/{subject}?limit=&offset=` | — | Browse books by genre/subject |

### Reading Log

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/books/{externalBookId}/log` | ✅ | Create or update a reading log entry |
| GET | `/me/diary?status=&page=&size=` | ✅ | Your reading diary (filterable by status) |
| DELETE | `/books/{externalBookId}/log` | ✅ | Remove a log entry |
| GET | `/me/feed?page=&size=` | ✅ | Activity feed from followed users |
| GET | `/me/challenge?year=` | ✅ | Annual reading challenge progress |
| GET | `/books/{externalBookId}/logs?page=&size=` | — | All logs for a specific book |

### Reviews

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/books/{externalBookId}/reviews` | ✅ | Write a review |
| PUT | `/reviews/{reviewId}` | ✅ | Edit your review |
| DELETE | `/reviews/{reviewId}` | ✅ | Delete your review |
| GET | `/books/{externalBookId}/reviews?page=&size=` | — | All reviews for a book |
| GET | `/reviews/popular?page=&size=` | — | Most-liked reviews globally |
| POST | `/reviews/{reviewId}/like` | ✅ | Like a review |
| DELETE | `/reviews/{reviewId}/like` | ✅ | Unlike a review |

### Book Lists

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me/lists` | ✅ | Get all your lists |
| POST | `/me/lists` | ✅ | Create a new list |
| PUT | `/me/lists/{listId}` | ✅ | Rename / update list description |
| DELETE | `/me/lists/{listId}` | ✅ | Delete a list (not the 3 defaults) |
| POST | `/me/lists/{listId}/books` | ✅ | Add a book to a list |
| DELETE | `/me/lists/{listId}/books/{externalId}` | ✅ | Remove a book from a list |
| POST | `/me/lists/ensure-defaults` | ✅ | Create default lists if missing |

### Users & Social

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/{username}` | Optional | Public profile view |
| PATCH | `/me` | ✅ | Update your profile |
| POST | `/users/{userId}/follow` | ✅ | Follow a user |
| DELETE | `/users/{userId}/follow` | ✅ | Unfollow a user |
| GET | `/me/suggestions?limit=` | ✅ | Suggested users to follow |
| GET | `/me/recommendations` | ✅ | Personalised book recommendations |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Java** 21+
- **PostgreSQL** 15+
- **Redis** 7+
- A Google Cloud project with an OAuth2 Client ID (for Google Sign-In)

---

### Backend Setup

**1. Create the database**

```sql
CREATE DATABASE booklens;
```

Or run the provided script:

```bash
psql -U postgres -f booklens-backend/setup.sql
```

**2. Configure `application.yml`**

Edit `booklens-backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/booklens
    username: postgres
    password: your_postgres_password

jwt:
  secret: your-256-bit-secret-key-here   # Must be at least 32 characters

google:
  client-id: YOUR_GOOGLE_CLIENT_ID_HERE
```

On first run, Hibernate will auto-create all tables (`ddl-auto: update`). Switch to `validate` in production once the schema is stable.

**3. Start Redis**

```bash
redis-server
```

**4. Run the backend**

```bash
cd booklens-backend
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

---

### Frontend Setup

**1. Install dependencies**

```bash
cd booklens-app
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

**3. Start the dev server**

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Frontend (`.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Base URL for the Spring Boot backend API |
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth2 client ID for Google Sign-In |

### Backend (`application.yml`)

| Key | Required | Description |
|---|---|---|
| `spring.datasource.url` | Yes | PostgreSQL JDBC connection URL |
| `spring.datasource.username` | Yes | PostgreSQL username |
| `spring.datasource.password` | Yes | PostgreSQL password |
| `spring.data.redis.host` | Yes | Redis host (default: `localhost`) |
| `spring.data.redis.port` | Yes | Redis port (default: `6379`) |
| `jwt.secret` | Yes | HS256 signing key (min. 256 bits) |
| `jwt.expiration-ms` | No | Access token TTL in ms (default: 86400000 = 24h) |
| `jwt.refresh-expiration-ms` | No | Refresh token TTL in ms (default: 604800000 = 7d) |
| `google.client-id` | Yes | Google OAuth2 client ID for server-side token verification |
| `cors.allowed-origins` | No | List of allowed CORS origins |

---

## Architecture Notes

**Book data** — BookLens does not store book metadata in its own database. All book information (title, author, cover, description, genres, publish year) is fetched live from the [Open Library API](https://openlibrary.org/developers/api) and cached in Redis. Only user-generated data (logs, reviews, lists, follows) is persisted in PostgreSQL.

**Rating storage** — Ratings are stored internally on a 2–10 scale (corresponding to half-star increments) and converted to the 0.5–5.0 scale in API responses.

**Caching** — Spring Cache with Redis is used for book search results (10-minute TTL), book detail pages, and the recommendation pool (60-minute TTL, invalidated on every log action).

**Token refresh** — The Axios client intercepts 401 responses, queues in-flight requests, silently calls `/auth/refresh`, and replays queued requests with the new token. If the refresh also fails, all tokens are cleared and the user is redirected to `/login`.

**Recommendation engine** — Uses a hybrid approach: collaborative filtering (weight 0.6) combined with content-based filtering (weight 0.4). Collaborative filtering activates once a user has at least 5 ratings.

**CORS** — Configured to allow `localhost:5173–5175` (Vite dev variants) and `https://booklens.vercel.app` (production) out of the box. Add additional origins in `application.yml` under `cors.allowed-origins`.
