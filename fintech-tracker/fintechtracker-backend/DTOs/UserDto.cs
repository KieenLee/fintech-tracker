using System.ComponentModel.DataAnnotations;

namespace fintechtracker_backend.DTOs
{
    public class UserListDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime JoinDate { get; set; }
        public DateTime? LastActive { get; set; }
        public decimal TotalSpent { get; set; }
        public string Subscription { get; set; } = "basic";
        public bool IsActive { get; set; }
    }

    public class CreateUserDto
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = null!;

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = null!;

        [Required]
        [RegularExpression("^(admin|customer)$", ErrorMessage = "Role must be either 'admin' or 'customer'")]
        public string Role { get; set; } = "customer";

        [StringLength(50)]
        public string? FirstName { get; set; }

        [StringLength(50)]
        public string? LastName { get; set; }

        [Phone]
        [StringLength(20)]
        public string? Phone { get; set; }

        [RegularExpression("^(basic|premium)$", ErrorMessage = "Subscription must be either 'basic' or 'premium'")]
        public string Subscription { get; set; } = "basic";

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = null!;
    }

    public class UpdateUserDto
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = null!;

        [Required]
        [EmailAddress]
        [StringLength(100)]
        public string Email { get; set; } = null!;

        [Required]
        [RegularExpression("^(admin|customer)$", ErrorMessage = "Role must be either 'admin' or 'customer'")]
        public string Role { get; set; } = null!;

        [StringLength(50)]
        public string? FirstName { get; set; }

        [StringLength(50)]
        public string? LastName { get; set; }

        [Phone]
        [StringLength(20)]
        public string? Phone { get; set; }

        [RegularExpression("^(basic|premium)$", ErrorMessage = "Subscription must be either 'basic' or 'premium'")]
        public string Subscription { get; set; } = "basic";

        public bool IsActive { get; set; } = true;
    }

    public class UserStatsDto
    {
        public int TotalUsers { get; set; }
        public int PremiumUsers { get; set; }
        public decimal TotalRevenue { get; set; }
        public double AvgRetention { get; set; }
        public string TotalUsersGrowth { get; set; } = "+0%";
        public string PremiumUsersGrowth { get; set; } = "+0%";
        public string RevenueGrowth { get; set; } = "+0%";
        public string RetentionGrowth { get; set; } = "+0%";
    }

    public class UserDetailDto
    {
        public int UserId { get; set; }
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
        public DateTime JoinDate { get; set; }
        public DateTime? LastActive { get; set; }
        public decimal TotalSpent { get; set; }
        public string Subscription { get; set; } = "basic";
        public bool IsActive { get; set; }
        public int TotalTransactions { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}