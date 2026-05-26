namespace AiChatApi.Models;

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public List<ChatHistoryItem> History { get; set; } = [];
    public List<AttachmentItem> Attachments { get; set; } = [];  // ← new
}

public class ChatHistoryItem
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class AttachmentItem
{
    public string Name { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public string Base64 { get; set; } = string.Empty;
}