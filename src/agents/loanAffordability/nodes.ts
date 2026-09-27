import { AgentState } from "./state";
import { tools } from "./tools";
import { toolHandlers } from "./handlers";
import { ChatOllama } from "@langchain/ollama";
import { SystemMessage, ToolMessage, AIMessage } from "@langchain/core/messages";

const llm = new ChatOllama({
  model: "qwen3:14b",
  baseUrl: "http://localhost:11434",
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
1. If the user provides any new financial data (income, expenses, loan amount), you MUST call saveFinancialData to save it.
2. If the user says "Yeah", "Proceed", or agrees to the standard interest rate and tenure, you MUST call saveFinancialData with defaultsConfirmed set to true.
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
  
  if (lastMessage._getType() !== "ai") return {};
  
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
