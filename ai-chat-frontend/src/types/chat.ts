export type MessageRole = "user" | "assistant";

export interface Message{
    id:string;
    role:MessageRole;
    content:string;
    timestamp:Date;
}

export interface SendMessageRequest{
    message:string;
    history:{
        role:MessageRole;
        content:string;
    }[];
}

export interface SendMessageResponse{
    reply:string;
}