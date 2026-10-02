import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const saveFinancialDataTool = tool(
  async () => {
    // The actual state modification will be handled in the custom tool node
    return "Data saved.";
  },
  {
    name: "saveFinancialData",
    description: "Extracts and saves financial data provided by the user.",
    schema: z.object({
      income: z.number().optional().describe("User's monthly income"),
      expenses: z.number().optional().describe("User's monthly expenses"),
      loanAmount: z.number().optional().describe("Requested loan amount"),
      interestRate: z.number().optional().describe("Annual interest rate in percentage"),
      tenureMonths: z.number().optional().describe("Loan tenure in months"),
      defaultsConfirmed: z.boolean().optional().describe("Whether the user has confirmed the default interest rate and tenure"),
    }),
  }
);

export const evaluateLoanTool = tool(
  async () => {
    // The actual loan evaluation logic will be handled in the custom tool node
    return "Evaluation complete.";
  },
  {
    name: "evaluateLoan",
    description: "Evaluates whether the loan can be approved based on the saved financial data.",
    schema: z.object({}),
  }
);

export const fetchLiveInterestRatesTool = tool(
  async () => {
    return "Rates fetched.";
  },
  {
    name: "fetchLiveInterestRates",
    description: "Fetches current live interest rates based on the loan type.",
    schema: z.object({
      loanType: z.enum(["auto", "home", "personal"]).describe("The type of loan to fetch rates for."),
    }),
  }
);

export const initiateCreditCheckTool = tool(
  async () => {
    return "Credit check initiated.";
  },
  {
    name: "initiateCreditCheck",
    description: "Initiates a soft credit check. This requires explicit user consent.",
    schema: z.object({
      userConsentConfirmed: z.boolean().describe("Whether the user has explicitly consented to the credit check."),
    }),
  }
);

export const tools = [saveFinancialDataTool, evaluateLoanTool, fetchLiveInterestRatesTool, initiateCreditCheckTool];
