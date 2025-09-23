using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using fintechtracker_backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using Google.Apis.Auth;
using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Services;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly FinTechDbContext _context;
        private readonly IConfiguration _config;
        private readonly IOtpService _otpService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            FinTechDbContext context,
            IConfiguration config,
            IOtpService otpService,
            ILogger<AuthController> logger)
        {
            _context = context;
            _config = config;
            _otpService = otpService;
            _logger = logger;
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

                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash);

                if (!isPasswordValid)
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
                    FullName = user.Username,
                    Token = token
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Login error: {ex.Message}");
                return StatusCode(500, new { message = "Server error: " + ex.Message });
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

            try
            {
                // Generate and send OTP instead of creating user immediately
                var otpSent = await _otpService.GenerateAndCacheOtpAsync(registerDto.Email, registerDto);

                if (!otpSent)
                {
                    return StatusCode(500, new { message = "Failed to send verification email. Please try again." });
                }

                return Ok(new
                {
                    message = "Verification code sent to your email",
                    email = registerDto.Email
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Registration error: {ex.Message}");
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto verifyDto)
        {
            if (string.IsNullOrWhiteSpace(verifyDto.Email) || string.IsNullOrWhiteSpace(verifyDto.OtpCode))
            {
                return BadRequest(new { message = "Email and OTP code are required" });
            }

            try
            {
                // Verify OTP
                var isValid = await _otpService.VerifyOtpAsync(verifyDto.Email, verifyDto.OtpCode);

                if (!isValid)
                {
                    return BadRequest(new { message = "Invalid or expired OTP code" });
                }

                // Get pending registration data
                var registerData = await _otpService.GetPendingRegistrationAsync(verifyDto.Email);

                if (registerData == null)
                {
                    return BadRequest(new { message = "Registration data not found" });
                }

                // Create user now that email is verified
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(registerData.Password);

                var user = new User
                {
                    Username = registerData.Username,
                    Email = registerData.Email,
                    PasswordHash = passwordHash,
                    Role = "customer",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create user profile
                var userProfile = new Userprofile
                {
                    UserId = user.UserId,
                    FirstName = registerData.FirstName,
                    LastName = registerData.LastName,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Userprofiles.Add(userProfile);
                await _context.SaveChangesAsync();

                // Clear OTP cache
                // This will be handled by the OtpService when verification succeeds

                _logger.LogInformation($"User registered successfully: {user.Email}");

                return Ok(new RegisterResponseDto
                {
                    Message = "Email verified and registration completed successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"OTP verification error: {ex.Message}");
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromBody] SendOtpDto sendOtpDto)
        {
            if (string.IsNullOrWhiteSpace(sendOtpDto.Email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            try
            {
                // Get existing registration data
                var existingData = await _otpService.GetPendingRegistrationAsync(sendOtpDto.Email);

                if (existingData == null)
                {
                    return BadRequest(new { message = "No pending registration found for this email" });
                }

                // Generate and send new OTP
                var otpSent = await _otpService.GenerateAndCacheOtpAsync(sendOtpDto.Email, existingData);

                if (!otpSent)
                {
                    return StatusCode(500, new { message = "Failed to resend verification code. Please try again later." });
                }

                return Ok(new
                {
                    message = "Verification code resent successfully",
                    email = sendOtpDto.Email
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Resend OTP error: {ex.Message}");
                return StatusCode(500, new { message = "Server error: " + ex.Message });
            }
        }

        [HttpPost("google")]
        public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthDto dto)
        {
            try
            {
                var clientId = _config["GoogleAuth:ClientId"];
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = string.IsNullOrWhiteSpace(clientId) ? null : new List<string> { clientId }
                };

                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, settings);

                var existingUser = await _context.Users
                    .Include(u => u.Userprofile)
                    .FirstOrDefaultAsync(u => u.Email == payload.Email);

                if (existingUser != null)
                {
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
                    var newUser = new User
                    {
                        Username = payload.Email.Split('@')[0] + "_" + DateTime.Now.Ticks.ToString().Substring(0, 6),
                        Email = payload.Email,
                        PasswordHash = "",
                        Role = "customer",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(newUser);
                    await _context.SaveChangesAsync();

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

        [HttpPost("check-email")]
        public async Task<IActionResult> CheckEmail([FromBody] CheckEmailDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest(new { message = "Email is required" });

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return Conflict(new { message = "Email already exists" });

            return Ok(new { message = "Email is available" });
        }

        [HttpPost("check-username")]
        public async Task<IActionResult> CheckUsername([FromBody] CheckUsernameDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username))
                return BadRequest(new { message = "Username is required" });

            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                return Conflict(new { message = "Username already exists" });

            return Ok(new { message = "Username is available" });
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

    public class CheckEmailDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class CheckUsernameDto
    {
        public string Username { get; set; } = string.Empty;
    }
}