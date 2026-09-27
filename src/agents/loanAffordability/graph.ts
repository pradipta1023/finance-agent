import { StateGraph, END, START, MemorySaver } from "@langchain/langgraph";
import { GraphState, AgentState } from "./state";
import { agentNode, executeToolNode } from "./nodes";
import { AIMessage } from "@langchain/core/messages";

const shouldContinue = (state: AgentState) => {
  const lastMessage = state.messages[state.messages.length - 1];

  if (lastMessage._getType() === "ai") {
    const aiMessage = lastMessage as AIMessage;
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      return "tools";
    }
  }
  
  return END;
};

const workflow = new StateGraph(GraphState)
  .addNode("agent", agentNode)
  .addNode("tools", executeToolNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

const memory = new MemorySaver();

export const app = workflow.compile({ checkpointer: memory });
