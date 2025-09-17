using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;

namespace fintechtracker_backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { message = "Hello World", time = DateTime.Now });
        }

        [HttpGet("test-token")]
        public IActionResult TestToken()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var nameClaim = User.FindFirst(ClaimTypes.Name)?.Value;
            var emailClaim = User.FindFirst(ClaimTypes.Email)?.Value;

            return Ok(new
            {
                UserId = userIdClaim,
                Name = nameClaim,
                Email = emailClaim,
                AllClaims = User.Claims.Select(c => new { c.Type, c.Value })
            });
        }
    }
}