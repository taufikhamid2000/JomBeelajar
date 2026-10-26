# API Documentation

This document provides detailed information about the JomBeelajar API endpoints, their usage, and response formats.

## Authentication

Most API endpoints require authentication. The application uses Supabase authentication with JWT tokens.

### Authentication Flow

1. User signs in via the `/auth` endpoint
2. Supabase provides JWT tokens stored in cookies
3. API requests include these cookies automatically
4. Server endpoints verify the session using Supabase SSR helpers

## API Structure

The API is organized in a RESTful manner with these main categories:

- `/api/auth/*` - Authentication operations
- `/api/admin/*` - Admin-only operations
- `/api/topics/*` - Topic and content operations
- `/api/quizzes/*` - Quiz operations
- `/api/users/*` - User profile operations
- `/api/leaderboard/*` - Leaderboard data operations

## Endpoints Reference

### Authentication

#### `POST /api/auth/login`

Authenticates a user with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user"
  },
  "session": {
    "access_token": "jwt_token",
    "expires_at": 1620000000
  }
}
```

#### `POST /api/auth/register`

Registers a new user.

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "displayName": "New User"
}
```

**Response:** Same as login endpoint

#### `POST /api/auth/logout`

Logs out the current user.

**Response:**

```json
{
  "success": true
}
```

### Topics

#### `GET /api/topics`

Retrieves all available topics.

**Query Parameters:**

- `subjectId` (optional): Filter by subject
- `limit` (optional): Limit the number of results

**Response:**

```json
{
  "topics": [
    {
      "id": "uuid",
      "title": "Topic title",
      "description": "Topic description",
      "difficulty_level": 2,
      "time_estimate_minutes": 30,
      "order_index": 1
    }
  ]
}
```

#### `GET /api/topics/:id`

Retrieves a specific topic with its chapters.

**Response:**

```json
{
  "topic": {
    "id": "uuid",
    "title": "Topic title",
    "description": "Topic description",
    "difficulty_level": 2,
    "time_estimate_minutes": 30,
    "chapters": [
      {
        "id": "uuid",
        "title": "Chapter title",
        "order_index": 1
      }
    ]
  }
}
```

### Quizzes

#### `GET /api/quizzes/:id`

Retrieves a specific quiz.

**Response:**

```json
{
  "quiz": {
    "id": "uuid",
    "title": "Quiz title",
    "description": "Quiz description",
    "questions": [
      {
        "id": "uuid",
        "text": "Question text",
        "options": [
          {
            "id": "uuid",
            "text": "Option text",
            "is_correct": false
          }
        ]
      }
    ]
  }
}
```

#### `POST /api/quizzes/:id/submit`

Submits quiz answers.

**Request Body:**

```json
{
  "answers": [
    {
      "question_id": "uuid",
      "selected_option_id": "uuid"
    }
  ]
}
```

**Response:**

```json
{
  "score": 80,
  "correct_answers": 8,
  "total_questions": 10,
  "xp_earned": 100,
  "completed": true
}
```

### User Profile

#### `GET /api/users/profile`

Gets the current user's profile.

**Response:**

```json
{
  "profile": {
    "id": "uuid",
    "display_name": "User Name",
    "avatar_url": "https://example.com/avatar.jpg",
    "xp": 1500,
    "level": 5,
    "streak": 7,
    "achievements": [
      {
        "id": "uuid",
        "title": "Achievement title",
        "description": "Achievement description",
        "icon": "achievement-icon"
      }
    ]
  }
}
```

#### `PUT /api/users/profile`

Updates the current user's profile.

**Request Body:**

```json
{
  "display_name": "New Name",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "display_name": "New Name",
    "avatar_url": "https://example.com/new-avatar.jpg"
  }
}
```

### Admin APIs

#### `GET /api/admin/users`

Gets all users (admin only).

**Response:**

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "user",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

#### `PUT /api/admin/users/:id/role`

Updates a user's role (admin only).

**Request Body:**

```json
{
  "role": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

## Error Handling

All API endpoints use a consistent error format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in to perform this action",
    "details": {}
  }
}
```

Common error codes:

- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Requested resource not found
- `BAD_REQUEST`: Invalid request parameters
- `INTERNAL_ERROR`: Server-side error

## Rate Limiting

Public APIs are rate-limited to 100 requests per minute per IP address.
Authentication endpoints are limited to 10 requests per minute per IP address.

## Versioning

The current API version is v1. Future breaking changes will be introduced with a new version path.

## Testing the API

You can test the API using the provided Postman collection in the `docs/postman` directory.
