# AI Chat Bot

A full-stack AI chat application powered by Google Gemini, built with React (TypeScript) and ASP.NET Core Web API.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?logo=google&logoColor=white)

---

## Features

- 💬 Real-time AI chat powered by Google Gemini 2.5 Flash
- 📎 File attachments — PDF, images (PNG, JPG, WEBP), plain text, and CSV
- 📝 Markdown rendering in AI responses (bold, lists, code blocks, tables)
- 📋 One-click copy for any message
- ⚡ Optimistic UI — your messages appear instantly before the API responds
- 🔁 Automatic retry with smart backoff on rate limit and service errors
- 🧠 Full conversation history sent with each request for context-aware replies
- 📱 Responsive layout — works on mobile, tablet, and desktop
- 🔒 API key stays on the server — never exposed to the browser

---

## Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| @tanstack/react-query | Server state and mutation handling |
| axios | HTTP client with interceptors |
| react-markdown | Renders Gemini's markdown responses |
| lucide-react | Icon set |
| clsx | Conditional class names |

### Backend
| Tool | Purpose |
|---|---|
| ASP.NET Core 8 Web API | REST API server |
| IHttpClientFactory | Managed HTTP connections to Gemini |
| Swashbuckle (Swagger) | API documentation and testing |
| .NET User Secrets | Local API key storage |

---

## Project Structure

```
ai-chat/
├── ai-chat-frontend/               # React frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── chatApi.ts          # Axios API calls
│   │   ├── components/
│   │   │   ├── AttachmentPreview.tsx  # File pills in input area
│   │   │   ├── ChatBubble.tsx         # Single message bubble
│   │   │   ├── ChatInput.tsx          # Textarea + send + paperclip
│   │   │   ├── ChatWindow.tsx         # Scrollable message list
│   │   │   └── TypingIndicator.tsx    # Animated dots while waiting
│   │   ├── hooks/
│   │   │   └── useChat.ts          # All chat state and logic
│   │   ├── types/
│   │   │   └── chat.ts             # Shared TypeScript interfaces
│   │   ├── utils/
│   │   │   └── fileUtils.ts        # File validation and base64 helpers
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.local                  # Local environment variables (gitignored)
│   └── vite.config.ts
│
└── AiChatApi/                      # .NET backend
    ├── Controllers/
    │   └── ChatController.cs       # POST /api/chat endpoint
    ├── Models/
    │   ├── ChatRequest.cs          # Incoming request shape
    │   ├── ChatResponse.cs         # Outgoing response shape
    │   └── GeminiModels.cs         # Gemini API JSON models
    ├── Services/
    │   ├── IGeminiService.cs       # Service interface
    │   └── GeminiService.cs        # Gemini API integration + retry logic
    ├── appsettings.json
    ├── appsettings.Development.json
    └── Program.cs
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [.NET SDK 8.0](https://dotnet.microsoft.com/download)
- A free [Google AI Studio](https://aistudio.google.com) account

### 1. Get a Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **Get API key** → **Create API key in new project**
4. Copy the key — you will need it in Step 4

### 2. Clone the repository

```bash
git clone https://github.com/your-username/ai-chat.git
cd ai-chat
```

### 3. Frontend setup

```bash
cd ai-chat-frontend
npm install
```

Create `.env.local` in the frontend root:

```env
VITE_API_BASE_URL=https://localhost:7110
```

> Replace `7110` with whatever port your .NET backend runs on.

### 4. Backend setup

```bash
cd AiChatApi

# Restore packages
dotnet restore

# Store your Gemini API key securely (never commit this)
dotnet user-secrets init
dotnet user-secrets set "Gemini:ApiKey" "YOUR_API_KEY_HERE"

# Trust the local HTTPS dev certificate (one-time)
dotnet dev-certs https --trust
```

### 5. Run both servers

Open two terminals:

```bash
# Terminal 1 — Frontend (http://localhost:5173)
cd ai-chat-frontend
npm run dev

# Terminal 2 — Backend (https://localhost:7110)
cd AiChatApi
dotnet watch run
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Configuration

All Gemini settings live in `AiChatApi/appsettings.json`:

