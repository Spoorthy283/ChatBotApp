import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import { ChatMessage } from '../models/ChatMessage';
import { GenerateContentResponse } from '@google/genai';
import { ToolCallHandlerService } from './tool-call-handler.service';
import { signal } from '@angular/core';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h2>🤖 AI Assistant</h2>
        <p>Ask me about people or anything else!</p>
      </div>
      
      <div class="chat-messages" #chatMessages>
        <div 
          *ngFor="let message of messages" 
          class="message"
          [ngClass]="{
            'user-message': message.role === 'user',
            'assistant-message': message.role === 'model',
            'system-message': message.role === 'system',
            'tool-message': message.role === 'tool'
          }"
        >
          <div class="message-avatar">
            <span *ngIf="message.role === 'user'">👤</span>
            <span *ngIf="message.role === 'model'">🤖</span>
            <span *ngIf="message.role === 'system'">⚙️</span>
            <span *ngIf="message.role === 'tool'">🔧</span>
          </div>
          <div class="message-content">
            <div class="message-role">{{ getRoleDisplayName(message.role) }}</div>
            <div class="message-text" [innerHTML]="formatMessage(message.parts)"></div>
          </div>
        </div>
        
        <div *ngIf="isLoading()" class="message assistant-message">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="message-role">Assistant</div>
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chat-input-container">
        <form (ngSubmit)="sendMessage()" class="chat-form">
          <div class="input-group">
            <input
              type="text"
              [(ngModel)]="currentMessage"
              placeholder="Type your message here..."
              [disabled]="isLoading()"
              name="messageInput"
              class="message-input"
              (keydown.enter)="sendMessage()"
            />
            <button 
              type="submit" 
              [disabled]="!currentMessage.trim() || isLoading()"
              class="send-button"
            >
              <span *ngIf="!isLoading()">Send</span>
              <span *ngIf="isLoading()">Sending...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 800px;
      margin: 0 auto;
      background: #f8f9fa;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      text-align: center;
    }

    .chat-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
    }

    .chat-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .user-message {
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .user-message .message-avatar {
      background: #007bff;
    }

    .assistant-message .message-avatar {
      background: #28a745;
    }

    .system-message .message-avatar {
      background: #6c757d;
    }

    .tool-message .message-avatar {
      background: #ffc107;
    }

    .message-content {
      flex: 1;
      max-width: 70%;
    }

    .user-message .message-content {
      text-align: right;
    }

    .message-role {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 4px;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .message-text {
      background: white;
      padding: 12px 16px;
      border-radius: 18px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      word-wrap: break-word;
      line-height: 1.4;
    }

    .user-message .message-text {
      background: #007bff;
      color: white;
    }

    .assistant-message .message-text {
      background: #e9ecef;
      color: #333;
    }

    .system-message .message-text {
      background: #f8f9fa;
      color: #6c757d;
      font-style: italic;
    }

    .tool-message .message-text {
      background: #fff3cd;
      color: #856404;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 12px 16px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6c757d;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(1) {
      animation-delay: -0.32s;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: -0.16s;
    }

    @keyframes typing {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    .chat-input-container {
      padding: 20px;
      background: white;
      border-top: 1px solid #e9ecef;
    }

    .chat-form {
      width: 100%;
    }

    .input-group {
      display: flex;
      gap: 12px;
    }

    .message-input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e9ecef;
      border-radius: 25px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.3s ease;
    }

    .message-input:focus {
      border-color: #007bff;
    }

    .message-input:disabled {
      background: #f8f9fa;
      cursor: not-allowed;
    }

    .send-button {
      padding: 12px 24px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 25px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .send-button:hover:not(:disabled) {
      background: #0056b3;
    }

    .send-button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    /* Scrollbar styling */
    .chat-messages::-webkit-scrollbar {
      width: 6px;
    }

    .chat-messages::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    .chat-messages::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .chat-container {
        height: 100vh;
        border-radius: 0;
      }
      
      .message-content {
        max-width: 85%;
      }
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatMessages') chatMessages!: ElementRef;

  messages: ChatMessage[] = [];
  currentMessage: string = '';
  isLoading = signal(false);

  constructor(private chatService: ChatService, private toolCallHandler: ToolCallHandlerService) {}

  ngOnInit() {
    // Add welcome message
    this.messages.push({
      role: 'model',
      parts: [{ text: 'Hello! I\'m your AI assistant. I can help you get information about people. Try asking me to "get the list of people" or "show me a person".' }]     
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading()) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: this.currentMessage.trim() }] 
    };

    this.messages.push(userMessage);
    const messageToSend = this.currentMessage.trim();
    this.currentMessage = '';
    this.isLoading.set(true);

    // Get history (excluding system messages for the API call)
    const history = this.messages.filter(msg => msg.role !== 'system');

    this.chatService.chat(messageToSend, history)
    .then((response: GenerateContentResponse) => {
      if (response.functionCalls && response.functionCalls.length > 0) 
      {
        const toolObservables = this.toolCallHandler.handleToolCalls(response.functionCalls);
        forkJoin(toolObservables).subscribe({
          next: toolResults => {
            debugger;
            this.messages.push({
              role: 'model',
              parts: [
                { text: response.text ?? '' },
                { text: JSON.stringify(toolResults) }
              ]
            });
            this.isLoading.set(false);
          },
          error: error => {
            this.messages.push({
              role: 'model',
              parts: [{ text: 'Error calling tool: ' + error }]
            });
            this.isLoading.set(false);
          }
        })
      }
      else {
        this.messages.push({
          role: 'model',
          parts: [{ text: response.text ?? 'No response from model.' }]
        });
        this.isLoading.set(false);
      }
    })
    .catch((error: unknown) => {
      console.error('Chat error:', error);
      this.messages.push({
        role: 'model',
        parts: [{ text: 'Sorry, I encountered an error. Please try again.' }]
      });
     
    });    
    
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'user': return 'You';
      case 'model': return 'Model';
      case 'tool': return 'Tool';
      default: return role;
    }
  }

  formatMessage(contents: { text: string }[]): string {
    // Simple formatting - you can enhance this with markdown support
    let formattedContent = "";
    for (let part of contents) {
      formattedContent += part.text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }
    
    return formattedContent;
  }

  private scrollToBottom() {
    try {
      if (this.chatMessages) {
        this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}
