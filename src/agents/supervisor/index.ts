import { StateGraph, Annotation, messagesStateReducer, START, END } from "@langchain/langgraph";
import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";
import { z } from "zod";
import { app as loanApp } from "../loanAffordability/index.js";
import { app as generalApp } from "../generalChat/index.js";
import { checkpointer } from "../../db/mongo.js";

export const SupervisorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  nextRoute: Annotation<string>({
    reducer: (current, update) => update !== undefined ? update : current,
    default: () => "GENERAL",
  }),
});

const routingSchema = z.object({
  nextRoute: z.enum(["LOAN", "GENERAL"]).describe("The next agent to route the conversation to based on the user's input."),
});

const supervisorNode = async (state: typeof SupervisorState.State) => {
  const supervisorLlm = new ChatOllama({
    model: "qwen3:14b",
    baseUrl: "http://localhost:11434",
    temperature: 0,
    name: "supervisor_llm",
  }).withStructuredOutput(routingSchema, { name: "supervisor" });

  const result = await supervisorLlm.invoke([
    new SystemMessage("You are a routing supervisor. If the user is discussing a loan, car loan, finances, income, or expenses, route to 'LOAN'. For all other general queries, greetings, or off-topic chat, route to 'GENERAL'."),
    ...state.messages,
  ]);

  return { nextRoute: result.nextRoute };
};

const routeToAgent = (state: typeof SupervisorState.State) => {
  return state.nextRoute;
};

const workflow = new StateGraph(SupervisorState)
  .addNode("supervisor", supervisorNode)
  .addNode("LOAN", loanApp)
  .addNode("GENERAL", generalApp)
  .addEdge(START, "supervisor")
  .addConditionalEdges("supervisor", routeToAgent)
  .addEdge("LOAN", END)
  .addEdge("GENERAL", END);

export const app = workflow.compile({ checkpointer });
