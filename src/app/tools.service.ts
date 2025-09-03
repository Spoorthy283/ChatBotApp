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
    parameters: undefined
  };

  private getPersonJson: ToolFunction = {
    name: "get_person",
    description: "Use this tool to get first person from the list",
    parameters: undefined
  };

  private tools = [
    this.getPersonListJson,
    this.getPersonJson
  ];

  constructor() { }

  /**
   * Returns all available tools
   * @returns Array of tool objects
   */
  getAllTools(): ToolFunction[] {
    return this.tools;
  }

}
