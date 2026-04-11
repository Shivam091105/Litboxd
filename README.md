# BookLens 📚

A full-stack social reading platform where users can track books, write reviews, rate titles, and curate reading lists — powered by the [Open Library API](https://openlibrary.org/developers/api).

> Built with **Spring Boot 3** · **React 19 + Vite** · **PostgreSQL** · **Redis** · **JWT Auth**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Recommendation Engine](#recommendation-engine)
- [Authentication Flow](#authentication-flow)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## Features

- **Authentication** — Email/password registration & login, Google OAuth2 sign-in, JWT with silent token refresh
- **Book discovery** — Search the Open Library catalog, browse by subject/genre, view popular & top-rated lists
- **Reading log** — Track books as *Want to Read*, *Currently Reading*, or *Read*; log dates and personal ratings
- **Reviews** — Write, edit, and delete reviews; like reviews; view a weekly popular reviews feed
- **Social** — Follow other readers, activity feed from people you follow, suggested users to follow
- **Personalized recommendations** — Hybrid collaborative + content-based engine (cached in Redis)
- **Reading challenge** — Track annual reading goal progress

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.2 |
| Security | Spring Security + JWT (jjwt 0.12) |
| Database | PostgreSQL 15+ (Spring Data JPA / Hibernate) |
| Caching | Redis (Spring Data Redis) |
| HTTP Client | Spring WebFlux `WebClient` |
| External API | Open Library (free, no API key needed) |
| Social Auth | Google OAuth2 (`google-api-client` 2.4) |
| Build | Maven 3.9+ |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router 7 |
| Server state | TanStack React Query 5 |
| Client state | Zustand 5 |
| HTTP | Axios 1.14 (with JWT interceptor) |
| Social auth | `@react-oauth/google` |
| Styling | CSS Modules + design tokens |

---

## Project Structure

```
BookLens/
├── booklens-app/               # React + Vite frontend
│   ├── src/
│   │   ├── api/                # Axios client + per-resource modules
│   │   │   ├── client.js       # Base Axios instance, JWT interceptor, auto-refresh
│   │   │   ├── auth.js
│   │   │   ├── books.js
│   │   │   ├── logs.js
│   │   │   ├── reviews.js
│   │   │   └── users.js
│   │   ├── components/
│   │   │   ├── book/           # BookCard, ReviewCard
│   │   │   ├── feed/           # ActivityItem, Sidebar
│   │   │   ├── layout/         # Navbar, Footer, Layout
│   │   │   └── ui/             # Badge, StarRating, Skeleton, Toast, etc.
│   │   ├── hooks/              # useBooks, useReviews, useUser (React Query wrappers)
│   │   ├── pages/              # One file per route
│   │   ├── store/
│   │   │   └── authStore.js    # Zustand auth store (persisted)
│   │   └── styles/
│   │       └── tokens.css      # Global design tokens
│   ├── .env.example
│   └── vite.config.js
│
└── booklens-backend/           # Spring Boot backend
    └── src/main/java/com/booklens/
        ├── BookLensApplication.java
        ├── books/
        │   ├── BookApiService.java
        │   └── OpenLibraryClient.java
        ├── config/
        │   ├── SecurityConfig.java     # CORS, JWT filter chain, public routes
        │   └── CacheConfig.java        # Redis cache settings
        ├── controller/
        │   ├── AuthController.java
        │   ├── BookController.java
        │   ├── BookLogController.java
        │   ├── ReviewController.java
        │   ├── UserController.java
        │   └── GoogleAuthController.java
        ├── dto/                        # Request / response DTOs
        ├── entity/
        │   ├── User.java
        │   ├── BookLog.java
        │   ├── Review.java
        │   └── BookList.java
        ├── exception/
        │   ├── BookLensException.java
        │   └── GlobalExceptionHandler.java
        ├── repository/                 # Spring Data JPA + JPQL queries
        ├── security/
        │   ├── JwtUtils.java
        │   ├── JwtAuthFilter.java
        │   └── UserDetailsServiceImpl.java
        └── service/
            ├── AuthService.java
            ├── BookLogService.java
            ├── ReviewService.java
            └── UserService.java
```

---

## Getting Started

### Prerequisites

- **Java 21**
- **Maven 3.9+**
- **Node.js 20+**
- **PostgreSQL 15+** running locally
- **Redis** running locally (`redis-server`)

---

### Backend Setup

**1. Create the database**

```bash
psql -U postgres -f booklens-backend/setup.sql
```

Or manually:

```sql
CREATE DATABASE booklens;
```

**2. Configure `application.yml`**

Open `booklens-backend/src/main/resources/application.yml` and update:

```yaml
spring:
  datasource:
    password: YOUR_POSTGRES_PASSWORD   # change this

google:
  client-id: YOUR_GOOGLE_CLIENT_ID    # from console.cloud.google.com

jwt:
  secret: replace-with-a-long-random-256-bit-string
```

**3. Run the backend**

```bash
cd booklens-backend
mvn spring-boot:run
```

The API starts at `http://localhost:8080`. On first run, Hibernate automatically creates all tables (`ddl-auto: update`).

> **Production note:** Switch `ddl-auto` to `validate` once your schema is stable.

---

### Frontend Setup

**1. Install dependencies**

```bash
cd booklens-app
npm install
```

**2. Create your `.env` file**

```bash
cp .env.example .env
```

Then edit `.env`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

**3. Start the dev server**

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Environment Variables

### Frontend (`booklens-app/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `http://localhost:8080/api/v1` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456.apps.googleusercontent.com` |

### Backend (`application.yml`)

| Key | Description |
|---|---|
| `spring.datasource.password` | PostgreSQL password |
| `spring.data.redis.host` | Redis host (default `localhost`) |
| `jwt.secret` | HS256 signing key (min 256 bits) |
| `jwt.expiration-ms` | Access token TTL (default 24h) |
| `jwt.refresh-expiration-ms` | Refresh token TTL (default 7d) |
| `google.client-id` | Google OAuth2 client ID |
| `recommendation.collaborative-weight` | CF weight in hybrid score |
| `recommendation.content-weight` | CBF weight in hybrid score |

---

## API Reference

All protected endpoints require the header:
```
Authorization: Bearer <access_token>
```

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Create account | No |
| `POST` | `/api/v1/auth/login` | Sign in, receive JWT pair | No |
| `POST` | `/api/v1/auth/refresh` | Refresh access token | No |
| `POST` | `/api/v1/auth/google` | Google OAuth2 sign-in | No |

### Books

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/books/search?q=` | Search Open Library catalog | No |
| `GET` | `/api/v1/books/{externalId}` | Book detail | No |
| `GET` | `/api/v1/books/{externalId}/rating-distribution` | Star rating breakdown | No |
| `GET` | `/api/v1/books/subjects/{subject}` | Books by subject/genre | No |

### Reading Log

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/books/{externalId}/log` | Add or update a log entry | Yes |
| `DELETE` | `/api/v1/logs/{logId}` | Remove a log entry | Yes |
| `GET` | `/api/v1/me/diary` | Your full reading diary | Yes |
| `GET` | `/api/v1/me/feed` | Activity feed from followed users | Yes |
| `GET` | `/api/v1/me/challenge` | Annual reading challenge progress | Yes |

### Reviews

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/v1/books/{externalId}/reviews` | Write a review | Yes |
| `GET` | `/api/v1/books/{externalId}/reviews` | Reviews for a book | No |
| `PUT` | `/api/v1/reviews/{reviewId}` | Edit your review | Yes |
| `DELETE` | `/api/v1/reviews/{reviewId}` | Delete your review | Yes |
| `POST` | `/api/v1/reviews/{reviewId}/like` | Toggle like on a review | Yes |
| `GET` | `/api/v1/reviews/popular` | Popular reviews this week | No |
| `GET` | `/api/v1/users/{userId}/reviews` | Reviews by a specific user | No |

### Users & Recommendations

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/v1/users/{username}` | Public profile | No |
| `PATCH` | `/api/v1/me` | Update your profile | Yes |
| `POST` | `/api/v1/users/{userId}/follow` | Follow a user | Yes |
| `DELETE` | `/api/v1/users/{userId}/follow` | Unfollow a user | Yes |
| `GET` | `/api/v1/me/suggestions` | Suggested users to follow | Yes |
| `GET` | `/api/v1/me/recommendations` | Personalized book recommendations | Yes |

---

## Recommendation Engine

The hybrid engine (`HybridRecommendationEngine.java`) combines two strategies:

### Content-Based Filtering
Builds a taste profile from books the user has rated **3.5 stars or higher** — extracts favorite genres (by frequency) and favorite authors, then scores unread books that match.

Works from the **very first rating**.

### Collaborative Filtering
Finds *taste neighbors* — users who also rated the same books highly — then recommends books those neighbors loved that the current user hasn't encountered yet.

Requires at least `min-ratings-for-cf` ratings (default: **5**) to activate.

### Hybrid Score

```
hybrid_score = (collaborative_weight × CF_score) + (content_weight × CB_score)
             = (0.6 × CF_score) + (0.4 × CB_score)
```

Weights are tunable in `application.yml` under the `recommendation:` block.

### Caching

Results are cached per user in Redis with a default TTL of **60 minutes**. The cache is **automatically invalidated** whenever the user logs or rates a book.

---

## Authentication Flow

```
Register / Login
    ↓
AuthService issues:
  • access_token  (JWT, 24h)
  • refresh_token (JWT, 7d)
    ↓
Axios client attaches access_token to every request header
    ↓
On 401 → client calls /auth/refresh with refresh_token
    ↓
New token pair issued → original request retried
    ↓
If refresh also fails → user redirected to /login
```

Tokens are persisted in `localStorage` via Zustand's `persist` middleware.

---

## Deployment

### Backend — Railway / Render

1. Set environment variables in your platform dashboard (never commit secrets)
2. The built JAR is at `target/booklens-backend-0.0.1-SNAPSHOT.jar` — deployable directly
3. Add a managed PostgreSQL and Redis instance from your platform
4. Update `cors.allowed-origins` in `application.yml` to include your frontend URL

### Frontend — Vercel

1. Set `VITE_API_URL` to your deployed backend URL in the Vercel dashboard
2. Set `VITE_GOOGLE_CLIENT_ID` in the Vercel dashboard
3. `npm run build` → deploy the `dist/` folder

---

## Future Enhancements

- [ ] Role-based access control (Admin / Moderator)
- [ ] Pagination on all list endpoints
- [ ] Docker Compose setup (app + postgres + redis)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Unit and integration test coverage
- [ ] Reading list sharing (public / private toggle)
- [ ] Push notifications for follow activity

---

## License

This project is open source. Feel free to fork and build on it.
