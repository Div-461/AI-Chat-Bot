using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
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

    // Retryable HTTP status codes from Gemini
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

    public async Task<string> SendMessageAsync(
        string message,
        List<ChatHistoryItem> history,
        CancellationToken cancellationToken = default)
    {
        var apiKey = _config["Gemini:ApiKey"]
            ?? throw new InvalidOperationException("Gemini API key is not configured.");

        var model = _config["Gemini:Model"] ?? "gemini-2.5-flash";
        var baseUrl = _config["Gemini:BaseUrl"];
        var maxTokens = _config.GetValue<int>("Gemini:MaxOutputTokens", 1024);
        var temperature = _config.GetValue<float>("Gemini:Temperature", 0.7f);
        var maxRetries = _config.GetValue<int>("Gemini:MaxRetries", 3);

        var url = $"{baseUrl}/v1beta/models/{model}:generateContent?key={apiKey}";

        var contents = history
            .Select(h => new GeminiContent
            {
                Role = h.Role == "assistant" ? "model" : "user",
                Parts = [new GeminiPart { Text = h.Content }]
            })
            .ToList();

        contents.Add(new GeminiContent
        {
            Role = "user",
            Parts = [new GeminiPart { Text = message }]
        });

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

        // ── Retry loop with exponential backoff ────────────────
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            // Rebuild content each attempt (HttpContent can only be sent once)
            var content = new StringContent(json, Encoding.UTF8);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

            _logger.LogInformation(
                "Gemini request attempt {Attempt}/{Max}", attempt, maxRetries);

            var response = await _httpClient.PostAsync(url, content, cancellationToken);

            // Success path
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
                    return "I'm sorry, I couldn't generate a response. Please try again.";
                }

                _logger.LogInformation(
                    "Gemini responded successfully on attempt {Attempt}.", attempt);
                return reply;
            }

            var statusCode = (int)response.StatusCode;
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);

            // Only retry on 429 / 503
            if (!RetryableStatusCodes.Contains(statusCode) || attempt == maxRetries)
            {
                _logger.LogError(
                    "Gemini API error {Status}: {Body}", response.StatusCode, errorBody);
                throw new HttpRequestException(
                    $"Gemini API returned {response.StatusCode}");
            }

            // Exponential backoff: 2s → 4s → 8s
            var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt));
            _logger.LogWarning(
                "Gemini returned {Status} on attempt {Attempt}. " +
                "Retrying in {Delay}s...",
                statusCode, attempt, delay.TotalSeconds);

            await Task.Delay(delay, cancellationToken);
        }

        throw new HttpRequestException("Gemini API failed after all retry attempts.");
    }
}