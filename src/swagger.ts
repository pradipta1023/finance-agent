import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Finance Agent API",
      version: "1.0.0",
      description: "API for the Multi-Agent LangGraph.js system with Loan Affordability and General Chat agents.",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Local Development Server",
      },
    ],
    components: {
      schemas: {
        ChatRequest: {
          type: "object",
          required: ["thread_id", "message"],
          properties: {
            thread_id: {
              type: "string",
              description: "The unique identifier for the conversation thread.",
              example: "user123",
            },
            message: {
              type: "string",
              description: "The user's message to the agent.",
              example: "I earn 120000 and spend 50000. I want a 12 lakh car loan.",
            },
          },
        },
      },
    },
    paths: {
      "/chat": {
        post: {
          summary: "Send a message to the agent and receive an SSE stream",
          description: "Streams back chunks of the AI's response using Server-Sent Events.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ChatRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Successful SSE Stream. Chunks will be in format `data: {\"chunk\": \"...\"}`.",
              content: {
                "text/event-stream": {
                  schema: {
                    type: "string",
                  },
                },
              },
            },
            "400": {
              description: "Bad Request (Missing thread_id or message)",
            },
            "500": {
              description: "Internal Server Error",
            },
          },
        },
      },
      "/history/{thread_id}": {
        get: {
          summary: "Get the state history of a specific conversation thread",
          description: "Returns the flattened graph state including messages, income, expenses, etc.",
          parameters: [
            {
              in: "path",
              name: "thread_id",
              required: true,
              schema: {
                type: "string",
              },
              description: "The unique identifier for the conversation thread.",
              example: "user123",
            },
          ],
          responses: {
            "200": {
              description: "Successful Retrieval",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                },
              },
            },
            "500": {
              description: "Internal Server Error",
            },
          },
        },
      },
    },
  },
  apis: [], 
};

export const swaggerSpec = swaggerJsdoc(options);
