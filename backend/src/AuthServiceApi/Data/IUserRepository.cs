using AuthServiceApi.Models;

namespace AuthServiceApi.Data
{
    // Interface สำหรับ Repository Pattern เพื่อให้ Testable
    public interface IUserRepository
    {
        User? GetUserByUsername(string username);
        User AddUser(User user);
        bool ExistsByUsername(string username);
    }
}
