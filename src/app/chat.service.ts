import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ChatMessage, LLMResponse } from '../models/ChatMessage';
import { ToolCall } from '../models/ToolCall';
import { ToolResult } from '../models/ToolResult';
import { ToolsService } from './tools.service';
import { ToolCallHandlerService } from './tool-call-handler.service';

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
  chat(message: string, history: ChatMessage[]): Observable<string> {
    // Build messages array with system prompt, history, and new user message
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    console.log('Messages being sent:', messages);

    return this.processChatWithTools(messages);
  }

  /**
   * Processes chat with tool calling support
   * @param messages - Array of chat messages
   * @returns Observable of final response
   */
  private processChatWithTools(messages: ChatMessage[]): Observable<string> {
    return this.callLLM(messages).pipe(
      switchMap(response => {
        const finishReason = response.choices[0].finish_reason;
        
        if (finishReason === 'tool_calls') {
          // Handle tool calls
          const message = response.choices[0].message;
          const toolCalls = message.tool_calls || [];
          
          // Add the assistant's message with tool calls to the conversation
          const updatedMessages = [
            ...messages,
            {
              role: 'assistant' as const,
              content: message.content || '',
              tool_calls: toolCalls
            }
          ];

          // Execute tool calls and get results
          return this.executeToolCalls(toolCalls).pipe(
            switchMap(toolResults => {
                        // Add tool results to messages
          const messagesWithResults = [
            ...updatedMessages,
            ...toolResults.map(result => ({
              role: 'tool' as const,
              content: result.content,
              tool_call_id: result.tool_call_id
            }))
          ];

              // Continue the conversation with tool results
              return this.processChatWithTools(messagesWithResults);
            })
          );
        } else {
          // No tool calls, return the response
          return of(response.choices[0].message.content || 'No response generated');
        }
      }),
      catchError(error => {
        console.error('Error in chat processing:', error);
        return of('Sorry, I encountered an error while processing your request.');
      })
    );
  }

  /**
   * Calls the LLM API
   * @param messages - Array of chat messages
   * @returns Observable of LLM response
   */
  private callLLM(messages: ChatMessage[]): Observable<LLMResponse> {
    const tools = this.toolsService.getAllTools();
    
    const requestBody = {
      model: "gpt-3.5-turbo", // Replace with your preferred model
      messages: messages,
      tools: tools,
      tool_choice: "auto"
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY' // Replace with your actual API key
    });

    // For demo purposes, return a mock response
    // In production, uncomment the HTTP call below
    return this.getMockResponse(messages, tools);
    
    // Uncomment this for actual API call:
    // return this.http.post<LLMResponse>(this.apiUrl, requestBody, { headers });
  }

  /**
   * Mock response for demo purposes
   * @param messages - Array of chat messages
   * @param tools - Available tools
   * @returns Observable of mock LLM response
   */
  private getMockResponse(messages: ChatMessage[], tools: any[]): Observable<LLMResponse> {
    const lastMessage = messages[messages.length - 1];
    
    // Simple mock logic - if user asks about people, trigger tool call
    if (lastMessage.content.toLowerCase().includes('person') || 
        lastMessage.content.toLowerCase().includes('people') ||
        lastMessage.content.toLowerCase().includes('list')) {
      
      return of({
        choices: [{
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [{
              id: 1,
              type: 'function',
              function: {
                name: 'get_person_list',
                description: 'Get list of people',
                arguments: '{}'
              }
            }]
          },
          finish_reason: 'tool_calls'
        }]
      });
    } else {
      return of({
        choices: [{
          message: {
            role: 'assistant',
            content: 'Hello! I can help you get information about people. Try asking me to "get the list of people" or "show me a person".'
          },
          finish_reason: 'stop'
        }]
      });
    }
  }

  /**
   * Executes tool calls and returns results
   * @param toolCalls - Array of tool calls to execute
   * @returns Observable of tool results
   */
  private executeToolCalls(toolCalls: ToolCall[]): Observable<ToolResult[]> {
    // Use the actual tool call handler service
    return this.toolCallHandler.handleToolCalls(toolCalls);
  }
}
