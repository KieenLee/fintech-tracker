using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using fintechtracker_backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly FinTechDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(FinTechDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            if (string.IsNullOrEmpty(loginDto.Password) ||
                (string.IsNullOrEmpty(loginDto.Email) && string.IsNullOrEmpty(loginDto.Username)))
            {
                return BadRequest(new { message = "Email/Username and Password are required" });
            }

            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u =>
                        (loginDto.Email != null && u.Email == loginDto.Email) ||
                        (loginDto.Username != null && u.Username == loginDto.Username));

                if (user == null)
                {
                    return Unauthorized(new { message = "Account does not exist" });
                }

                // Hash password để so sánh
                string inputPasswordHash;
                using (var sha = SHA256.Create())
                {
                    var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(loginDto.Password));
                    inputPasswordHash = BitConverter.ToString(bytes).Replace("-", "").ToLower();
                }

                if (user.PasswordHash != inputPasswordHash)
                {
                    return Unauthorized(new { message = "Wrong password" });
                }

                var token = GenerateJwtToken(user);

                return Ok(new LoginResponseDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    FullName = user.Username, // Tạm thời dùng username
                    Token = token
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi server: " + ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            if (string.IsNullOrWhiteSpace(registerDto.Username) || string.IsNullOrWhiteSpace(registerDto.Email) ||
                string.IsNullOrWhiteSpace(registerDto.Password) || string.IsNullOrWhiteSpace(registerDto.FirstName) ||
                string.IsNullOrWhiteSpace(registerDto.LastName))
                return BadRequest(new { message = "Missing required fields" });

            if (!Regex.IsMatch(registerDto.Email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return BadRequest(new { message = "Invalid email format" });

            if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
                return Conflict(new { message = "Email already exists" });

            if (await _context.Users.AnyAsync(u => u.Username == registerDto.Username))
                return Conflict(new { message = "Username already exists" });

            // Hash password (SHA256 demo, nên dùng BCrypt thực tế)
            string passwordHash;
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(registerDto.Password));
                passwordHash = BitConverter.ToString(bytes).Replace("-", "").ToLower();
            }

            var user = new User
            {
                Username = registerDto.Username,
                Email = registerDto.Email,
                PasswordHash = passwordHash,
                Role = "customer",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Tạo Userprofile
            var userProfile = new Userprofile
            {
                UserId = user.UserId,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Userprofiles.Add(userProfile);
            await _context.SaveChangesAsync();

            return Ok(new RegisterResponseDto { Message = "Registration successful" });
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthDto dto)
        {
            try
            {
                // Verify Google ID token
                var clientId = _config["GoogleAuth:ClientId"];
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = string.IsNullOrWhiteSpace(clientId) ? null : new List<string> { clientId }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);

                // Kiểm tra user đã tồn tại chưa
                var existingUser = await _context.Users
                    .Include(u => u.Userprofile)
                    .FirstOrDefaultAsync(u => u.Email == payload.Email);

                if (existingUser != null)
                {
                    // User đã tồn tại - đăng nhập
                    var loginToken = GenerateJwtToken(existingUser);

                    return Ok(new LoginResponseDto
                    {
                        UserId = existingUser.UserId,
                        Username = existingUser.Username,
                        Email = existingUser.Email,
                        Role = existingUser.Role,
                        FullName = existingUser.Userprofile?.FirstName + " " + existingUser.Userprofile?.LastName,
                        Token = loginToken
                    });
                }
                else
                {
                    // User chưa tồn tại - tạo mới (đăng ký)
                    var newUser = new User
                    {
                        Username = payload.Email.Split('@')[0] + "_" + DateTime.Now.Ticks.ToString().Substring(0, 6),
                        Email = payload.Email,
                        PasswordHash = "", // Google user không cần password
                        Role = "customer",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();

                    // Tạo Userprofile
                    var userProfile = new Userprofile
                    {
                        UserId = newUser.UserId,
                        FirstName = payload.GivenName,
                        LastName = payload.FamilyName,
                        AvatarUrl = payload.Picture,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Userprofiles.Add(userProfile);
                    await _context.SaveChangesAsync();

                    var registerToken = GenerateJwtToken(newUser);

                    return Ok(new LoginResponseDto
                    {
                        UserId = newUser.UserId,
                        Username = newUser.Username,
                        Email = newUser.Email,
                        Role = newUser.Role,
                        FullName = payload.Name,
                        Token = registerToken
                    });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Invalid Google token: " + ex.Message });
            }
        }


        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username ?? ""),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim(ClaimTypes.Role, user.Role ?? "Customer"),
                new Claim("userId", user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _config["Jwt:Key"] ?? "default-secret-key-for-development-only-32-chars"));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"] ?? "fintechtracker",
                audience: _config["Jwt:Audience"] ?? "fintechtracker",
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}