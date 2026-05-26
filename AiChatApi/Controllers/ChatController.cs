using AiChatApi.Models;
using AiChatApi.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AiChatApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly IGeminiService _geminiService;
        private readonly ILogger<ChatController> _logger;
        public ChatController(IGeminiService geminiService, ILogger<ChatController> logger)
        {
            _logger = logger;
            _geminiService = geminiService;
        }

        [HttpPost]
        [ProducesResponseType(typeof(ChatResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> SendMessage(
        [FromBody] ChatRequest request,
        CancellationToken cancellationToken)
        {
            // Basic validation
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(new { error = "Message cannot be empty." });

            _logger.LogInformation(
                "Chat request received. Message length: {Length}",
                request.Message.Length);

            try
            {
                var reply = await _geminiService.SendMessageAsync(
                    request.Message,
                    request.History,
                    request.Attachments,
                    cancellationToken
                );

                return Ok(new ChatResponse { Reply = reply });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Gemini service error.");
                return StatusCode(502,
                    new { error = "Failed to reach the AI service. Please try again." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in ChatController.");
                return StatusCode(500,
                    new { error = "An unexpected error occurred." });
            }
        }
    }
}
