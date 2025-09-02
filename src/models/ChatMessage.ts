export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
}

import { ToolCall } from './ToolCall';

export interface LLMResponse {
  choices: {
    message: {
      role: string;
      content?: string;
      tool_calls?: ToolCall[];
    };
    finish_reason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  }[];
}


