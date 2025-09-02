import { Injectable } from '@angular/core';
import { Tool } from '../models/Tool';
import { ToolFunction } from '../models/ToolFunction';



@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  
  private getPersonListJson: ToolFunction = {
    name: "get_person_list",
    description: "Use this tool to get the list of people",
    arguments: undefined
  };

  private getPersonJson: ToolFunction = {
    name: "get_person",
    description: "Use this tool to get first person from the list",
    arguments: undefined
  };

  private tools: Tool[] = [
    { "type": "function", "function": this.getPersonListJson },
    { "type": "function", "function": this.getPersonJson }
  ];

  constructor() { }

  /**
   * Returns all available tools
   * @returns Array of tool objects
   */
  getAllTools(): Tool[] {
    return this.tools;
  }

}
