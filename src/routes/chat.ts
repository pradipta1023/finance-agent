import { Router, type Request, type Response } from "express";
import { app as supervisorApp } from "../agents/supervisor/index.js";
import { HumanMessage } from "@langchain/core/messages";

const router = Router();

// GET /history/:thread_id
router.get("/history/:thread_id", async (req: Request, res: Response): Promise<void> => {
  try {
    const thread_id = req.params.thread_id;
    const config = { configurable: { thread_id } };
    
    const state = await supervisorApp.getState(config);
    res.json(state.values);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /chat
router.post("/chat", async (req: Request, res: Response): Promise<void> => {
  const { thread_id, message } = req.body;

  if (!thread_id || !message) {
    res.status(400).json({ error: "thread_id and message are required" });
    return;
  }

  // Set SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const config = { configurable: { thread_id } };

  try {
    const stream = await supervisorApp.streamEvents(
      { messages: [new HumanMessage(message)] },
      { version: "v2", ...config }
    );

    for await (const event of stream) {
      if (
        event.event === "on_chat_model_stream" &&
        (event.metadata?.langgraph_node === "agent" || event.metadata?.langgraph_node === "chat")
      ) {
        const chunk = event.data.chunk;
        if (chunk && chunk.content) {
          // Send JSON wrapped chunk
          res.write(`data: ${JSON.stringify({ chunk: chunk.content })}\n\n`);
        }
      }
    }
    
    res.write('data: {"done": true}\n\n');
    res.end();
  } catch (error: any) {
    console.error("Stream error:", error);
    res.write(`data: ${JSON.stringify({ error: "Processing failed" })}\n\n`);
    res.end();
  }
});

export default router;
