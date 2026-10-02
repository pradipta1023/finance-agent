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
1. If the user asks about loan types or rates, use fetchLiveInterestRates to get the current rate.
2. You MUST ask the user for explicit consent before calling initiateCreditCheck. Once they consent, run the initiateCreditCheck tool.
3. If the user provides any new financial data (income, expenses, loan amount, interest rate, or tenure), you MUST call saveFinancialData to save it.
4. You must ensure the user has explicitly agreed to BOTH the interest rate and the tenure. ONLY when they explicitly confirm both, OR provide custom values for both, you MUST call saveFinancialData with defaultsConfirmed set to true. Do not assume tenure if they only give the rate.
5. If income, expenses, or loanAmount is NULL, ask the user for the remaining missing fields.
6. If core fields are present but defaultsConfirmed is false: If the user provided one term (e.g., rate) but not the other (e.g., tenure), explicitly ask them for the missing term. If they provided neither, say exactly: "We are using a standard interest rate of 10% over 60 months. Proceed or change?"
7. If defaultsConfirmed is true AND all core data is present, you MUST call evaluateLoan. Do not calculate manually.
8. After you call evaluateLoan and present the basic affordability verdict to the user, you MUST ask if they would like to proceed with a formal pre-approval. Tell them this requires a soft credit check and explicitly ask for their consent. If they consent, call initiateCreditCheck.`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...messages,
  ]);

  return { messages: [response] };
};

const executeTools = async (state: AgentState, allowedTools: string[]) => {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (lastMessage?._getType() !== "ai") return {};
  
  const aiMessage = lastMessage as AIMessage;
  if (!aiMessage.tool_calls || aiMessage.tool_calls.length === 0) return {};

  const toolMessages: ToolMessage[] = [];
  let stateUpdates: Partial<AgentState> = {};

  for (const toolCall of aiMessage.tool_calls) {
    if (!allowedTools.includes(toolCall.name)) continue;

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

export const safeToolsNode = (state: AgentState) => executeTools(state, ["saveFinancialData", "evaluateLoan", "fetchLiveInterestRates"]);
export const sensitiveToolsNode = (state: AgentState) => executeTools(state, ["initiateCreditCheck"]);
