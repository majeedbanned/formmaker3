# ChatbotV2 API Documentation

This document provides details about the API endpoints for the ChatbotV2 implementation.

## API Endpoints

### 1. Assistant Configuration

#### GET `/api/chatbot2/config`

Retrieves the active assistant configuration.

**Headers:**

- `x-domain`: Domain identifier (default: "parsamooz")

**Response:**

```json
{
  "success": true,
  "assistant": {
    "assistantId": "asst_12345",
    "name": "MongoDB Query Generator",
    "hasDbSchema": true,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### POST `/api/chatbot2/config`

Uploads a new assistant configuration.

**Headers:**

- `x-domain`: Domain identifier (default: "parsamooz")
- `Content-Type`: `application/json`

**Request Body:**

```json
{
  "name": "MongoDB Query Generator",
  "instructions": "You are a specialized MongoDB query assistant...",
  "dbSchema": {
    "collections": [...],
    "common_query_examples": [...]
  }
}
```

**Response:**

```json
{
  "success": true,
  "assistantId": "asst_12345",
  "message": "Assistant configuration uploaded and applied successfully"
}
```

### 2. Thread Management

#### POST `/api/chatbot2/thread`

Creates a new thread or returns an existing one.

**Headers:**

- `x-domain`: Domain identifier (default: "parsamooz")
- `x-user-id`: User identifier (optional)
- `Content-Type`: `application/json`

**Request Body:**

```json
{
  "userId": "user_12345"
}
```

**Response:**

```json
{
  "success": true,
  "threadId": "thread_12345",
  "isExisting": false
}
```

#### GET `/api/chatbot2/thread?userId=user_12345`

Retrieves all threads for a user.

**Headers:**

- `x-domain`: Domain identifier (default: "parsamooz")
- `x-user-id`: User identifier (optional, can be provided in query params instead)

**Response:**

```json
{
  "success": true,
  "threads": [
    {
      "threadId": "thread_12345",
      "assistantId": "asst_12345",
      "lastUsed": "2023-01-01T00:00:00.000Z",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### 3. Chat

#### POST `/api/chatbot2/chat`

Sends a query to the assistant.

**Headers:**

- `x-domain`: Domain identifier (default: "parsamooz")
- `x-user-id`: User identifier (optional)
- `Content-Type`: `application/json`

**Request Body:**

```json
{
  "query": "لیست تمام مدارس",
  "threadId": "thread_12345", // Optional, will create a new thread if not provided
  "userId": "user_12345", // Optional, will use anonymous if not provided
  "debugMode": false // Optional, will include debug info if true
}
```

**Response:**

```json
{
  "success": true,
  "content": "پاسخ به زبان فارسی...",
  "executionTime": 1234,
  "threadId": "thread_12345",
  "debug": { ... } // Only included if debugMode is true
}
```

### 4. Test Connection

#### GET `/api/chatbot2/test-connection`

Tests the MongoDB connection.

**Headers:**

- `x-domain`: Domain identifier (default: "parsamooz")

**Response:**

```json
{
  "success": true,
  "message": "Database connection successful",
  "stats": {
    "assistantCount": 1,
    "threadCount": 10,
    "domain": "parsamooz"
  }
}
```

## Error Handling

All endpoints return a consistent error format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error message"
}
```

## Implementation Notes

1. **Thread-Based Storage**: Each user gets a separate thread for their conversation.
2. **Schema Efficiency**: Schema is sent only once per thread, not with every request.
3. **MongoDB Storage**: All assistant configurations and threads are stored in MongoDB.
4. **Type Safety**: The API is built with TypeScript interfaces for type safety.
5. **Domain Isolation**: Uses domain headers to support multi-tenant deployment.
