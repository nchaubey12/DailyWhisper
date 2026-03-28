using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using LifeOS.API.Models;

namespace LifeOS.API.Services;

public class AuthService
{
    private readonly JsonStorageService<User> _userStorage;
    private readonly IConfiguration _configuration;

    public AuthService(JsonStorageService<User> userStorage, IConfiguration configuration)
    {
        _userStorage = userStorage;
        _configuration = configuration;
    }

    public async Task<AuthResponse> RegisterAsync(AuthRequest request)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.Username) || 
            string.IsNullOrWhiteSpace(request.Email) || 
            string.IsNullOrWhiteSpace(request.Password))
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Username, email, and password are required."
            };
        }

        if (request.Password.Length < 6)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Password must be at least 6 characters long."
            };
        }

        // Check if user already exists
        var allUsers = await _userStorage.GetAllAsync();
        if (allUsers.Any(u => u.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase)))
        {
            return new AuthResponse
            {
                Success = false,
                Message = "A user with this email already exists."
            };
        }

        if (allUsers.Any(u => u.Username.Equals(request.Username, StringComparison.OrdinalIgnoreCase)))
        {
            return new AuthResponse
            {
                Success = false,
                Message = "A user with this username already exists."
            };
        }

        // Create new user
        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 10),
            Role = "User",
            CreatedAt = DateTime.UtcNow
        };

        await _userStorage.AddAsync(user);

        // Generate JWT token
        var token = GenerateJwtToken(user);
        var expiry = DateTime.UtcNow.AddDays(7);

        return new AuthResponse
        {
            Success = true,
            Message = "Registration successful!",
            Token = token,
            Expiry = expiry,
            User = new UserInfo
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            }
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(request.EmailOrUsername) || string.IsNullOrWhiteSpace(request.Password))
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Email/Username and password are required."
            };
        }

        // Find user
        var allUsers = await _userStorage.GetAllAsync();
        var user = allUsers.FirstOrDefault(u =>
            u.Email.Equals(request.EmailOrUsername, StringComparison.OrdinalIgnoreCase) ||
            u.Username.Equals(request.EmailOrUsername, StringComparison.OrdinalIgnoreCase)
        );

        if (user == null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid credentials."
            };
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid credentials."
            };
        }

        // Generate JWT token
        var token = GenerateJwtToken(user);
        var expiry = DateTime.UtcNow.AddDays(7);

        return new AuthResponse
        {
            Success = true,
            Message = "Login successful!",
            Token = token,
            Expiry = expiry,
            User = new UserInfo
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            }
        };
    }

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "LifeOS_Super_Secret_Key_For_JWT_Token_Generation_MinimumLength32Characters!";
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "LifeOS.API";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "LifeOS.Web";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("username", user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("userId", user.Id),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}