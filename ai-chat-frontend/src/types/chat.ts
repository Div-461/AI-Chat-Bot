export type MessageRole = "user" | "assistant";

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  base64: string;
  size: number;
}

export interface Message{
    id:string;
    role:MessageRole;
    content:string;
    timestamp:Date;
    attachments?: Attachment[];
}

export interface SendMessageRequest{
    message:string;
    history:{
        role:MessageRole;
        content:string;
    }[];
    attachments?: {               
    name: string;
    mimeType: string;
    base64: string;
    }[];
    sessionId?:  string;
}

export interface SendMessageResponse{
    reply:string;
}