using AiChatApi.Models;

namespace AiChatApi.Services
{
    public interface IGeminiService
    {
        Task<string> SendMessageAsync(
            string message,
            List<ChatHistoryItem> history,
            CancellationToken cancellationToken = default
        );
    }
}
