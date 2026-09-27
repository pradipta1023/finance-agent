import { AgentState } from "./state";
import { ToolMessage } from "@langchain/core/messages";

// --- Helper Functions ---

const extractStateUpdates = (args: any): Partial<AgentState> => {
  const updates: Partial<AgentState> = {};
  const updatableKeys: (keyof AgentState)[] = [
    "income", "expenses", "loanAmount", "interestRate", "tenureMonths", "defaultsConfirmed"
  ];
  
  for (const key of updatableKeys) {
    if (args[key] !== undefined) {
      // @ts-ignore - Dynamic key assignment
      updates[key] = args[key];
    }
  }
  return updates;
};

const calculateEMI = (principal: number, annualInterestRate: number, tenureMonths: number): number => {
  const R = (annualInterestRate / 100) / 12;
  if (R === 0) return principal / tenureMonths;
  return (principal * R * Math.pow(1 + R, tenureMonths)) / (Math.pow(1 + R, tenureMonths) - 1);
};

const evaluateLoanApproval = (income: number, expenses: number, emi: number) => {
  const totalOutflow = expenses + emi;
  const isApproved = totalOutflow <= (income * 0.6);
  const outflowPercentage = (totalOutflow / income) * 100;
  return { isApproved, outflowPercentage };
};

// --- Tool Handlers Setup ---

export type ToolHandlerResult = { toolMessage: ToolMessage, updates?: Partial<AgentState> };
export type ToolHandler = (args: any, state: AgentState, stateUpdates: Partial<AgentState>, toolCallId: string) => ToolHandlerResult;

const handleSaveFinancialData: ToolHandler = (args, _state, _stateUpdates, toolCallId) => {
  const updates = extractStateUpdates(args);
  
  const toolMessage = new ToolMessage({
    content: "Data saved.",
    name: "saveFinancialData",
    tool_call_id: toolCallId,
  });

  return { toolMessage, updates };
};

const handleEvaluateLoan: ToolHandler = (_args, state, stateUpdates, toolCallId) => {
  const { 
    income, 
    expenses, 
    loanAmount, 
    interestRate, 
    tenureMonths, 
    defaultsConfirmed 
  } = { ...state, ...stateUpdates };

  if (income === null || expenses === null || loanAmount === null) {
     throw new Error("Cannot evaluate loan: missing core financial data (income, expenses, or loanAmount).");
  }
  
  if (!defaultsConfirmed) {
     throw new Error("Cannot evaluate loan: user has not confirmed the defaults (interest rate and tenure). Please ask the user to confirm or change the defaults.");
  }

  const emi = calculateEMI(loanAmount, interestRate, tenureMonths);
  const { isApproved, outflowPercentage } = evaluateLoanApproval(income, expenses, emi);
  
  const verdict = isApproved ? "APPROVED" : "REJECTED";
  const resultMessage = `Evaluation Result: ${verdict}\nEMI: ${emi.toFixed(2)}\nTotal Outflow Percentage: ${outflowPercentage.toFixed(2)}%`;

  return {
    toolMessage: new ToolMessage({
      content: resultMessage,
      name: "evaluateLoan",
      tool_call_id: toolCallId,
    })
  };
};

// Dispatch Object Mapping Tool Names to their Handlers
export const toolHandlers: Record<string, ToolHandler> = {
  saveFinancialData: handleSaveFinancialData,
  evaluateLoan: handleEvaluateLoan,
};
