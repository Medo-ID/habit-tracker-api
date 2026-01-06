# Habit Tracker API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "secure@Password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**

```json
{
  "message": "User created",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T08:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure@Password123"
}
```

**Response (200 OK):**

```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Habits

#### Get All User Habits

```http
GET /habits
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "habits": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440111",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Morning Exercise",
      "description": "Daily workout routine",
      "frequency": "daily",
      "targetCount": 1,
      "isActive": true,
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-01-15T08:00:00Z",
      "tags": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440222",
          "name": "Health",
          "color": "#FF5733"
        }
      ]
    }
  ]
}
```

#### Create Habit

```http
POST /habits
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Read for 30 minutes",
  "description": "Daily reading habit",
  "frequency": "daily",
  "targetCount": 1,
  "tagIds": ["770e8400-e29b-41d4-a716-446655440222"]
}
```

**Response (201 Created):**

```json
{
  "message": "Habit created",
  "habit": {
    "id": "660e8400-e29b-41d4-a716-446655440111",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Read for 30 minutes",
    "description": "Daily reading habit",
    "frequency": "daily",
    "targetCount": 1,
    "isActive": true,
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
}
```

#### Get Habit by ID

```http
GET /habits/:id
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "habit": {
    "id": "660e8400-e29b-41d4-a716-446655440111",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Read for 30 minutes",
    "description": "Daily reading habit",
    "frequency": "daily",
    "targetCount": 1,
    "isActive": true,
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z",
    "tags": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440222",
        "name": "Health",
        "color": "#FF5733"
      }
    ],
    "entries": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440333",
        "habitId": "660e8400-e29b-41d4-a716-446655440111",
        "completionDate": "2024-01-15T09:00:00Z",
        "note": "Finished reading chapter 3"
      }
    ]
  }
}
```

#### Update Habit

```http
PUT /habits/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Read for 45 minutes",
  "description": "Extended reading time",
  "frequency": "daily",
  "isActive": true
}
```

**Response (200 OK):**

```json
{
  "message": "Habit updated successfully",
  "habit": {
    "id": "660e8400-e29b-41d4-a716-446655440111",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Read for 45 minutes",
    "description": "Extended reading time",
    "frequency": "daily",
    "targetCount": 1,
    "isActive": true,
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Delete Habit

```http
DELETE /habits/:id
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Habit deleted successfully"
}
```

#### Complete Habit

```http
POST /habits/:id/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "Great workout today!"
}
```

**Response (200 OK):**

```json
{
  "message": "Habit completed",
  "entry": {
    "id": "880e8400-e29b-41d4-a716-446655440333",
    "habitId": "660e8400-e29b-41d4-a716-446655440111",
    "completionDate": "2024-01-15T09:00:00Z",
    "note": "Great workout today!"
  }
}
```

**Error Response (400 Bad Request) - Inactive habit:**

```json
{
  "error": "Can not complete an inactive habit"
}
```

#### Add Tags to Habit

```http
POST /habits/:id/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "tagIds": ["770e8400-e29b-41d4-a716-446655440222", "880e8400-e29b-41d4-a716-446655440444"]
}
```

**Response (200 OK):**

```json
{
  "message": "Tags added to habit"
}
```

#### Remove Tag from Habit

```http
DELETE /habits/:id/tags/:tagId
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "message": "Tag removed from habit"
}
```

### Tags

#### Create Tag

```http
POST /tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Health",
  "color": "#FF5733"
}
```

**Response (201 Created):**

```json
{
  "message": "Tag created",
  "tag": {
    "id": "770e8400-e29b-41d4-a716-446655440222",
    "name": "Health",
    "color": "#FF5733",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
}
```

**Error Response (409 Conflict) - Tag already exists:**

```json
{
  "error": "Tag with this name already exists"
}
```

#### Get All Tags

```http
GET /tags
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "tags": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440222",
      "name": "Health",
      "color": "#FF5733",
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-01-15T08:00:00Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440444",
      "name": "Productivity",
      "color": "#33FF57",
      "createdAt": "2024-01-14T12:00:00Z",
      "updatedAt": "2024-01-14T12:00:00Z"
    }
  ]
}
```

**Empty Response (200 OK):**

```json
{
  "message": "Tags collection is empty, try to create one"
}
```

#### Get Popular Tags

```http
GET /tags/popular
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "tags": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440222",
      "name": "Health",
      "color": "#FF5733",
      "usageCount": 15,
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-01-15T08:00:00Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440444",
      "name": "Productivity",
      "color": "#33FF57",
      "usageCount": 12,
      "createdAt": "2024-01-14T12:00:00Z",
      "updatedAt": "2024-01-14T12:00:00Z"
    }
  ]
}
```

#### Get Tag by ID

```http
GET /tags/:id
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "tag": {
    "id": "770e8400-e29b-41d4-a716-446655440222",
    "name": "Health",
    "color": "#FF5733",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z",
    "habitTags": [
      {
        "habitId": "660e8400-e29b-41d4-a716-446655440111",
        "tagId": "770e8400-e29b-41d4-a716-446655440222",
        "habit": {
          "id": "660e8400-e29b-41d4-a716-446655440111",
          "name": "Morning Exercise",
          "description": "Daily workout",
          "isActive": true
        }
      }
    ]
  }
}
```

#### Get Habits for Tag

```http
GET /tags/:id/habits
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "tag": "Health",
  "habits": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440111",
      "name": "Morning Exercise",
      "description": "Daily workout routine",
      "frequency": "daily",
      "targetCount": 1,
      "isActive": true,
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-01-15T08:00:00Z"
    }
  ]
}
```

**Empty Response (200 OK):**

```json
{
  "message": "No habits created with this tag yet"
}
```

#### Update Tag

```http
PUT /tags/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Fitness",
  "color": "#FF0000"
}
```

**Response (201 Created):**

```json
{
  "message": "Tag updated",
  "tag": {
    "id": "770e8400-e29b-41d4-a716-446655440222",
    "name": "Fitness",
    "color": "#FF0000",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### Delete Tag

```http
DELETE /tags/:id
Authorization: Bearer <token>
```

**Response (201 Created):**

```json
{
  "message": "Tag deleted",
  "tag": {
    "id": "770e8400-e29b-41d4-a716-446655440222",
    "name": "Health",
    "color": "#FF5733",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
}
```

### User Management

#### Get User Profile

```http
GET /users/profile
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  }
}
```

#### Update User Profile

```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newemail@example.com",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (200 OK):**

```json
{
  "message": "Profile updated",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "newemail@example.com",
    "username": "johndoe",
    "firstName": "Jane",
    "lastName": "Smith",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

#### Change Password

```http
POST /users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "oldPassword": "currentPassword123",
  "newPassword": "NewSecurePassword1!"
}
```

**Response (201 Created):**

```json
{
  "message": "password updated"
}
```

**Error Response (401 Unauthorized) - Invalid old password:**

```json
{
  "error": "Old password is incorrect"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "The password must be at least 8 characters long."
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required",
  "message": "Please provide a valid JWT token"
}
```

### 404 Not Found

```json
{
  "error": "Habit not found"
}
```

### 409 Conflict

```json
{
  "error": "Tag with this name already exists"
}
```

### 429 Too Many Requests

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again after 60 seconds.",
  "retryAfter": 60
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Something went wrong on our end. Please try again later."
}
```