```json
{
  "Gemini": {
    "ApiKey": "",
    "BaseUrl": "https://generativelanguage.googleapis.com",
    "Model": "gemini-2.5-flash-lite",
    "MaxOutputTokens": 1024,
    "Temperature": 0.7,
    "MaxRetries": 3
  },
  "Cors": {
    "AllowedOrigins": [ "http://localhost:5173" ]
  }
}
```

| Setting | Description | Default |
|---|---|---|
| `Model` | Gemini model to use | `gemini-2.5-flash-lite` |
| `MaxOutputTokens` | Maximum length of each AI response (~750 words at 1024) | `1024` |
| `Temperature` | Creativity dial — `0.0` = factual, `1.0` = creative | `0.7` |
| `MaxRetries` | How many times to retry on `429`/`503` errors | `3` |

### Choosing a model

| Model | RPM | RPD (free tier) | Best for |
|---|---|---|---|
| `gemini-2.5-flash-lite` | 15 | 1,000 | ✅ Recommended — highest free quota |
| `gemini-2.5-flash` | 10 | 250 | Better quality, lower quota |
| `gemini-2.5-pro` | 5 | 50 | Highest quality, trial only |

---

## API Reference

### `POST /api/chat`

Send a message and receive an AI reply.

**Request body:**
```json
{
  "message": "What does this document say about refunds?",
  "history": [
    { "role": "user",      "content": "Hello!" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ],
  "attachments": [
    {
      "name":     "contract.pdf",
      "mimeType": "application/pdf",
      "base64":   "JVBERi0xLjQK..."
    }
  ]
}
```

**Success response `200`:**
```json
{
  "reply": "The document states that refunds must be requested within 30 days..."
}
```

**Error response `502`:**
```json
{
  "error": "Daily request quota exceeded. Please try again tomorrow."
}
```

---

## Supported Attachment Types

| Type | MIME type | Max size |
|---|---|---|
| PDF | `application/pdf` | 10 MB |
| PNG | `image/png` | 10 MB |
| JPG / JPEG | `image/jpeg` | 10 MB |
| WEBP | `image/webp` | 10 MB |
| Plain text | `text/plain` | 10 MB |
| CSV | `text/csv` | 10 MB |

Up to **5 files** can be attached per message.

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `https://localhost:7110` |

> Variables must be prefixed with `VITE_` to be accessible in the browser. **Never** put your Gemini API key here.

### Backend (via .NET User Secrets or environment variables)

| Key | Description |
|---|---|
| `Gemini__ApiKey` | Your Google AI Studio API key |

In production, set this as an environment variable on your hosting platform:

```bash
# Example for Linux / Docker
export Gemini__ApiKey="your-api-key-here"
```

---

## Security Best Practices

- ✅ Gemini API key is stored in .NET User Secrets locally — never in source code
- ✅ API key is injected via environment variables in production
- ✅ `.env.local` is gitignored — never committed
- ✅ The browser never communicates directly with Gemini — all requests go through the backend
- ✅ File type and size validation on the frontend before upload
- ✅ CORS policy restricts which origins can call the API

---

## Error Handling

| Error | Cause | Behaviour |
|---|---|---|
| `429 Too Many Requests` | Daily quota exceeded | Retries with Gemini's suggested delay, then shows quota message |
| `503 Service Unavailable` | Gemini under high load | Retries up to 3 times with exponential backoff |
| `401 Unauthorized` | Invalid API key | Shows configuration error message |
| Network error | Backend unreachable | Shows connection error in chat UI |

---

## Development Tips

- Use **Swagger UI** at `https://localhost:7110/swagger` to test the API independently from the frontend
- `dotnet watch run` hot-reloads the backend on any file change
- `npm run dev` (Vite) hot-reloads the frontend instantly
- If you hit the free quota (`429`), switch `Model` to `gemini-2.5-flash-lite` in `appsettings.json` for a higher daily limit
- Conversation history is sent with every request — longer conversations consume more tokens per request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

- [Google AI Studio](https://aistudio.google.com) — Gemini API
- [Vite](https://vitejs.dev) — Frontend tooling
- [TanStack Query](https://tanstack.com/query) — Server state management
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Lucide](https://lucide.dev) — Icons
