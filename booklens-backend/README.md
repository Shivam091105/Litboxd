# BookLens Backend — Spring Boot

A production-grade REST API for the BookLens social reading platform.
Built with Spring Boot 3, Spring Security (JWT), PostgreSQL, Redis, and a Hybrid Recommendation Engine.

---

## Tech Stack

| Layer          | Technology                          |
|----------------|--------------------------------------|
| Framework      | Spring Boot 3.2, Java 21            |
| Security       | Spring Security + JWT (jjwt 0.12)   |
| Database       | PostgreSQL 15+ (via Spring Data JPA) |
| Caching        | Redis (recommendations + feed)       |
| HTTP Client    | Spring WebFlux WebClient            |
| External API   | Open Library (free, no key)         |
| Build          | Maven                                |

---

## Prerequisites

- Java 21
- Maven 3.9+
- PostgreSQL 15+ running locally
- Redis running locally (`redis-server`)

---

## Quick Start

### 1. Create the database
```sql
-- In psql:
CREATE DATABASE booklens;
```
Or run the full setup script:
```bash
psql -U postgres -f setup.sql
```

### 2. Configure credentials
Edit `src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    username: postgres
    password: YOUR_POSTGRES_PASSWORD
```

### 3. Run the application
```bash
mvn spring-boot:run
```

The API will be live at: `http://localhost:8080`

On first run, Hibernate creates all tables automatically (`ddl-auto: update`).

---

## Project Structure

```
src/main/java/com/booklens/
├── BookLensApplication.java         # Entry point
├── config/
│   ├── SecurityConfig.java          # JWT + CORS + route permissions
│   └── CacheConfig.java             # Redis cache configuration
├── controller/
│   ├── AuthController.java          # /api/v1/auth/**
│   ├── BookController.java          # /api/v1/books/**
│   ├── BookLogController.java       # /api/v1/books/{id}/log, /me/diary, /me/feed
│   ├── ReviewController.java        # /api/v1/reviews/**, /books/{id}/reviews
│   └── UserController.java          # /api/v1/users/**, /me/**
├── entity/
│   ├── User.java                    # users table
│   ├── Book.java                    # books table
│   ├── BookLog.java                 # book_logs table (status, rating, dates)
│   ├── Review.java                  # reviews table
│   └── BookList.java                # book_lists + list_books tables
├── repository/                      # Spring Data JPA repositories (JPQL queries)
├── service/
│   ├── AuthService.java             # Register, login, token refresh
│   ├── BookService.java             # Search, popular, top-rated
│   ├── BookLogService.java          # Log/update/delete entries, feed, challenge
│   ├── ReviewService.java           # CRUD reviews, likes
│   ├── UserService.java             # Profile, follow/unfollow, suggestions
│   ├── OpenLibraryService.java      # Fetches + persists from Open Library API
│   └── RecommendationService.java   # Delegates to recommendation engine
├── recommendation/
│   └── HybridRecommendationEngine.java  # ★ Core algorithm
├── security/
│   ├── JwtUtils.java                # Token generate / validate
│   ├── JwtAuthFilter.java           # Request interceptor
│   └── UserDetailsServiceImpl.java  # Loads user from DB for Spring Security
└── exception/
    ├── BookLensException.java        # Custom exception with HTTP status
    └── GlobalExceptionHandler.java  # Consistent JSON error responses
```

---

## API Reference

### Auth
| Method | Endpoint                  | Description              | Auth? |
|--------|---------------------------|--------------------------|-------|
| POST   | `/api/v1/auth/register`   | Create account           | No    |
| POST   | `/api/v1/auth/login`      | Sign in, get JWT         | No    |
| POST   | `/api/v1/auth/refresh`    | Refresh access token     | No    |

### Books
| Method | Endpoint                          | Description                  | Auth? |
|--------|-----------------------------------|------------------------------|-------|
| GET    | `/api/v1/books/search?q=`         | Search books                 | No    |
| GET    | `/api/v1/books/{id}`              | Book detail                  | No    |
| GET    | `/api/v1/books/{id}/similar`      | Similar books                | No    |
| GET    | `/api/v1/books/{id}/reviews`      | Reviews for a book           | No    |
| GET    | `/api/v1/books/popular`           | Popular books                | No    |
| GET    | `/api/v1/books/top-rated`         | Top rated books              | No    |
| GET    | `/api/v1/books/genre/{genre}`     | Books by genre               | No    |

### Logging
| Method | Endpoint                          | Description                  | Auth? |
|--------|-----------------------------------|------------------------------|-------|
| POST   | `/api/v1/books/{id}/log`          | Log / update a book          | Yes   |
| DELETE | `/api/v1/logs/{logId}`            | Remove a log entry           | Yes   |
| GET    | `/api/v1/me/diary`                | Your reading diary           | Yes   |
| GET    | `/api/v1/me/feed`                 | Activity feed from following | Yes   |
| GET    | `/api/v1/me/challenge`            | Reading challenge progress   | Yes   |

### Reviews
| Method | Endpoint                          | Description                  | Auth? |
|--------|-----------------------------------|------------------------------|-------|
| POST   | `/api/v1/books/{id}/reviews`      | Write a review               | Yes   |
| PUT    | `/api/v1/reviews/{id}`            | Edit your review             | Yes   |
| DELETE | `/api/v1/reviews/{id}`            | Delete your review           | Yes   |
| POST   | `/api/v1/reviews/{id}/like`       | Toggle like                  | Yes   |
| GET    | `/api/v1/reviews/popular`         | Popular reviews this week    | No    |

### Users & Recommendations
| Method | Endpoint                          | Description                  | Auth? |
|--------|-----------------------------------|------------------------------|-------|
| GET    | `/api/v1/users/{username}`        | Public profile               | No    |
| PATCH  | `/api/v1/me`                      | Update your profile          | Yes   |
| POST   | `/api/v1/users/{id}/follow`       | Follow a user                | Yes   |
| DELETE | `/api/v1/users/{id}/follow`       | Unfollow a user              | Yes   |
| GET    | `/api/v1/me/suggestions`          | Suggested users to follow    | Yes   |
| GET    | `/api/v1/me/recommendations`      | ★ Personalised book recs     | Yes   |

---

## Recommendation Engine

The hybrid engine lives in `HybridRecommendationEngine.java` and combines:

### Content-Based Filtering
- Builds a **taste profile** from the user's highly-rated books (3.5+ stars)
- Extracts favourite genres (by frequency) and favourite author
- Finds books that match those genres/authors, weighted by quality score
- Works from the **very first rating**

### Collaborative Filtering
- Finds **taste neighbors** — users who also rated the same books highly
- Recommends books those neighbors loved that the user hasn't read
- Requires at least `min-ratings-for-cf` (default: 5) ratings to activate

### Hybrid Score
```
hybrid_score = (0.6 × CF_score) + (0.4 × CB_score)
```
Weights are tunable in `application.yml`:
```yaml
recommendation:
  collaborative-weight: 0.6
  content-weight: 0.4
```

### Caching
Recommendations are cached in Redis per user (default TTL: 60 minutes).
Cache is **automatically invalidated** when the user logs or rates a book.

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Tokens expire after 24 hours. Use `/auth/refresh` with your refresh token (7-day TTL) to get a new access token without re-logging in.

---

## Connecting the React Frontend

In your React app (`src/api/`):
```js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  withCredentials: true,
})

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
```
