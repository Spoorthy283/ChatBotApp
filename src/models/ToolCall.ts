import { ToolFunction } from "./ToolFunction";

export interface ToolCall {
  type: string;
  function: ToolFunction;
  id: number;
}