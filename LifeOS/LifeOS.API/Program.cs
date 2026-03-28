using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using LifeOS.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger/OpenAPI with JWT support
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "LifeOS API",
        Version = "v1",
        Description = "Personal Productivity System API",
        Contact = new OpenApiContact
        {
            Name = "LifeOS",
            Email = "support@lifeos.app"
        }
    });

    // Add JWT Authentication to Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// JWT Configuration
var jwtKey = builder.Configuration["Jwt:Key"] ?? "LifeOS_Super_Secret_Key_For_JWT_Token_Generation_MinimumLength32Characters!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "LifeOS.API";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "LifeOS.Web";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Configure CORS for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalDevelopment", policy =>
    {
        policy.SetIsOriginAllowed(origin => 
            origin.StartsWith("http://localhost") || 
            origin.StartsWith("http://127.0.0.1") ||
            origin.StartsWith("https://localhost") ||
            origin.StartsWith("https://127.0.0.1"))
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });
});

// Register services (Dependency Injection)
builder.Services.AddSingleton(typeof(JsonStorageService<>));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<NotesService>();
builder.Services.AddScoped<GoalsService>();
builder.Services.AddScoped<DeadlinesService>();
builder.Services.AddScoped<RoutinesService>();
builder.Services.AddScoped<ThoughtsService>();

// Ensure Data directory exists
var dataPath = Path.Combine(Directory.GetCurrentDirectory(), "Data");
if (!Directory.Exists(dataPath))
{
    Directory.CreateDirectory(dataPath);
}

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "LifeOS API v1");
    c.RoutePrefix = string.Empty; // Serve Swagger UI at root
});

// Comment out HTTPS redirect for local development
// app.UseHttpsRedirection();

app.UseCors("AllowLocalDevelopment");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
