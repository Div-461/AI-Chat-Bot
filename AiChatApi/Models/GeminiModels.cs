namespace AiChatApi.Models;

// ── Request ───────────────────────────────────────────────────
public class GeminiRequest
{
    public List<GeminiContent> Contents { get; set; } = [];
    public GeminiGenerationConfig GenerationConfig { get; set; } = new();
}

public class GeminiContent
{
    public string Role { get; set; } = string.Empty;
    public List<GeminiPart> Parts { get; set; } = [];
}

public class GeminiPart
{
    // Exactly one of these is set per part
    public string? Text { get; set; }
    public GeminiInlineData? InlineData { get; set; }
}

public class GeminiInlineData
{
    public string MimeType { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;  // base64
}

public class GeminiGenerationConfig
{
    public int MaxOutputTokens { get; set; } = 1024;
    public float Temperature { get; set; } = 0.7f;
}

// ── Response ──────────────────────────────────────────────────
public class GeminiResponse
{
    public List<GeminiCandidate> Candidates { get; set; } = [];
}

public class GeminiCandidate
{
    public GeminiContent Content { get; set; } = new();
}