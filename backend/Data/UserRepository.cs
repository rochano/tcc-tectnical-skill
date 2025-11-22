using AuthServiceApi.Models;

namespace AuthServiceApi.Data
{
    // Implementation ของ UserRepository (ใช้ List ใน Memory)
    public class UserRepository : IUserRepository
    {
        private readonly UserDbContext _context;

        // รับ UserDbContext ผ่าน Dependency Injection
        public UserRepository(UserDbContext context)
        {
            _context = context;
        }

        public bool ExistsByUsername(string username)
        {
            return _context.Users.Any(u => u.Username == username);
        }

        public User? GetUserByUsername(string username)
        {
            // ใช้ FirstOrDefault เพื่อดึงข้อมูล User แรกที่ตรงกับ Username
            return _context.Users.FirstOrDefault(u => u.Username == username);
        }

        public User AddUser(User user)
        {
            // ตรวจสอบ Username ซ้ำก่อนเพิ่ม (แม้จะมี Unique Index ใน DbContext แล้วก็ตาม)
            if (_context.Users.Any(u => u.Username == user.Username))
            {
                return null!; // หรือ throw exception ตามความเหมาะสม
            }

            _context.Users.Add(user);
            _context.SaveChanges(); // บันทึกการเปลี่ยนแปลงลงในฐานข้อมูลทันที
            return user;
        }
    }
}
