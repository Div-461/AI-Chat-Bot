using AiChatApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers & Swagger ──────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "AiChat API",
        Version = "v1",
        Description = "ASP.NET Core backend for Gemini-powered chat"
    });
});

// ── CORS ───────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ── Gemini HTTP client + Service ───────────────────────────────
// IHttpClientFactory handles connection pooling — best practice
// for any outbound HTTP calls in .NET
builder.Services.AddHttpClient<IGeminiService, GeminiService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ── Build & configure pipeline ─────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AiChat API v1");
        c.RoutePrefix = "swagger"; // access at /swagger
    });
}

app.UseHttpsRedirection();
app.UseCors("FrontendPolicy");   // must be before MapControllers
app.UseAuthorization();
app.MapControllers();

app.Run();