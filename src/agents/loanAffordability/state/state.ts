import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

export const GraphState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  income: Annotation<number | null>({
    reducer: (state, update) => (update !== undefined ? update : state),
    default: () => null,
  }),
  expenses: Annotation<number | null>({
    reducer: (state, update) => (update !== undefined ? update : state),
    default: () => null,
  }),
  loanAmount: Annotation<number | null>({
    reducer: (state, update) => (update !== undefined ? update : state),
    default: () => null,
  }),
  interestRate: Annotation<number>({
    reducer: (state, update) => (update !== undefined ? update : state),
    default: () => 10,
  }),
  tenureMonths: Annotation<number>({
    reducer: (state, update) => (update !== undefined ? update : state),
    default: () => 60,
  }),
  defaultsConfirmed: Annotation<boolean>({
    reducer: (state, update) => (update !== undefined ? update : state),
    default: () => false,
  }),
});

export type AgentState = typeof GraphState.State;
