using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using fintechtracker_backend.DTOs;
using fintechtracker_backend.Repositories;
using System.Security.Claims;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly IAccountRepository _accountRepository;

        public AccountController(IAccountRepository accountRepository)
        {
            _accountRepository = accountRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AccountDto>>> GetAccounts()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            try
            {
                var accounts = await _accountRepository.GetUserAccountsAsync(userId);
                return Ok(accounts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving accounts", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AccountDto>> GetAccount(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            try
            {
                var account = await _accountRepository.GetAccountByIdAsync(id, userId);
                if (account == null)
                {
                    return NotFound(new { message = "Account not found" });
                }
                return Ok(account);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving account", error = ex.Message });
            }
        }
    }
}