# Booking Platform API

A production-grade **Booking Platform REST API** built with **NestJS**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**. Authenticated business users manage services; unauthenticated customers create and manage their own bookings against those services, with a full set of business rules, pagination, search/filtering, and Swagger documentation.

---

## 1. Project Overview

The platform models a simple service-booking business (e.g. a salon, clinic, or consultancy):

- Business staff **register/login** and manage a catalogue of bookable **Services**.
- **Customers** book a service without needing an account, providing their contact details.
- The system enforces booking integrity rules (no past-dated bookings, no double-booking a slot, no invalid status transitions) and exposes clean, paginated, searchable endpoints — all documented via Swagger and wrapped in a consistent response envelope.

## 2. Features

- JWT authentication (Passport strategy) with bcrypt password hashing
- Global route protection by default — routes opt **out** via an explicit `@Public()` decorator, rather than opting in (secure-by-default)
- Full CRUD for services, restricted to authenticated users
- Public booking creation, with authenticated-only administrative endpoints (listing, status updates)
- Business rule enforcement: existing-service validation, past-date rejection, valid status-transition graph, duplicate-slot prevention (DB-level unique constraint + app-level check)
- Pagination on services and bookings (`page`, `limit`)
- Search (`search`) and filtering (`status`, `isActive`) on list endpoints
- Global validation pipe (whitelisting, transforming, rejecting unknown fields)
- Global exception filter producing a single, predictable error shape (also maps Prisma error codes to HTTP statuses)
- Global response interceptor producing a single, predictable success shape
- Swagger/OpenAPI docs with JWT bearer auth support at `/api/docs`
- Helmet + CORS + environment-based configuration
- Dockerfile + docker-compose (API + PostgreSQL)
- Unit tests (Jest) for Auth, Services, and Bookings covering the business rules

## 3. Technology Stack

| Concern | Choice |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT + Passport |
| Validation | class-validator / class-transformer |
| Docs | Swagger (OpenAPI 3) |
| Testing | Jest |
| Containerization | Docker / Docker Compose |
| Lint/Format | ESLint + Prettier |

## 4. Installation

```bash
git clone <this-repo>
cd booking-platform
npm install
```

## 5. Environment Variables

Copy the example file and fill in real values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the API listens on | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/booking_platform?schema=public` |
| `JWT_SECRET` | Secret used to sign JWTs — **use a long random string in production** | `super-long-random-string` |
| `JWT_EXPIRES_IN` | Access token lifetime | `1d` |

## 6. PostgreSQL Setup

**Option A — Local PostgreSQL**

Create a database matching your `DATABASE_URL`:

```sql
CREATE DATABASE booking_platform;
```

**Option B — Docker (recommended for a quick start)**

```bash
docker run --name booking-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=booking_platform -p 5432:5432 -d postgres:16-alpine
```

## 7. Prisma Setup

The schema lives at `prisma/schema.prisma` and defines `User`, `Service`, and `Booking` models plus the `BookingStatus` enum.

```bash
npx prisma generate
```

> Note: `prisma generate` downloads a query-engine binary from Prisma's CDN on first run — this requires outbound internet access. It only needs to run once per environment/Docker image (and is already wired into the Dockerfile).

## 8. Running Migrations

```bash
npx prisma migrate dev --name init
```

This creates the tables in your database and regenerates the Prisma Client. For production deployments, use:

```bash
npx prisma migrate deploy
```

## 9. Running Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000` (or your configured `PORT`).

## 10. Running Production Server

```bash
npm run build
npm run start:prod
```

## 11. Running Docker

```bash
docker compose up --build
```

This starts PostgreSQL and the API together. The API container automatically runs `prisma migrate deploy` before starting, so the schema is always up to date. The API will be available at `http://localhost:3000`.

## 12. Running Tests

```bash
npm run test        # unit tests
npm run test:cov    # unit tests with coverage
```

Unit tests cover:
- **AuthService** — registration, duplicate-email rejection, login success/failure
- **ServicesService** — creation, not-found handling, pagination
- **BookingsService** — all six business rules (service existence, past-date rejection, status-transition graph, duplicate-slot rejection)

> These tests mock `PrismaService`, so they do not require a live database — but they do require `npx prisma generate` to have run at least once, since the service layer imports Prisma's generated model types (`Service`, `Booking`, `Prisma.*WhereInput`, etc.).

## 13. Swagger Documentation

Once the server is running:

```
http://localhost:3000/api/docs
```

Click **Authorize** and paste a JWT (obtained from `POST /auth/login`) to call protected endpoints directly from the Swagger UI.

## 14. API Endpoints

### Auth (public)
| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Log in, returns `{ accessToken }` |

### Users (authenticated)
| Method | Path | Description |
|---|---|---|
| GET | `/users/me` | Get the authenticated user's profile |

### Services (authenticated)
| Method | Path | Description |
|---|---|---|
| POST | `/services` | Create a service |
| GET | `/services?page=&limit=&search=&isActive=` | List services (paginated, searchable, filterable) |
| GET | `/services/:id` | Get a service by id |
| PATCH | `/services/:id` | Update a service |
| DELETE | `/services/:id` | Delete a service |

