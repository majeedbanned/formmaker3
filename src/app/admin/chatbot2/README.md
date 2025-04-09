# ChatbotV2 - MongoDB Query Generator with OpenAI

This chatbot implementation uses OpenAI's Assistant API with a MongoDB database backend to generate accurate database queries from natural language questions in Farsi.

## Key Features

- **Natural Language Query Generation**: Converts Farsi questions into MongoDB queries
- **One-Time Schema Upload**: Upload instructions and DB schema in a single JSON file
- **Per-User Threads**: Each user has their own conversation thread that persists across sessions
- **Database Storage**: Assistant configurations and user threads are stored in MongoDB
- **Detailed Relationship Mapping**: Schema includes explicit field relationships between collections
- **Debug Mode**: Shows generated queries, execution statistics, and results for transparency

## Implementation

The chatbot uses the following components:

1. **OpenAI Assistant**: A specialized assistant model trained to generate MongoDB queries
2. **MongoDB Storage**: Stores assistant configurations and user threads
3. **Chat API**: Handles the interaction between user queries and the OpenAI assistant
4. **Thread Management**: Creates and maintains conversation threads per user
5. **Schema Management**: Uploads schema only once per thread, not with every request

## Assistant Configuration Structure

The configuration file follows this structure:

```json
{
  "name": "MongoDB Query Generator",
  "instructions": "You are a specialized MongoDB query assistant...",
  "dbSchema": {
    "collections": [
      {
        "name": "collectionName",
        "description": "Collection purpose",
        "fields": [
          {
            "name": "fieldName",
            "type": "String|Number|Date",
            "description": "Field description"
          }
        ],
        "relationships": [
          {
            "with": "otherCollection",
            "type": "oneToMany|manyToOne|manyToMany",
            "joinField": "localField",
            "targetField": "foreignField",
            "description": "Relationship description"
          }
        ]
      }
    ],
    "common_query_examples": [
      {
        "farsi_query": "Example question in Farsi",
        "mongo_query": {
          "collection": "collectionName",
          "operation": "find|aggregate",
          "query": {}
        }
      }
    ]
  }
}
```

## How It Works

1. **Assistant Configuration**:

   - Upload a JSON file with assistant instructions and DB schema
   - The system creates an OpenAI Assistant with this configuration
   - Configuration is stored in MongoDB

2. **User Interaction**:

   - Each user gets a unique thread ID stored in MongoDB
   - When a user sends a query, the system:
     - Finds or creates their thread
     - Sends only the user's question
     - Schema is only sent once per thread (on first message)
     - Response is formatted and returned to the user

3. **Persistence**:
   - All assistant configurations and user threads are stored in MongoDB
   - Users can continue conversations across sessions

## Installation and Usage

1. Ensure OpenAI API key is configured in environment variables
2. Access the chatbot from the admin dashboard
3. Toggle "Use Default Assistant" on to use the built-in assistant
4. Or upload your own configuration file with custom instructions and schema
5. Enter questions in Farsi to generate MongoDB queries

## Example Configuration File

A template configuration file is provided at `/admin/chatbot2/config-template.json`. You can:

1. Download this file
2. Modify it with your specific instructions and schema
3. Upload it to create a custom assistant

## Advantages Over Previous Version

- **Efficiency**: Schema is sent only once per conversation, not with every query
- **Persistence**: Assistant configurations and threads are stored in MongoDB
- **Customization**: Upload different configurations for different use cases
- **User Management**: Track conversations by user across sessions

## Example Queries

- "لیست تمام مدارس" - List all schools
- "دانش آموزان کلاس با کد 232" - Students in class with code 232
- "نمرات دانش آموز با کد 2236523" - Grades for student with code 2236523
- "میانگین نمرات هر کلاس به تفکیک درس" - Average grades by class and course
