import { StateGraph, Annotation, messagesStateReducer, START, END } from "@langchain/langgraph";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";

const GeneralChatState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

const llm = new ChatOllama({
  model: "qwen3:14b",
  baseUrl: "http://localhost:11434",
  name: "general_llm",
});

const chatNode = async (state: typeof GeneralChatState.State) => {
  const response = await llm.invoke([
    new SystemMessage("You are a helpful general AI assistant. Briefly and politely answer any non-financial questions the user has."),
    ...state.messages,
  ]);
  
  return { messages: [response] };
};

const workflow = new StateGraph(GeneralChatState)
  .addNode("chat", chatNode)
  .addEdge(START, "chat")
  .addEdge("chat", END);

export const app = workflow.compile();
