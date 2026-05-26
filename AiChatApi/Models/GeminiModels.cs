namespace AiChatApi.Models
{
    // ── Request to Gemini ──────────────────────────────────────────
    public class GeminiRequest
    {
        public List<GeminiContent> Contents { get; set; } = [];
        public GeminiGenerationConfig GenerationConfig { get; set; } = new();
    }

    public class GeminiContent
    {
        public string Role { get; set; } = string.Empty;  // "user" or "model"
        public List<GeminiPart> Parts { get; set; } = [];
    }

    public class GeminiPart
    {
        public string Text { get; set; } = string.Empty;
    }
    public class GeminiGenerationConfig
    {
        public int MaxOutputTokens { get; set; } = 1024;
        public float Temperature { get; set; } = 0.7f;
    }

    // ── Response from Gemini ───────────────────────────────────────
    public class GeminiResponse
    {
        public List<GeminiCandidate> Candidates { get; set; } = [];
    }

    public class GeminiCandidate
    {
        public GeminiContent Content { get; set; } = new();
    }
}
