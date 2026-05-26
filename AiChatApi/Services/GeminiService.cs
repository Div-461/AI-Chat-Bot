using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using AiChatApi.Models;

namespace AiChatApi.Services;

public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<GeminiService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    private static readonly HashSet<int> RetryableStatusCodes = [429, 503];

    public GeminiService(
        HttpClient httpClient,
        IConfiguration config,
        ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    // ── Signature now accepts attachments ─────────────────────
    public async Task<string> SendMessageAsync(
        string message,
        List<ChatHistoryItem> history,
        List<AttachmentItem> attachments,          // ← new
        CancellationToken cancellationToken = default)
    {
        var apiKey = _config["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API key is not configured.");

        var model = _config["Gemini:Model"] ?? "gemini-2.5-flash-lite";
        var baseUrl = _config["Gemini:BaseUrl"];
        var maxTokens = _config.GetValue<int>("Gemini:MaxOutputTokens", 1024);
        var temperature = _config.GetValue<float>("Gemini:Temperature", 0.7f);
        var maxRetries = _config.GetValue<int>("Gemini:MaxRetries", 3);

        var url = $"{baseUrl}/v1beta/models/{model}:generateContent?key={apiKey}";

        // ── Map conversation history (unchanged) ───────────────
        var contents = history
            .Select(h => new GeminiContent
            {
                Role = h.Role == "assistant" ? "model" : "user",
                Parts = [new GeminiPart { Text = h.Content }]
            })
            .ToList();

        // ── Build parts for the new user message ───────────────
        // Attachments come FIRST, text prompt comes LAST
        // (Gemini reads inline data before the instruction)
        var userParts = new List<GeminiPart>();

        foreach (var attachment in attachments)
        {
            if (string.IsNullOrWhiteSpace(attachment.Base64)) continue;

            userParts.Add(new GeminiPart
            {
                InlineData = new GeminiInlineData
                {
                    MimeType = attachment.MimeType,
                    Data = attachment.Base64,
                }
            });

            _logger.LogInformation(
                "Attaching file: {Name} ({MimeType})", attachment.Name, attachment.MimeType);
        }

        // Always add the text part last
        // If message is empty (attachment-only), send a default prompt
        userParts.Add(new GeminiPart
        {
            Text = string.IsNullOrWhiteSpace(message)
                ? "Please analyse the attached file(s) and describe what you see."
                : message
        });

        contents.Add(new GeminiContent
        {
            Role = "user",
            Parts = userParts
        });

        // ── Serialize ──────────────────────────────────────────
        var requestBody = new GeminiRequest
        {
            Contents = contents,
            GenerationConfig = new GeminiGenerationConfig
            {
                MaxOutputTokens = maxTokens,
                Temperature = temperature
            }
        };

        var json = JsonSerializer.Serialize(requestBody, JsonOptions);

        // ── Retry loop (unchanged logic, smarter delay) ────────
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            var content = new StringContent(json, Encoding.UTF8);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            _logger.LogInformation(
                "Gemini request attempt {Attempt}/{Max} | Attachments: {Count}",
                attempt, maxRetries, attachments.Count);

            var response = await _httpClient.PostAsync(url, content, cancellationToken);

            // ── Success ────────────────────────────────────────
            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content
                    .ReadAsStringAsync(cancellationToken);

                var geminiResponse = JsonSerializer
                    .Deserialize<GeminiResponse>(responseJson, JsonOptions);

                var reply = geminiResponse?
                    .Candidates.FirstOrDefault()?
                    .Content.Parts.FirstOrDefault()?
                    .Text;

                if (string.IsNullOrWhiteSpace(reply))
                {
                    _logger.LogWarning("Gemini returned an empty response.");
                    return "I couldn't generate a response. Please try again.";
                }

                _logger.LogInformation(
                    "Gemini responded successfully on attempt {Attempt}.", attempt);
                return reply;
            }

            // ── Error ──────────────────────────────────────────
            var statusCode = (int)response.StatusCode;
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);

            _logger.LogWarning(
                "Gemini returned {Status} on attempt {Attempt}: {Body}",
                statusCode, attempt, errorBody);

            if (!RetryableStatusCodes.Contains(statusCode) || attempt == maxRetries)
            {
                var friendlyMessage = statusCode switch
                {
                    429 => "Daily request quota exceeded. Please try again tomorrow or upgrade your Google AI plan.",
                    503 => "The AI service is temporarily unavailable. Please try again shortly.",
                    401 => "Invalid API key. Please check your configuration.",
                    _ => $"AI service error ({statusCode}). Please try again."
                };
                throw new HttpRequestException(friendlyMessage);
            }

            // ── Smart delay: read Gemini's retryDelay if present
            var delay = ParseRetryDelay(errorBody)
                        ?? TimeSpan.FromSeconds(Math.Pow(2, attempt));

            _logger.LogWarning(
                "Retrying in {Delay}s (attempt {Attempt}/{Max})...",
                delay.TotalSeconds, attempt, maxRetries);

            await Task.Delay(delay, cancellationToken);
        }

        throw new HttpRequestException("Gemini API failed after all retry attempts.");
    }

    // ── Reads "retryDelay": "30.3s" from Gemini's error JSON ──
    private static TimeSpan? ParseRetryDelay(string errorBody)
    {
        try
        {
            var node = JsonNode.Parse(errorBody);
            var details = node?["error"]?["details"]?.AsArray();
            if (details is null) return null;

            foreach (var detail in details)
            {
                var retryDelay = detail?["retryDelay"]?.GetValue<string>();
                if (retryDelay is not null && retryDelay.EndsWith("s"))
                {
                    if (double.TryParse(
                            retryDelay.TrimEnd('s'),
                            System.Globalization.NumberStyles.Float,
                            System.Globalization.CultureInfo.InvariantCulture,
                            out var seconds))
                    {
                        return TimeSpan.FromSeconds(seconds + 1);
                    }
                }
            }
        }
        catch
        {
            // Fall back to exponential backoff
        }

        return null;
    }
}