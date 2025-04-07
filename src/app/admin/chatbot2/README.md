# ChatbotV2 - MongoDB Query Generator with OpenAI

This chatbot implementation uses OpenAI's Assistant API along with a hardcoded MongoDB schema to generate accurate database queries from natural language questions in Farsi.

## Key Features

- **Natural Language Query Generation**: Converts Farsi questions into MongoDB queries.
- **Hardcoded Schema**: Uses a built-in database schema with relationship mapping, eliminating the need for file uploads.
- **Detailed Relationship Mapping**: Schema includes explicit field relationships between collections for better query accuracy.
- **Debug Mode**: Shows generated queries, execution statistics, and results for transparency.
- **Thread-based Conversation**: Maintains context across multiple interactions.

## Implementation

The chatbot uses the following components:

1. **OpenAI Assistant**: A specialized assistant model trained to generate MongoDB queries.
2. **MongoDB Schema API**: Provides a detailed schema with field descriptions and relationships.
3. **Chat API**: Handles the interaction between user queries and the OpenAI assistant.
4. **Thread Management**: Creates and maintains conversation threads.
5. **MongoDB Query Execution**: Safely executes generated queries against the database.

## MongoDB Schema Structure

The schema follows this structure:

```json
{
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
  ]
}
```

## How It Works

1. User enters a question in Farsi.
2. The system fetches the MongoDB schema.
3. The assistant generates a MongoDB query based on the schema and user question.
4. The query is executed on the database.
5. Results are formatted and returned to the user.

## Debug Information

When debug mode is enabled, the chatbot provides:

- Generated MongoDB query
- Execution time statistics
- Query results
- Token usage

## Installation and Usage

1. Ensure OpenAI API key is configured in environment variables.
2. Access the chatbot from the admin dashboard.
3. Toggle "Use Hardcoded Schema" on to use the built-in schema.
4. Enter questions in Farsi to generate MongoDB queries.

## Example Queries

- "لیست تمام مدارس" - List all schools
- "دانش آموزان کلاس با کد 232" - Students in class with code 232
- "نمرات دانش آموز با کد 2236523" - Grades for student with code 2236523
- "میانگین نمرات هر کلاس به تفکیک درس" - Average grades by class and course
