import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { ChatMessage, LLMResponse } from '../models/ChatMessage';

import { ToolsService } from './tools.service';
import { ToolCallHandlerService } from './tool-call-handler.service';
import { GoogleGenAI, Type } from '@google/genai';
import { AppConfig } from './config';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions'; // Replace with your LLM API
  private readonly systemPrompt = "You are a helpful assistant that can help users with various tasks. You have access to tools to get information about people.";

  constructor(
    private http: HttpClient,
    private toolsService: ToolsService,
    private toolCallHandler: ToolCallHandlerService
  ) {}

  /**
   * Main chat function that handles the conversation flow
   * @param message - User's message
   * @param history - Previous chat history
   * @returns Observable of assistant's response
   */
  chat(message: string, history: ChatMessage[]) {
    // Build messages array with system prompt, history, and new user message
    const messages: ChatMessage[] = [
      { role: 'user', parts: [{ text: this.systemPrompt }]},
      ...history,
      { role: 'user', parts: [{ text: message }]  }
    ];

    console.log('Messages being sent:', messages);

    return this.processChatWithTools(messages);
  }

  /**
   * Processes chat with tool calling support
   * @param messages - Array of chat messages
   * @returns Observable of final response
   */
  private processChatWithTools(messages: ChatMessage[]) {

    const tools = this.toolsService.getAllTools();
   debugger;

// Configure the client
    const ai = new GoogleGenAI({
        apiKey: AppConfig.genaiApiKey
    });
    const response = ai.models.generateContent({
        model: AppConfig.genaiModel,
        contents: messages,
        config: {
            tools: [{
                functionDeclarations: tools
            }],
        },
    });
    return response;
  }
}
