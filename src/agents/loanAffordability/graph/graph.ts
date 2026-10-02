import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState } from "../state/state.js";
import type { AgentState } from "../state/state.js";
import { agentNode, safeToolsNode, sensitiveToolsNode, extractorNode } from "../node/nodes.js";
import { AIMessage } from "@langchain/core/messages";
import { checkpointer } from "../../../db/mongo.js";

const shouldContinue = (state: AgentState) => {
  const lastMessage = state.messages[state.messages.length - 1];

  if (lastMessage?._getType() === "ai" && (lastMessage as AIMessage).tool_calls?.length) {
    const toolCalls = (lastMessage as AIMessage).tool_calls!;
    
    // Route to sensitive tools if initiateCreditCheck is called
    if (toolCalls.some(call => call.name === "initiateCreditCheck")) {
      return "sensitiveToolsNode";
    }
    
    // Otherwise route to safe tools
    return "safeToolsNode";
  }

  return END;
};

const workflow = new StateGraph(GraphState)
  .addNode("agent", agentNode)
  .addNode("extractor", extractorNode)
  .addNode("safeToolsNode", safeToolsNode)
  .addNode("sensitiveToolsNode", sensitiveToolsNode)
  .addEdge(START, "extractor")
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("safeToolsNode", "agent")
  .addEdge("sensitiveToolsNode", "agent");

export const app = workflow.compile({ 
  checkpointer,
  interruptBefore: ["sensitiveToolsNode"]
});
