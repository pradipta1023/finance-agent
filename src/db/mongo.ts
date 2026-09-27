import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

export const client = new MongoClient(MONGODB_URI);

export const checkpointer = new MongoDBSaver({
  client,
  dbName: "finance_agent_db",
});

export async function connectDB() {
  await client.connect();
  console.log("Connected to MongoDB at", MONGODB_URI);
}
