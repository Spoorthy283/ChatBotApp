import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToolCall } from '../models/ToolCall';
import { ToolResult } from '../models/ToolResult';
import { PersonRepository } from './person.repository';

@Injectable({
  providedIn: 'root'
})
export class ToolCallHandlerService {

  constructor(private personRepository: PersonRepository) { }

  /**
   * Handles tool calls and routes them to appropriate repository functions
   * @param toolCalls - Array of tool call objects
   * @returns Observable array of tool results
   */
  handleToolCalls(toolCalls: ToolCall[]): Observable<ToolResult[]> {
    const results: Observable<ToolResult>[] = [];

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const argumentsStr = toolCall.function.arguments;
      
      console.log(`Tool called: ${toolName}`);

      let result$: Observable<any>;

      // THE BIG IF STATEMENT!!!
      if (toolName === "get_person_list") {
        result$ = this.personRepository.getPersonList();
      } else if (toolName === "get_person") {
        result$ = this.personRepository.getPerson();
      } else {
        // Handle unknown tool
        result$ = of({ error: `Unknown tool: ${toolName}` });
      }

      // Process the result and create tool result
      const toolResult$ = result$.pipe(
        map(result => ({
          role: "tool",
          content: JSON.stringify(result),
          tool_call_id: toolCall.id.toString()
        } as ToolResult)),
        catchError(error => {
          console.error(`Error executing tool ${toolName}:`, error);
          return of({
            role: "tool",
            content: JSON.stringify({ error: error.message || 'Unknown error' }),
            tool_call_id: toolCall.id.toString()
          } as ToolResult);
        })
      );

      results.push(toolResult$);
    }

    // Return all results as a single observable
    return results.length > 0 ? forkJoin(results) : of([]);
  }

}