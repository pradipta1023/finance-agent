import { Router, type Request, type Response } from "express";
import { app as supervisorApp } from "../agents/supervisor/index.js";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import crypto from "crypto";

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
  let { thread_id, message } = req.body;

  if (!thread_id) {
    thread_id = crypto.randomUUID();
  }

  // Set SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  // Emit thread_id so client knows it
  res.write(`event: thread_id\ndata: ${JSON.stringify({ threadId: thread_id })}\n\n`);

  const config = { configurable: { thread_id } };

  try {
    // If message is null/empty, we are resuming the stream
    const input = message ? { messages: [new HumanMessage(message)] } : null;
    
    const stream = await supervisorApp.streamEvents(input, { version: "v2", ...config });

    for await (const event of stream) {
      if (event.event === "on_chain_start") {
        const name = event.name;
        if (name === "generalChat" || name === "loanAgent") {
          const uiLabel = name === "loanAgent" ? "Loan Agent" : "General Assistant";
          res.write(`event: persona_switch\ndata: ${JSON.stringify({ agentId: name, uiLabel })}\n\n`);
        }
      } else if (event.event === "on_tool_start") {
        const name = event.name;
        res.write(`event: tool_start\ndata: ${JSON.stringify({ toolName: name, uiLabel: "Executing " + name + "..." })}\n\n`);
      } else if (
        event.event === "on_chat_model_stream" &&
        (event.metadata?.langgraph_node === "agent" || 
         event.metadata?.langgraph_node === "chat" ||
         event.metadata?.langgraph_node === "generalChat" || 
         event.metadata?.langgraph_node === "loanAgent")
      ) {
        const chunk = event.data.chunk;
        if (chunk && chunk.content) {
          res.write(`event: message\ndata: ${JSON.stringify({ chunk: chunk.content })}\n\n`);
        }
      }
    }
    
    // Post-stream HITL check
    const state = await supervisorApp.getState(config);
    if (state.next && state.next.length > 0) {
      const pendingTool = state.next[0];
      res.write(`event: control\ndata: ${JSON.stringify({ 
        interrupted: true, 
        pendingTool, 
        uiLabel: "Approve " + pendingTool 
      })}\n\n`);
    }

    res.write('event: done\ndata: {"done": true}\n\n');
    res.end();
  } catch (error: any) {
    console.error("Stream error:", error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Processing failed" })}\n\n`);
    res.end();
  }
});
// POST /resume/:thread_id
router.post("/resume/:thread_id", async (req: Request, res: Response): Promise<void> => {
  const thread_id = req.params.thread_id;
  const { action, reason } = req.body;
  
  if (!["approve", "reject"].includes(action)) {
    res.status(400).json({ error: "Invalid action. Must be 'approve' or 'reject'." });
    return;
  }

  const config = { configurable: { thread_id } };

  try {
    if (action === "reject") {
      // Get current state to find the pending tool calls
      const state = await supervisorApp.getState(config);
      const messages = state.values.messages;
      const lastMessage = messages[messages.length - 1];

      if (lastMessage && lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        const rejectionReason = reason || "User rejected the request.";
        
        // Create a ToolMessage for each pending tool call
        const toolMessages = lastMessage.tool_calls.map((tc: any) => new ToolMessage({
          name: tc.name,
          tool_call_id: tc.id,
          content: `Action rejected by user. Reason: ${rejectionReason}`,
        }));

        // Update the state AS the 'tools' node (or the pending tool node)
        // This makes LangGraph think the tools node just finished and returned these messages
        const pendingNode = state.next[0] || "tools";
        await supervisorApp.updateState(config, { messages: toolMessages }, pendingNode);
      }
    }
    
    // For "approve", we do nothing to the state. 
    // The client will subsequently call /api/chat with null input to resume the stream.
    res.json({ success: true, message: `Action ${action} processed successfully.` });
  } catch (error: any) {
    console.error("Resume error:", error);
    res.status(500).json({ error: "Failed to process resume action." });
  }
});

export default router;
