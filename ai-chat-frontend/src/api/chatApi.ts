import axios from "axios";
import type {SendMessageRequest,SendMessageResponse} from "../types/chat";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers:{
        "Content-Type":"application/json"
    }
})

export const sendMessage = async (payload:SendMessageRequest):Promise<SendMessageResponse> => {
    const {data} = await api.post<SendMessageResponse>("/api/chat",payload);
    return data;
}