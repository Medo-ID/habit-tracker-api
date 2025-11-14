# Habit Tracker API - Learning Project

A production-ready REST API built with Express, TypeScript, and modern development practices. This project focuses on learning clean code principles, advanced testing strategies, and building scalable backend services from scratch.

## 🎯 Project Overview

**Habit Tracker API** is a comprehensive habit management system that allows users to:

- Create and manage daily habits with frequency tracking
- Organize habits with customizable tags
- Track habit completions with notes
- View popular habits and analytics
- Manage user profiles and authentication

This is a **learning-focused project** designed to deepen my understanding of backend development best practices while building a fully functional API.

---

## 📚 Learning Journey & Tech Decisions

### Testing & Quality Assurance

**Why Vitest over Jest?**

- Moved from Jest (used in [sprout-scout-api](https://github.com/Medo-ID/sprout-scout-api)) to **Vitest** for this project
- **Why?** Vitest offers:
  - ⚡ Exceptional speed and fast HMR support
  - 🔧 Seamless TypeScript integration without configuration headaches
  - 🗄️ Better database isolation and no race conditions (Jest caused database conflicts when running the full test suite simultaneously. Perhaps I don't know how to setup it properly so that I don't encounter such problems.)
  - 📦 Modern, cleaner configuration that feels intuitive
- **Coverage:** Comprehensive integration tests for controllers + unit tests for utilities
- **Learning focus:** Mastering integration testing to catch real-world scenarios

### Clean Code & Best Practices

- Reading and applying principles from:
  - **Clean Code** by Robert C. Martin
  - **The Pragmatic Programmer** (in progress)
- Applied practices:
  - Meaningful variable and function names
  - Single Responsibility Principle (SRP) across modules
  - DRY (Don't Repeat Yourself) - centralized validation, error handling, authentication
  - Proper error handling with context-aware messages
  - Type safety throughout the codebase

### Database - Drizzle ORM

**First time using Drizzle instead of raw SQL** - and I'm loving it! 🚀

- **Advantages:**
  - 💪 **Type Safety**: Full TypeScript support with compile-time checks
  - 🔀 **Flexible Query API**: Multiple ways to write queries (query builder, relational queries)
  - 📝 **Type-safe schema definitions**: Schema is the source of truth
  - 🧩 **Intuitive migrations**: Clear, readable migration files
  - ⚡ **Minimal overhead**: Lightweight ORM without sacrificing functionality
- **Database:** PostgreSQL with structured schema and relationships

### Input Validation - Zod

- Learning journey: from basic string checks to comprehensive schema validation
- **Current implementation:**
  - Route-level validation using Zod schemas
  - Error handling with detailed field-level feedback
  - Custom validation rules (password strength, email format, hex colors)
  - Error response standardization
- **Note:** Still improving error handling strategies - it's a continuous learning process! 🥲

### Rate Limiting from Scratch

**Built a custom rate limiter without third-party libraries** (first time!)

- **Implementation:** Sliding Window Counter algorithm
- **Infrastructure:** Redis for distributed rate limit tracking
- **Why custom?** To understand the underlying mechanics rather than relying on black-box solutions
- **Features:**
  - Per-IP
  - Configurable rate limits for different endpoint categories (note implemented yet 🚨)
  - Graceful degradation if Redis is unavailable
  - Retry-After header support in responses

### Additional Learning Areas

- **JWT Authentication**: Token generation, refresh token management, and middleware integration
- **Password Security**: Bcrypt hashing with proper salt rounds
- **RESTful Design**: Resource-oriented endpoints with proper HTTP methods and status codes
- **Database Transactions**: Atomic operations for complex habit creation with tag associations
- **Error Middleware**: Centralized error handling with proper status codes and messages

---

## 🛠️ Tech Stack

| Category               | Technology           | Purpose                     |
| ---------------------- | -------------------- | --------------------------- |
| **Runtime**            | Node.js 24+          | JavaScript runtime          |
| **Language**           | TypeScript           | Type safety and DX          |
| **Framework**          | Express.js           | Web server                  |
| **Database**           | PostgreSQL           | Relational data storage     |
| **ORM**                | Drizzle              | Type-safe database queries  |
| **Validation**         | Zod                  | Input schema validation     |
| **Testing**            | Vitest               | Unit & integration tests    |
| **Caching/Rate Limit** | Redis                | Distributed rate limiting   |
| **Security**           | bcrypt, jsonwebtoken | Password hashing & JWT auth |

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 24+
- PostgreSQL 17+
- Redis 8+ (for rate limiting)
- npm or yarn

### Step 1: Clone & Install Dependencies

\`\`\`bash
git clone https://github.com/Hendrixer/api-design-node-v5.git
cd api-design-node-v5
npm install
\`\`\`

### Step 2: Environment Configuration (Read .env.example 🚨)

Create a `.env` file in the project root:
\`\`\`env

# Database

DATABASE_URL=postgresql://user:password@localhost:5432/habit_tracker

# JWT

JWT_SECRET=your-super-secret-jwt-key-here

# Redis

REDIS_URL=redis://localhost:6379

# Environment

NODE_ENV=development
PORT=3000
\`\`\`

### Step 3: Database Setup

\`\`\`bash

# Push schema for dev database

npm run db:push

# (Optional) Seed sample data

npm run db:seed
\`\`\`

### Step 4: Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The API will be available at `http://localhost:3000/api`

---

## 📋 Available Scripts

\`\`\`bash

# Development

npm run dev # Start dev server with hot reload

# Testing

npm test # Run all tests
npm test:watch # Run tests in watch mode
npm test:coverage # Generate coverage report

# Database

npm run db:migrate # Run pending migrations
npm run db:generate # Generate migration from schema changes
npm run db:push # Push schema changes
npm run db:seed # Populate database with sample data

# Building

npm run build # Compile TypeScript to JavaScript
npm start # Run compiled production build

# Linting & Formatting

npm run lint # Check code style (if ESLint configured)
npm run format # Format code (if Prettier configured)
\`\`\`

---

## 🏗️ Project Structure

\`\`\`
src/
├── controllers/ # Request handlers & business logic
│ ├── authController.ts
│ ├── habitController.ts
│ ├── tagController.ts
│ └── userController.ts
├── routes/ # Route definitions
│ ├── authRoutes.ts
│ ├── habitRoutes.ts
│ ├── tagRoutes.ts
│ └── userRoutes.ts
├── middlewares/ # Express middleware
│ ├── auth.ts # JWT authentication
│ ├── validation.ts # Input validation
│ ├── rateLimiter.ts # Custom rate limiting (sliding window)
│ ├── globalError.ts # Centralized error handling
│ └── notFound.ts # 404 handler
├── db/ # Database layer
│ ├── connection.ts # Connection pool setup
│ ├── schema.ts # Drizzle schema definitions
│ └── seed.ts # Sample data seeding
├── utils/ # Utility functions
│ ├── jwt.ts # JWT token operations
│ └── password.ts # Password hashing & verification
├── server.ts # Express app initialization
└── index.ts # Server startup

tests/
├── globalSetup.ts # Test environment setup
├── helpers.ts # Shared test utilities
├── integration/ # Integration tests
│ ├── authController.test.ts
│ ├── habitController.test.ts
│ ├── tagController.test.ts
│ └── userController.test.ts
└── unit/ # Unit tests
└── utils/
├── jwt.test.ts
└── password.test.ts

migrations/ # Database migrations (auto-generated)
\`\`\`

---

## 🔑 Key Features

### Authentication & Authorization

- JWT-based authentication with access tokens
- Refresh token mechanism for extended sessions (need to implement handler for it 🚨)
- Protected routes with middleware-level checks
- Password hashing with bcrypt

### Habit Management

- CRUD operations for habits
- Frequency-based tracking (daily, weekly, monthly)
- Habit completion logging with optional notes
- Tag association and management
- Get recent completions with limit (last 10)

### Tag System

- Create and organize tags with custom colors
- View popular tags with usage count
- Filter habits by tag
- Tag association with habits

### User Management

- User registration and login
- Profile management (name, email, username)
- Secure password change with verification
- User-scoped data isolation

### Rate Limiting

- Custom sliding window counter implementation
- Per-endpoint category limits (toBe Implemeneted later 😊):
  - Auth endpoints: 5 requests/minute
  - Protected endpoints: 100 requests/minute
  - Public endpoints: 30 requests/minute
- Redis-backed distributed tracking
- Retry-After header support

### Error Handling

- Centralized error middleware with proper HTTP status codes
- Validation error details with field-level feedback
- Consistent error response format
- Meaningful error messages for debugging

---

## 🧪 Testing

### Test Structure

- **Integration Tests**: Test full request/response cycles with real database
- **Unit Tests**: Test utility functions in isolation

### Running Tests

\`\`\`bash

# Run all tests

npm test

# Watch mode (re-run on file changes)

npm test:watch

# Generate coverage report

npm test:coverage

# Run specific test file

npm test -- authController.test.ts
\`\`\`

### Test Configuration

- Vitest configuration in `vitest.config.ts`
- Global setup/teardown in `tests/globalSetup.ts`
- Helper utilities in `tests/helpers.ts`
- Isolated database per test suite (prevents conflicts)

---

## 📚 API Documentation

For comprehensive API documentation including:

- All endpoint specifications
- Request/response examples
- Error codes and handling
- cURL examples
- WebSocket/Webhook events (planned)
- SDK examples in TypeScript

**See:** [API_DOCS.md](./API_DOCS.md)

---

## 🚀 Roadmap & Future Improvements

### High Priority

- [ ] **WebSocket Support**: Real-time habit notifications and updates
- [ ] **Webhook Events**: Push notifications for habit milestones
- [ ] **Analytics Dashboard**: Habit statistics and progress visualization
- [ ] **Habit Templates**: Pre-made habit categories for quick setup

### Medium Priority

- [ ] **Social Features**: Share habits, friend connections, leaderboards
- [ ] **Mobile App**: React Native companion app
- [ ] **Calendar View**: Visual habit tracking calendar
- [ ] **Email Notifications**: Daily reminders and progress summaries

### Low Priority (Nice to Have)

- [ ] **Habit History Export**: CSV/PDF export of habit data
- [ ] **Multi-language Support**: i18n for API responses
- [ ] **AI Suggestions**: ML-based habit recommendations

### Potential Production Improvements

- [ ] Add comprehensive API logging and monitoring (Winston, Datadog)
- [ ] Implement API versioning (v1, v2) for backward compatibility
- [ ] Add request/response caching layer (Redis)
- [ ] Implement database connection pooling optimization
- [ ] Add circuit breaker pattern for external service calls
- [ ] Comprehensive input sanitization for SQL injection prevention
- [ ] GraphQL endpoint as alternative to REST
- [ ] gRPC support for internal service communication
- [ ] Distributed tracing (OpenTelemetry) for debugging

---

## 📖 Learning Resources Used

This project is built while learning from:

1. **Clean Code** - Robert C. Martin
2. **The Pragmatic Programmer** - David Thomas & Andrew Hunt
3. **Scott Moss / FrontendMasters** - Senior Software Engineer at Netflix
4. Official documentation:
   - [Express.js](https://expressjs.com/)
   - [Drizzle ORM](https://orm.drizzle.team/)
   - [Zod](https://zod.dev/)
   - [Vitest](https://vitest.dev/)

---

## 💡 Lessons Learned

### ✅ What Went Well

- Vitest significantly reduced testing friction compared to Jest
- Drizzle's type safety caught potential bugs at compile time
- Custom rate limiter deepened understanding of distributed systems
- Centralized error handling makes debugging much easier
- Clean code principles made refactoring painless

### 🚧 Still Learning

- Error handling strategies can be more sophisticated (custom error classes, error codes)
- Test coverage could be expanded (edge cases, error scenarios)
- Input validation could use more complex rules
- Performance optimization (query optimization, caching strategies)
- Monitoring and observability in production environments

---

## 🤝 Contributing & Feedback

This is a learning project, but I welcome:

- Suggestions for better patterns or practices
- Code reviews and improvement ideas
- Questions about implementation decisions
- Alternative approaches to problems

Feel free to open an issue or reach out!

---

## 📝 License

MIT License - feel free to use this project as a reference for learning.

---

## 🔗 Related Projects

- [sprout-scout-api](https://github.com/Medo-ID/sprout-scout-api) - Previous project with Jest testing approach
- My portfolio: [Medo-ID](https://medo7id.com)

---

## 📬 Contact

Got questions or feedback? Feel free to reach out!

**Happy coding!** 🚀