### Bookings
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/bookings` | Public | Create a booking |
| GET | `/bookings?page=&limit=&search=&status=` | Authenticated | List/search/filter bookings |
| GET | `/bookings/:id` | Public | Get a booking by id |
| PATCH | `/bookings/:id/status` | Authenticated | Update booking status |
| PATCH | `/bookings/:id/cancel` | Public | Cancel a booking |

## 15. Assumptions

The assignment brief left a few decisions to the implementer's judgment. This is what was assumed, and why:

1. **Which booking endpoints require authentication.** The brief only explicitly states booking *creation* is public. This implementation treats `GET /bookings` (the full list/search across all customers) and `PATCH /bookings/:id/status` as authenticated **staff/admin actions**, while `GET /bookings/:id` and `PATCH /bookings/:id/cancel` remain public so a customer can check or cancel their own booking (e.g. via a link emailed to them) without an account. This can trivially be changed by adding/removing the `@Public()` decorator in `bookings.controller.ts`.
2. **IDs are UUIDs**, not auto-increment integers — more realistic for a public-facing API where booking/service IDs may appear in URLs shared with customers.
3. **`bookingTime` is stored as a `"HH:mm"` string** rather than a full timestamp, since the brief lists `bookingDate` and `bookingTime` as separate fields. They're combined in memory only when checking the "not in the past" rule.
4. **Password policy**: minimum 8 characters with at least one letter and one digit (the brief's example password met this but didn't state an explicit policy).
5. **Duplicate-booking prevention (Rule 6)** is enforced both at the application layer (a `findFirst` check with a clear `409` error) and at the database layer (a `@@unique` constraint on `[serviceId, bookingDate, bookingTime]`) to remain correct under concurrent requests.
6. **Status transition graph**: `PENDING → CONFIRMED | CANCELLED`, `CONFIRMED → COMPLETED | CANCELLED`, and no transitions out of `CANCELLED` or `COMPLETED`. This satisfies the explicit rule ("cancelled cannot become completed") while providing a sane, closed state machine.

## 16. Future Improvements

- Refresh tokens + token revocation/blacklisting
- Role-based access control (e.g. `ADMIN` vs `STAFF`) rather than a single authenticated-user tier
- Rate limiting (e.g. `@nestjs/throttler`) on public endpoints, especially `POST /bookings`
- Email notifications on booking creation/status changes
- Soft-delete for services instead of hard delete, to preserve booking history integrity
- E2E tests (Supertest) in addition to the existing unit tests
- Idempotency keys on `POST /bookings` for safer client retries

## 17. Folder Structure

```
src/
  app.module.ts
  main.ts
  common/
    decorators/       # @Public(), @CurrentUser()
    dto/              # shared PaginationQueryDto
    enums/            # BookingStatus + allowed transitions
    exceptions/        # domain-specific HttpExceptions
    filters/          # GlobalExceptionFilter
    interceptors/      # ResponseInterceptor
    utils/            # pagination helpers
  config/
    configuration.ts  # typed env configuration
  database/
    prisma.service.ts
    prisma.module.ts
  auth/
    dto/
    guards/           # JwtAuthGuard (global, @Public()-aware)
    strategies/       # JwtStrategy
    auth.controller.ts
    auth.service.ts
    auth.module.ts
  users/
    dto/, entities/
    users.controller.ts
    users.service.ts
    users.module.ts
  services/
    dto/, entities/
    services.controller.ts
    services.service.ts
    services.module.ts
  bookings/
    dto/, entities/
    bookings.controller.ts
    bookings.service.ts
    bookings.module.ts
prisma/
  schema.prisma
test/
  jest-e2e.json
```

## 18. Sample Requests

**Register**
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Create a service (requires `Authorization: Bearer <token>`)**
```http
POST /services
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json

{
  "title": "Software Development Consultation",
  "description": "A one-hour consultation to discuss software architecture, project planning, and technology stack recommendations.",
  "duration": 60,
  "price": 7500.00,
  "isActive": true
}
```

**Create a booking (public)**
```http
POST /bookings
Content-Type: application/json

{
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "customerPhone": "+94771234567",
  "serviceId": "3f9a3c1e-8b2d-4e6a-9b1c-2a7d5e0c9f11",
  "bookingDate": "2026-08-15",
  "bookingTime": "14:30",
  "notes": "Please call 10 minutes before arrival."
}
```

## 19. Sample Responses

**Success (login)**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Success (paginated services list)**
```json
{
  "success": true,
  "message": "Services retrieved successfully",
  "data": {
    "data": [
      {
        "id": "3f9a3c1e-8b2d-4e6a-9b1c-2a7d5e0c9f11",
        "title": "Software Development Consultation",
        "description": "A one-hour consultation to discuss software architecture, project planning, and technology stack recommendations.",
        "duration": 60,
        "price": "49.99",
        "isActive": true,
        "createdAt": "2026-07-01T10:00:00.000Z",
        "updatedAt": "2026-07-01T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Error (service not found — Business Rule 1)**
```json
{
  "success": false,
  "message": "Service with id \"missing-id\" was not found",
  "statusCode": 404,
  "path": "/bookings",
  "timestamp": "2026-07-12T10:00:00.000Z"
}
```

**Error (validation failure)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Please provide a valid email address",
    "Duration must be a positive number"
  ],
  "statusCode": 400,
  "path": "/services",
  "timestamp": "2026-07-12T10:00:00.000Z"
}
```

**Error (duplicate booking — Business Rule 6)**
```json
{
  "success": false,
  "message": "A booking for this service at the selected date and time already exists",
  "statusCode": 409,
  "path": "/bookings",
  "timestamp": "2026-07-12T10:00:00.000Z"
}
```

---


