namespace AiChatApi.Models
{
    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public List<ChatHistoryItem> History { get; set; } = [];
    }

    public class ChatHistoryItem
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
