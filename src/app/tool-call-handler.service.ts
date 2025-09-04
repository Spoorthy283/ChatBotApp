import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToolCall } from '../models/ToolCall';
import { ToolResult } from '../models/ToolResult';
import { PersonRepository } from './person.repository';
import { FunctionCall } from '@google/genai';

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
  handleToolCalls(toolCalls: FunctionCall[]) {
    let results$: Observable<any>[] = [];
      for (const toolCall of toolCalls) {
        const toolName = toolCall.name;
        
        if (toolName === "get_person_list") {
          results$.push(this.personRepository.getPersonList());
        } else if (toolName === "get_person") {
          results$.push(this.personRepository.getPerson());
        } else {
          results$.push(of({ error: `Unknown tool: ${toolName}` }));
        }
      }    
      return results$;    
  }
}