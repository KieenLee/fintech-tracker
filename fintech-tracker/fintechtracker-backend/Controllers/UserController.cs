using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using fintechtracker_backend.Data;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Models;
using System.Security.Cryptography;
using System.Text;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class UserController : ControllerBase
    {
        private readonly FinTechDbContext _context;
        private readonly ILogger<UserController> _logger;

        public UserController(FinTechDbContext context, ILogger<UserController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/User
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserListDto>>> GetUsers(
            [FromQuery] string? search = null,
            [FromQuery] string? role = null,
            [FromQuery] string? subscription = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var query = _context.Users
                    .Include(u => u.Userprofile)
                    .Where(u => u.IsActive == true);

                // Search filter
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(u =>
                        u.Username.ToLower().Contains(search.ToLower()) ||
                        u.Email.ToLower().Contains(search.ToLower()) ||
                        (u.Userprofile != null &&
                            (
                                (!string.IsNullOrEmpty(u.Userprofile.FirstName) && u.Userprofile.FirstName.ToLower().Contains(search.ToLower())) ||
                                (!string.IsNullOrEmpty(u.Userprofile.LastName) && u.Userprofile.LastName.ToLower().Contains(search.ToLower()))
                            )
                        ));
                }

                // Role filter
                if (!string.IsNullOrEmpty(role))
                {
                    query = query.Where(u => u.Role == role);
                }

                var totalCount = await query.CountAsync();

                var users = await query
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var userListDtos = new List<UserListDto>();
                foreach (var user in users)
                {
                    var totalSpent = await _context.Transactions
                        .Where(t => t.UserId == user.UserId && t.TransactionType == "expense")
                        .SumAsync(t => (decimal?)t.Amount) ?? 0;

                    userListDtos.Add(new UserListDto
                    {
                        UserId = user.UserId,
                        Username = user.Username,
                        Email = user.Email,
                        Role = user.Role,
                        FirstName = user.Userprofile?.FirstName,
                        LastName = user.Userprofile?.LastName,
                        JoinDate = user.CreatedAt ?? DateTime.Now,
                        LastActive = user.UpdatedAt,
                        TotalSpent = totalSpent,
                        Subscription = totalSpent > 0 ? "premium" : "basic",
                        IsActive = user.IsActive ?? true
                    });
                }

                Response.Headers.Append("X-Total-Count", totalCount.ToString());
                Response.Headers.Append("X-Page", page.ToString());
                Response.Headers.Append("X-Page-Size", pageSize.ToString());

                return Ok(userListDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/User/stats
        [HttpGet("stats")]
        public async Task<ActionResult<UserStatsDto>> GetUserStats()
        {
            try
            {
                var currentMonth = DateTime.Now.Month;
                var currentYear = DateTime.Now.Year;
                var lastMonth = currentMonth == 1 ? 12 : currentMonth - 1;
                var lastMonthYear = currentMonth == 1 ? currentYear - 1 : currentYear;

                // Current month stats
                var totalUsers = await _context.Users.CountAsync(u => u.IsActive == true);

                // Premium users are those who have made any expense transactions
                var premiumUsers = await _context.Users
                    .Where(u => u.IsActive == true)
                    .CountAsync(u => _context.Transactions
                        .Any(t => t.UserId == u.UserId && t.TransactionType == "expense"));

                // Calculate total revenue from all expenses this month
                var totalRevenue = await _context.Transactions
                    .Where(t => t.TransactionType == "expense" &&
                               t.TransactionDate.Month == currentMonth &&
                               t.TransactionDate.Year == currentYear)
                    .SumAsync(t => (decimal?)t.Amount) ?? 0;

                // Last month stats for comparison
                var lastMonthUsers = await _context.Users
                    .Where(u => u.CreatedAt.HasValue &&
                               u.CreatedAt.Value.Month <= lastMonth &&
                               u.CreatedAt.Value.Year <= lastMonthYear)
                    .CountAsync(u => u.IsActive == true);

                var lastMonthRevenue = await _context.Transactions
                    .Where(t => t.TransactionType == "expense" &&
                               t.TransactionDate.Month == lastMonth &&
                               t.TransactionDate.Year == lastMonthYear)
                    .SumAsync(t => (decimal?)t.Amount) ?? 0;

                // Calculate growth percentages
                var userGrowth = lastMonthUsers > 0
                    ? $"+{((totalUsers - lastMonthUsers) * 100.0 / lastMonthUsers):F1}%"
                    : "+0%";

                var revenueGrowth = lastMonthRevenue > 0
                    ? $"+{((double)(totalRevenue - lastMonthRevenue) * 100.0 / (double)lastMonthRevenue):F1}%"
                    : "+0%";

                var stats = new UserStatsDto
                {
                    TotalUsers = totalUsers,
                    PremiumUsers = premiumUsers,
                    TotalRevenue = totalRevenue,
                    AvgRetention = 78.0, // This would need more complex calculation
                    TotalUsersGrowth = userGrowth,
                    PremiumUsersGrowth = "+8%", // Simplified for now
                    RevenueGrowth = revenueGrowth,
                    RetentionGrowth = "+3%" // Simplified for now
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user stats");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/User/5
        [HttpGet("{id}")]
        public async Task<ActionResult<UserDetailDto>> GetUser(int id)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Userprofile)
                    .FirstOrDefaultAsync(u => u.UserId == id);

                if (user == null)
                {
                    return NotFound();
                }

                var totalSpent = await _context.Transactions
                    .Where(t => t.UserId == id && t.TransactionType == "expense")
                    .SumAsync(t => (decimal?)t.Amount) ?? 0;

                var totalTransactions = await _context.Transactions
                    .CountAsync(t => t.UserId == id);

                var userDetail = new UserDetailDto
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    FirstName = user.Userprofile?.FirstName,
                    LastName = user.Userprofile?.LastName,
                    Phone = user.Userprofile?.Phone,
                    JoinDate = user.CreatedAt ?? DateTime.Now,
                    LastActive = user.UpdatedAt,
                    TotalSpent = totalSpent,
                    Subscription = totalSpent > 0 ? "premium" : "basic",
                    IsActive = user.IsActive ?? true,
                    TotalTransactions = totalTransactions,
                    CreatedAt = user.CreatedAt,
                    UpdatedAt = user.UpdatedAt
                };

                return Ok(userDetail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user {UserId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/User
        [HttpPost]
        public async Task<ActionResult<UserDetailDto>> CreateUser(CreateUserDto createUserDto)
        {
            try
            {
                // Check if email already exists
                if (await _context.Users.AnyAsync(u => u.Email == createUserDto.Email))
                {
                    return BadRequest("Email already exists");
                }

                // Check if username already exists
                if (await _context.Users.AnyAsync(u => u.Username == createUserDto.Username))
                {
                    return BadRequest("Username already exists");
                }

                // Hash password
                var passwordHash = HashPassword(createUserDto.Password);

                var user = new User
                {
                    Username = createUserDto.Username,
                    Email = createUserDto.Email,
                    PasswordHash = passwordHash,
                    Role = createUserDto.Role,
                    IsActive = true,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Create user profile if personal info provided
                if (!string.IsNullOrEmpty(createUserDto.FirstName) ||
                    !string.IsNullOrEmpty(createUserDto.LastName) ||
                    !string.IsNullOrEmpty(createUserDto.Phone))
                {
                    var userProfile = new Userprofile
                    {
                        UserId = user.UserId,
                        FirstName = createUserDto.FirstName,
                        LastName = createUserDto.LastName,
                        Phone = createUserDto.Phone,
                        UpdatedAt = DateTime.Now // Chỉ có UpdatedAt theo schema
                    };

                    _context.Userprofiles.Add(userProfile);
                    await _context.SaveChangesAsync();
                }

                // Return the created user details
                var createdUserResult = await GetUser(user.UserId);
                if (createdUserResult.Value != null)
                {
                    return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, createdUserResult.Value);
                }

                return StatusCode(500, "Failed to retrieve created user");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/User/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateUserDto)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.Userprofile)
                    .FirstOrDefaultAsync(u => u.UserId == id);

                if (user == null)
                {
                    return NotFound();
                }

                // Check if email already exists (excluding current user)
                if (await _context.Users.AnyAsync(u => u.Email == updateUserDto.Email && u.UserId != id))
                {
                    return BadRequest("Email already exists");
                }

                // Check if username already exists (excluding current user)
                if (await _context.Users.AnyAsync(u => u.Username == updateUserDto.Username && u.UserId != id))
                {
                    return BadRequest("Username already exists");
                }

                // Update user
                user.Username = updateUserDto.Username;
                user.Email = updateUserDto.Email;
                user.Role = updateUserDto.Role;
                user.IsActive = updateUserDto.IsActive;
                user.UpdatedAt = DateTime.Now;

                // Update or create user profile
                if (user.Userprofile == null)
                {
                    user.Userprofile = new Userprofile
                    {
                        UserId = user.UserId,
                        UpdatedAt = DateTime.Now // Chỉ có UpdatedAt theo schema
                    };
                    _context.Userprofiles.Add(user.Userprofile);
                }

                user.Userprofile.FirstName = updateUserDto.FirstName;
                user.Userprofile.LastName = updateUserDto.LastName;
                user.Userprofile.Phone = updateUserDto.Phone;
                user.Userprofile.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user {UserId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/User/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                {
                    return NotFound();
                }

                // Soft delete
                user.IsActive = false;
                user.UpdatedAt = DateTime.Now;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user {UserId}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }
}