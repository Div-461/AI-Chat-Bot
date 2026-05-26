import axios, { AxiosError } from "axios";
import type {SendMessageRequest,SendMessageResponse} from "../types/chat";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers:{
        "Content-Type":"application/json"
    }
})

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error: string }>) => {
    const message = err.response?.data?.error ?? "Something went wrong.";
    return Promise.reject(new Error(message));
  }
);

export const sendMessage = async (payload:SendMessageRequest):Promise<SendMessageResponse> => {
    const {data} = await api.post<SendMessageResponse>("/api/chat",payload);
    return data;
}