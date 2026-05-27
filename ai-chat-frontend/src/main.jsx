import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AuthProvider } from "./components/AuthContext";
import "./css/index.css";

const queryClient = new QueryClient();
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

if (!googleClientId) {
  throw new Error("Missing VITE_GOOGLE_CLIENT_ID in .env.local");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