## Testing with cURL

### Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### Create a habit

```bash
curl -X POST http://localhost:3000/api/habits \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Drink Water",
    "description": "Stay hydrated",
    "frequency": "daily",
    "targetCount": 8
  }'
```

### Get all habits

```bash
curl -X GET http://localhost:3000/api/habits \
  -H "Authorization: Bearer TOKEN"
```

### Complete a habit

```bash
curl -X POST http://localhost:3000/api/habits/HABIT_ID/complete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note": "Did it after lunch"}'
```

### Get all tags

```bash
curl -X GET http://localhost:3000/api/tags \
  -H "Authorization: Bearer TOKEN"
```

### Get popular tags

```bash
curl -X GET http://localhost:3000/api/tags/popular \
  -H "Authorization: Bearer TOKEN"
```

### Get tag habits

```bash
curl -X GET http://localhost:3000/api/tags/TAG_ID/habits \
  -H "Authorization: Bearer TOKEN"
```

### Get user profile

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer TOKEN"
```

## Rate Limiting

The API implements rate limiting to prevent abuse and ensure fair usage for all clients.

### Rate Limit Rules

| Endpoint Category          | Limit        | Window   |
| -------------------------- | ------------ | -------- |
| Authentication (`/auth/*`) | 5 requests   | 1 minute |
| Protected endpoints        | 100 requests | 1 minute |
| Public endpoints           | 30 requests  | 1 minute |

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699880460
```

When rate limit is exceeded, the API returns a **429 Too Many Requests** status with retry information.

## Webhook Events (Future Enhancement)

The API can be extended to support webhooks for real-time event notifications.

### Supported Events

- `habit.created` - When a new habit is created
- `habit.completed` - When a habit is marked as complete
- `habit.updated` - When a habit details are updated
- `habit.deleted` - When a habit is permanently deleted
- `streak.milestone` - When a user reaches a streak milestone (7, 30, 100, 365 days)
- `tag.created` - When a new tag is created
- `tag.deleted` - When a tag is removed

### Webhook Payload Example

```json
{
  "id": "webhook-event-uuid",
  "timestamp": "2024-01-15T12:30:45Z",
  "event": "habit.completed",
  "data": {
    "habitId": "660e8400-e29b-41d4-a716-446655440111",
    "habitName": "Morning Exercise",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "completionDate": "2024-01-15T12:30:00Z",
    "note": "Great workout today!",
    "streak": 7
  }
}
```

## SDK Examples

### JavaScript/TypeScript

A complete SDK for interacting with the Habit Tracker API:

```typescript
class HabitTrackerAPI {
  private baseURL = 'http://localhost:3000/api'
  private token: string | null = null

  /**
   * Authenticate user and retrieve JWT token
   */
  async login(email: string, password: string) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    const data = await response.json()
    this.token = data.accessToken
    return data
  }

  /**
   * Register a new user account
   */
  async register(
    email: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string
  ) {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, firstName, lastName }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    const data = await response.json()
    this.token = data.accessToken
    return data
  }

  /**
   * Retrieve all habits for authenticated user
   */
  async getHabits() {
    const response = await fetch(`${this.baseURL}/habits`, {
      headers: { Authorization: `Bearer ${this.token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch habits')
    }

    return response.json()
  }

  /**
   * Get a specific habit by ID
   */
  async getHabitById(habitId: string) {
    const response = await fetch(`${this.baseURL}/habits/${habitId}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    })

    if (!response.ok) {
      throw new Error('Habit not found')
    }

    return response.json()
  }

  /**
   * Create a new habit
   */
  async createHabit(
    name: string,
    description: string,
    frequency: 'daily' | 'weekly' | 'monthly',
    targetCount: number = 1,
    tagIds: string[] = []
  ) {
    const response = await fetch(`${this.baseURL}/habits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        frequency,
        targetCount,
        tagIds,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    return response.json()
  }

  /**
   * Mark a habit as completed for today
   */
  async completeHabit(habitId: string, note?: string) {
    const response = await fetch(`${this.baseURL}/habits/${habitId}/complete`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ note }),
    })

    if (!response.ok) {
      throw new Error('Failed to complete habit')
    }

    return response.json()
  }

  /**
   * Get all available tags
   */
  async getTags() {
    const response = await fetch(`${this.baseURL}/tags`, {
      headers: { Authorization: `Bearer ${this.token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch tags')
    }

    return response.json()
  }

  /**
   * Get the most popular tags (top 10)
   */
  async getPopularTags() {
    const response = await fetch(`${this.baseURL}/tags/popular`, {
      headers: { Authorization: `Bearer ${this.token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch popular tags')
    }

    return response.json()
  }

  /**
   * Get user profile
   */
  async getProfile() {
    const response = await fetch(`${this.baseURL}/users/profile`, {
      headers: { Authorization: `Bearer ${this.token}` },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch profile')
    }

    return response.json()
  }
}
```

#### Usage Example: Register and Create Habit

```typescript
const api = new HabitTrackerAPI()

try {
  // Register new user
  const registerResponse = await api.register(
    'john@example.com',
    'johndoe',
    'SecurePass123!',
    'John',
    'Doe'
  )
  console.log('User registered:', registerResponse.user)

  // Create a new habit
  const habitResponse = await api.createHabit(
    'Morning Jog',
    'Run 5km every morning',
    'daily',
    1
  )
  console.log('Habit created:', habitResponse.habit)
} catch (error) {
  console.error('Error:', error.message)
}
```

#### Usage Example: Login and Track Completion

```typescript
const api = new HabitTrackerAPI()

try {
  // Login
  const loginResponse = await api.login('john@example.com', 'SecurePass123!')
  console.log('Logged in as:', loginResponse.user.email)

  // Get all habits
  const habitsResponse = await api.getHabits()
  console.log('Your habits:', habitsResponse.habits)

  // Complete first habit
  if (habitsResponse.habits.length > 0) {
    const habitId = habitsResponse.habits[0].id
    const completionResponse = await api.completeHabit(
      habitId,
      'Felt great today!'
    )
    console.log('Habit completed:', completionResponse.entry)
  }
} catch (error) {
  console.error('Error:', error.message)
}
```

#### Usage Example: Working with Tags

```typescript
const api = new HabitTrackerAPI()

try {
  await api.login('john@example.com', 'SecurePass123!')

  // Get popular tags
  const tagsResponse = await api.getPopularTags()
  console.log('Popular tags:', tagsResponse.tags)

  // Create habit with tags
  const tagIds = tagsResponse.tags.slice(0, 2).map((tag) => tag.id)
  const habitResponse = await api.createHabit(
    'Study Session',
    'Study for 2 hours',
    'daily',
    1,
    tagIds
  )
  console.log('Habit with tags created:', habitResponse.habit)
} catch (error) {
  console.error('Error:', error.message)
}
```
