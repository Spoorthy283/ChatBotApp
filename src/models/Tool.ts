import { ToolFunction } from "./ToolFunction";


export interface Tool {
  type: string;
  function: ToolFunction;
}