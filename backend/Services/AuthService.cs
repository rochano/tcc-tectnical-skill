using AuthServiceApi.Data;
using AuthServiceApi.DTOs;
using AuthServiceApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace AuthServiceApi.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        // เพิ่ม PasswordHasher
        private readonly IPasswordHasher<User> _passwordHasher = new PasswordHasher<User>();
        private readonly IConfiguration _configuration; // 1. เพิ่ม IConfiguration

        // Constructor Injection: รับ IUserRepository มาใช้งาน
        public AuthService(IUserRepository userRepository, IConfiguration configuration)
        {
            _userRepository = userRepository;
            _configuration = configuration; // 2. รับ Configuration เข้ามา
        }

        // เมธอดสำหรับลงทะเบียน
        public User? Register(RegisterRequest request)
        {
            if (_userRepository.ExistsByUsername(request.Username))
            {
                // ผู้ใช้ซ้ำ
                return null;
            }

            // 🛡️ 1. Hashing รหัสผ่าน
            string hashedPassword = _passwordHasher.HashPassword(null, request.Password);

            var newUser = new User
            {
                Username = request.Username,
                HashedPassword = hashedPassword // ใช้ HashedPassword ที่แท้จริง
            };

            return _userRepository.AddUser(newUser);
        }

        // เมธอดสำหรับเข้าสู่ระบบ
        public string? Login(LoginRequest request)
        {
            var user = _userRepository.GetUserByUsername(request.Username);

            if (user == null)
            {
                return null; // ผู้ใช้ไม่พบ
            }

            // 🛡️ 2. ตรวจสอบรหัสผ่านที่ Hashed แล้ว
            var result = _passwordHasher.VerifyHashedPassword(null, user.HashedPassword, request.Password);

            if (result != PasswordVerificationResult.Success)
            {
                return null; // รหัสผ่านผิด
            }

            // 3. ถ้า Login สำเร็จ ให้สร้าง Token
            return GenerateJwtToken(user);
        }

        // เมธอดส่วนตัวสำหรับสร้าง JWT Token
        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"]!);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                // Claims: ข้อมูลที่จะเก็บใน Token (เช่น ID, Username, Role)
                Subject = new ClaimsIdentity(new[]
                {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            }),

                Expires = DateTime.UtcNow.AddDays(7), // Token มีอายุ 7 วัน
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token); // คืนค่า Token เป็น string
        }
    }
}
