using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthServiceApi.Controllers
{
    // กำหนด Base Route เป็น /api/User
    [ApiController]
    [Route("api/[controller]")]
    // ทุก Endpoint ใน Controller นี้จะต้องมีการยืนยันตัวตน
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserController(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        /// <summary>
        /// GET /api/User/profile: ต้องมีการยืนยันตัวตน
        /// </summary>
        [HttpGet("profile")]
        public IActionResult GetProfile()
        {
            var username = _httpContextAccessor.HttpContext?.User.Identity?.Name;

            if (username == null)
            {
                // Unauthorised ถูกจัดการโดย [Authorize] Attribute แล้ว
                return Unauthorized();
            }

            return Ok(new { message = $"Welcome, {username}! This is your secure profile data." });
        }
    }
}