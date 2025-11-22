namespace AuthServiceApi.DTOs
{
    // DTO สำหรับการเข้าสู่ระบบ
    public record LoginRequest(string Username, string Password);
}
