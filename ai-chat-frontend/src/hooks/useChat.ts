import {useState,useCallback} from "react";
import {useMutation} from "@tanstack/react-query";
import {sendMessage} from "../api/chatApi";
import type { Message } from "../types/chat";

const newId = () => crypto.randomUUID();

export function useChat() {
    const [messages,setMessages] = useState<Message[]>([]);
    
    const {mutate,isPending,isError} = useMutation({mutationFn:sendMessage,
        onSuccess:(data) => {
            const assistantMessage: Message = {
                id: newId(),
                role:"assistant",
                content:data.reply,
                timestamp:new Date(),
            };
            setMessages((prev:any) => [...prev, assistantMessage]);
        }
    });

    const sendUserMessage = useCallback(
    (content:string) => {
        if (!content.trim()) return;

        // 1. Optimistically add user message to UI immediately
        const userMessage: Message = {
            id : newId(),
            role:"user",
            content:content.trim(),
            timestamp:new Date()
        };
        setMessages((prev) => [...prev, userMessage]);
        // 2. Fire API call with full history for context
        mutate({
            message: content.trim(),
            history: messages.map(({ role, content }) => ({ role, content })),
        });
    },
    [messages, mutate]
);
return { messages, sendUserMessage, isPending, isError };
}