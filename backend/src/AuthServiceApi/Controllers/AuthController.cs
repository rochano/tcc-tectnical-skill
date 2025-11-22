using AuthServiceApi.DTOs;
using AuthServiceApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace AuthServiceApi.Controllers
{
    // กำหนด Base Route เป็น /api/Auth
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// POST /api/Auth/register: Endpoint สำหรับการลงทะเบียน
        /// </summary>
        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            // Logic เดิมจาก Program.cs
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest("Username and Password are required.");
            }

            var user = _authService.Register(request);

            if (user == null)
            {
                // หากผู้ใช้ซ้ำ หรือเกิดปัญหาในการลงทะเบียน
                return Conflict("Username already exists.");
            }

            // ลงทะเบียนสำเร็จ: คืนค่า 201 Created
            return CreatedAtAction(nameof(Register), new { user.Id }, new { user.Id, user.Username });
        }


        /// <summary>
        /// POST /api/Auth/login: Endpoint สำหรับการเข้าสู่ระบบ
        /// </summary>
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // Logic เดิมจาก Program.cs
            var token = _authService.Login(request);

            if (token == null)
            {
                // เข้าสู่ระบบไม่สำเร็จ
                return Unauthorized();
            }

            // เข้าสู่ระบบสำเร็จ: คืนค่า 200 OK พร้อม JWT Token
            return Ok(new { Token = token });
        }
    }
}