import { Annotation, StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { app as loanApp } from "./agents/loanAffordability/index.js";

const llm = new ChatOllama({ model: "qwen3:14b", temperature: 0 });

const SupervisorState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (currentState, newMessages) => currentState.concat(newMessages),
    default: () => [],
  }),
  nextRoute: Annotation<string>({
    reducer: (current, update) => update !== undefined ? update : current,
    default: () => "GENERAL",
  })
});

const supervisorNode = async (state: typeof SupervisorState.State) => {
  const routeSchema = z.object({
    reasoning: z.string().describe("Why you chose this route"),
    nextAgent: z.enum(["LOAN", "GENERAL"]).describe("The agent to route to.")
  });

  const routerLlm = llm.withStructuredOutput(routeSchema, { name: "Router" });

  const sysMsg = new SystemMessage(`You are a routing supervisor. 
    If the user mentions buying a car, loans, affordability, or EMI, route to "LOAN".
    For EVERYTHING ELSE (general finance, greetings, what is X), route to "GENERAL".`);

  const decision = await routerLlm.invoke([sysMsg, ...state.messages]);

  console.log(`\n[Supervisor] Decided to route to: ${decision.nextAgent}`);
  console.log(`[Supervisor] Reasoning: ${decision.reasoning}\n`);

  return { nextRoute: decision.nextAgent };
}

const generalChatNode = async (state: typeof SupervisorState.State) => {
  const sysMsg = new SystemMessage("You are a helpful general finance assistant. Answer concisely.");
  const response = await llm.invoke([sysMsg, ...state.messages]);
  return { messages: [response] };
}

const route = (state: typeof SupervisorState.State) => {
  if (state.nextRoute === "LOAN") return "loanAgent";
  return "generalChat";
}

const workflow = new StateGraph(SupervisorState)
  .addNode("supervisor", supervisorNode)
  .addNode("generalChat", generalChatNode)
  .addNode("loanAgent", loanApp)
  .addEdge(START, "supervisor")
  .addConditionalEdges("supervisor", route)
  .addEdge("generalChat", END)
  .addEdge("loanAgent", END);

const supervisorApp = workflow.compile({ checkpointer: new MemorySaver() });

const main = async () => {
  const config = { configurable: { thread_id: "multi_agent_test_1" } };

  console.log("--- TEST 1: General Question ---");
  const res1 = await supervisorApp.invoke({
    messages: [new HumanMessage("What is an ETF?")]
  }, config);
  // @ts-ignore
  console.log("Agent:", res1.messages[res1.messages.length - 1].content);

  console.log("\n--- TEST 2: Triggering the Subgraph ---");
  const res2 = await supervisorApp.invoke({
    messages: [new HumanMessage("Actually, I want to buy a 12 lakh car. Can I afford it?")]
  }, config);
  // @ts-ignore
  console.log("Agent:", res2.messages[res2.messages.length - 1].content);
}

main().catch(console.error);