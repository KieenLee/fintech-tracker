using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using fintechtracker_backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
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

                // So sánh password (giả sử lưu plain text - thực tế nên hash)
                if (user.PasswordHash != loginDto.Password)
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


        private string GenerateJwtToken(dynamic user)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                new Claim(ClaimTypes.Name, user.Username ?? ""),
                new Claim(ClaimTypes.Role, user.Role ?? "Customer"),
                new Claim("userId", user.UserId.ToString())
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