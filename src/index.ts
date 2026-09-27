import { app } from "./agents/loanAffordability";
import { HumanMessage } from "@langchain/core/messages";

async function main() {
  const config = { configurable: { thread_id: "loan_simulation_1" } };

  console.log("--- Turn 1 ---");
  console.log("User: I want to buy a 12 lakh car.");
  let result = await app.invoke({
    messages: [new HumanMessage("I want to buy a 12 lakh car.")]
  }, config);
  console.log("Agent:", result.messages[result.messages.length - 1].content);
  console.log("\n");

  console.log("--- Turn 2 ---");
  console.log("User: I earn 120000 and spend 50000.");
  result = await app.invoke({
    messages: [new HumanMessage("I earn 120000 and spend 50000.")]
  }, config);
  console.log("Agent:", result.messages[result.messages.length - 1].content);
  console.log("\n");

  console.log("--- Turn 3 ---");
  console.log("User: Yeah, go ahead with the defaults.");
  result = await app.invoke({
    messages: [new HumanMessage("Yeah, go ahead with the defaults.")]
  }, config);
  console.log("Agent:", result.messages[result.messages.length - 1].content);
  console.log("\n");
}

main().catch(console.error);
