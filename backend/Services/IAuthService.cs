using AuthServiceApi.DTOs;
using AuthServiceApi.Models;

namespace AuthServiceApi.Services
{
    // Interface สำหรับ Auth Service
    public interface IAuthService
    {
        User? Register(RegisterRequest request);
        string? Login(LoginRequest request); // คืนค่า Token (ใน Production)
    }
}
