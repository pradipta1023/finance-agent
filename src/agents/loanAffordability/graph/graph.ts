import { StateGraph, END, START } from "@langchain/langgraph";
import { GraphState } from "../state/state.js";
import type { AgentState } from "../state/state.js";
import { agentNode, executeToolNode, extractorNode } from "../node/nodes.js";
import { AIMessage } from "@langchain/core/messages";
import { checkpointer } from "../../../db/mongo.js";

const shouldContinue = (state: AgentState) => {
  const lastMessage = state.messages[state.messages.length - 1];

  if (lastMessage?._getType() === "ai" && (lastMessage as AIMessage).tool_calls?.length) {
    return "tools";
  }

  return END;
};

const workflow = new StateGraph(GraphState)
  .addNode("agent", agentNode)
  .addNode("extractor", extractorNode)
  .addNode("tools", executeToolNode)
  .addEdge(START, "extractor")
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

export const app = workflow.compile({ 
  checkpointer 
});
