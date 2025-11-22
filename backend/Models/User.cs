namespace AuthServiceApi.Models
{
    public record User
    {
        // Property Key หลัก
        public int Id { get; init; }
        // ชื่อผู้ใช้
        public string Username { get; init; } = string.Empty;
        // รหัสผ่านที่ถูก Hash แล้ว (สำคัญ: ห้ามเก็บรหัสผ่านจริง)
        public string HashedPassword { get; init; } = string.Empty;
    }
}
