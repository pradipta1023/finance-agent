import type { AgentState } from "../state/state.js";
import { tools } from "../tools/tools.js";
import { toolHandlers } from "../handlers/handlers.js";
import { ChatOllama } from "@langchain/ollama";
import { SystemMessage, ToolMessage, AIMessage } from "@langchain/core/messages";
import { z } from "zod";

const extractorSchema = z.object({
  chainOfThought: z.string().describe("Step-by-step reasoning to find income and expenses from the conversation."),
  income: z.number().nullable().describe("Extracted monthly income. Null if not mentioned."),
  expenses: z.number().nullable().describe("Extracted monthly expenses. Null if not mentioned."),
});

export const extractorNode = async (state: AgentState) => {
  const extractorLlm = new ChatOllama({
    model: "qwen3:14b",
    baseUrl: "http://localhost:11434",
    temperature: 0,
    name: "extractor_llm",
  }).withStructuredOutput(extractorSchema, { name: "extractor" });

  const result = await extractorLlm.invoke([
    new SystemMessage("You are a background financial data extractor. Analyze the conversation history and extract the user's monthly income and expenses. Think step-by-step in the chainOfThought field before extracting."),
    ...state.messages,
  ]);

  const updates: Partial<AgentState> = {};
  if (result.income !== null && result.income !== undefined) updates.income = result.income;
  if (result.expenses !== null && result.expenses !== undefined) updates.expenses = result.expenses;

  return updates;
};

const llm = new ChatOllama({
  model: "qwen3:14b",
  baseUrl: "http://localhost:11434",
  name: "agent_llm",
}).bindTools(tools);

export const agentNode = async (state: AgentState) => {
  const { income, expenses, loanAmount, interestRate, tenureMonths, defaultsConfirmed, messages } = state;

  const systemPrompt = `You are a Loan Affordability Agent.
Your goal is to collect financial data and evaluate a loan application.

CURRENT STATE:
- Income: ${income !== null ? income : "NULL"}
- Expenses: ${expenses !== null ? expenses : "NULL"}
- Loan Amount: ${loanAmount !== null ? loanAmount : "NULL"}
- Interest Rate: ${interestRate}%
- Tenure: ${tenureMonths} months
- Defaults Confirmed: ${defaultsConfirmed}

CRITICAL RULES:
1. If the user provides any new financial data (income, expenses, loan amount, interest rate, or tenure), you MUST call saveFinancialData to save it.
2. If the user agrees to the standard terms, OR if they specify their own custom interest rate or tenure, you MUST call saveFinancialData with defaultsConfirmed set to true (along with their custom values if provided).
3. If income, expenses, or loanAmount is NULL, ask the user for the remaining missing fields.
4. If core fields (income, expenses, loanAmount) are present and defaultsConfirmed is false, tell the user exactly this: "We are using a standard interest rate of 10% over 60 months. Proceed or change?"
5. If defaultsConfirmed is true AND all core data is present, you MUST call evaluateLoan. Do not calculate manually.
6. Present final verdict exactly as the tool output states.
7. When you receive the Evaluation Result, immediately output it to the user. Do NOT ask for further confirmation.`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...messages,
  ]);

  return { messages: [response] };
};

export const executeToolNode = async (state: AgentState) => {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage?._getType() !== "ai") return {};
  
  const aiMessage = lastMessage as AIMessage;
  if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) return {};

  const toolMessages: ToolMessage[] = [];
  let stateUpdates: Partial<AgentState> = {};

  for (const toolCall of aiMessage.tool_calls) {
    try {
      const handler = toolHandlers[toolCall.name];
      if (!handler) {
        throw new Error(`Unknown tool: ${toolCall.name}`);
      }

      const { toolMessage, updates } = handler(toolCall.args, state, stateUpdates, toolCall.id!);
      toolMessages.push(toolMessage);
      
      if (updates) {
        stateUpdates = { ...stateUpdates, ...updates };
      }
    } catch (error: any) {
      toolMessages.push(
        new ToolMessage({
          content: `Error executing tool: ${error.message}`,
          name: toolCall.name,
          tool_call_id: toolCall.id!,
        })
      );
    }
  }

  return {
    messages: toolMessages,
    ...stateUpdates,
  };
};
