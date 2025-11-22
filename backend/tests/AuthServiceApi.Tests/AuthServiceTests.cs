using Moq;
using AuthServiceApi.Models; // ต้องมี namespace นี้ในโปรเจกต์หลัก
using AuthServiceApi.Services; // ต้องมี namespace นี้ในโปรเจกต์หลัก
using AuthServiceApi.Data; // ต้องมี namespace นี้ในโปรเจกต์หลัก
using AuthServiceApi.DTOs; // ต้องมี namespace นี้ในโปรเจกต์หลัก
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity; // สำหรับ PasswordVerificationResult

// ---------------------------------------------------------------------------------------------------------
// Unit Test Class หลัก
// ---------------------------------------------------------------------------------------------------------
namespace AuthServiceApi.Tests
{
    public class AuthServiceTests
    {
        // Dependencies ที่ต้องการจำลอง (Mock)
        private readonly Mock<IUserRepository> _mockUserRepository;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly AuthService _authService;

        // ใช้ PasswordHasher จริงในการทดสอบเพื่อสร้างและยืนยันรหัสผ่าน
        private readonly IPasswordHasher<User> _passwordHasher = new PasswordHasher<User>();

        private const string TEST_SECRET = "this-is-a-very-long-and-secure-secret-key-for-jwt-testing";
        private const string TEST_USERNAME = "testuser";
        private const string TEST_PASSWORD = "TestPassword123";

        public AuthServiceTests()
        {
            _mockUserRepository = new Mock<IUserRepository>();
            _mockConfiguration = new Mock<IConfiguration>();

            // ---------------------------------------------------------
            // 1. Mock IConfiguration (จำเป็นสำหรับการสร้าง JWT Token)
            // ---------------------------------------------------------
            var jwtSettings = new Dictionary<string, string?>
            {
                {"Secret", TEST_SECRET},
                {"Issuer", "TestIssuer"},
                {"Audience", "TestAudience"}
            };

            var configurationSection = new Mock<IConfigurationSection>();
            configurationSection.Setup(c => c.GetSection("JwtSettings")).Returns(configurationSection.Object);

            // ตั้งค่าค่า Key/Value สำหรับ Secret, Issuer, Audience
            configurationSection.Setup(c => c["Secret"]).Returns(TEST_SECRET);
            configurationSection.Setup(c => c["Issuer"]).Returns("TestIssuer");
            configurationSection.Setup(c => c["Audience"]).Returns("TestAudience");

            // Mock การเรียก GetSection("JwtSettings") จาก Root IConfiguration
            _mockConfiguration.Setup(c => c.GetSection("JwtSettings")).Returns(configurationSection.Object);


            // ---------------------------------------------------------
            // 2. สร้าง Service Class ที่จะทดสอบด้วย Dependencies ที่จำลองไว้
            // ---------------------------------------------------------
            _authService = new AuthService(_mockUserRepository.Object, _mockConfiguration.Object);
        }

        // ====================================================================
        // A. TEST CASES สำหรับการลงทะเบียน (Register)
        // ====================================================================

        [Fact(DisplayName = "Reg_001_Success_NewUserRegistered")]
        public void Register_NewUser_ReturnsUser()
        {
            // Arrange
            var request = new RegisterRequest(TEST_USERNAME, TEST_PASSWORD);
            var expectedUser = new User { Id = 1, Username = TEST_USERNAME, HashedPassword = "mock-hash" };

            // 1. Mock: ยืนยันว่า Username ยังไม่มีในระบบ
            _mockUserRepository.Setup(r => r.ExistsByUsername(TEST_USERNAME)).Returns(false);

            // 2. Mock: เมื่อ AddUser ถูกเรียก ให้คืนค่า User ที่สร้างแล้ว
            // (เราใช้ It.IsAny<User>() เพราะ HashedPassword จะถูกสร้างขึ้นจริง)
            _mockUserRepository.Setup(r => r.AddUser(It.IsAny<User>()))
                               .Returns(expectedUser);

            // Act
            var result = _authService.Register(request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(TEST_USERNAME, result.Username);

            // ตรวจสอบว่า AddUser ถูกเรียกเพียงครั้งเดียว
            _mockUserRepository.Verify(r => r.AddUser(It.Is<User>(u => u.Username == TEST_USERNAME)), Times.Once);
        }

        [Fact(DisplayName = "Reg_002_Fail_UsernameAlreadyExists")]
        public void Register_ExistingUser_ReturnsNull()
        {
            // Arrange
            var request = new RegisterRequest(TEST_USERNAME, TEST_PASSWORD);

            // Mock: ยืนยันว่า Username มีอยู่ในระบบแล้ว
            _mockUserRepository.Setup(r => r.ExistsByUsername(TEST_USERNAME)).Returns(true);

            // Act
            var result = _authService.Register(request);

            // Assert
            Assert.Null(result); // คาดหวังว่า Service จะคืนค่า null

            // ตรวจสอบว่า AddUser ไม่ถูกเรียกเลย
            _mockUserRepository.Verify(r => r.AddUser(It.IsAny<User>()), Times.Never);
        }

        // ====================================================================
        // B. TEST CASES สำหรับการเข้าสู่ระบบ (Login)
        // ====================================================================

        [Fact(DisplayName = "Login_001_Success_ValidCredentials")]
        public void Login_ValidCredentials_ReturnsJwtToken()
        {
            // Arrange
            var request = new LoginRequest(TEST_USERNAME, TEST_PASSWORD);

            // Hash รหัสผ่านจริงด้วย PasswordHasher เพื่อใช้ในการจำลอง User
            string hashedPassword = _passwordHasher.HashPassword(null, TEST_PASSWORD);

            var existingUser = new User { Id = 1, Username = TEST_USERNAME, HashedPassword = hashedPassword };

            // 1. Mock: GetUserByUsername คืนค่า User ที่มีอยู่จริง
            _mockUserRepository.Setup(r => r.GetUserByUsername(TEST_USERNAME)).Returns(existingUser);

            // Act
            var result = _authService.Login(request);

            // Assert
            Assert.NotNull(result);
            Assert.False(string.IsNullOrEmpty(result)); // Token ต้องไม่ว่าง
            Assert.Contains(".", result); // Token ต้องมีโครงสร้าง JWT (มีจุด 2 จุด)

            // ตรวจสอบว่า GetUserByUsername ถูกเรียก
            _mockUserRepository.Verify(r => r.GetUserByUsername(TEST_USERNAME), Times.Once);
        }

        [Fact(DisplayName = "Login_002_Fail_UserNotFound")]
        public void Login_UserNotFound_ReturnsNull()
        {
            // Arrange
            var request = new LoginRequest(TEST_USERNAME, TEST_PASSWORD);

            // Mock: GetUserByUsername คืนค่า null (ไม่พบผู้ใช้)
            _mockUserRepository.Setup(r => r.GetUserByUsername(TEST_USERNAME)).Returns((User?)null);

            // Act
            var result = _authService.Login(request);

            // Assert
            Assert.Null(result);

            // ตรวจสอบว่า GetUserByUsername ถูกเรียก
            _mockUserRepository.Verify(r => r.GetUserByUsername(TEST_USERNAME), Times.Once);
        }

        [Fact(DisplayName = "Login_003_Fail_InvalidPassword")]
        public void Login_InvalidPassword_ReturnsNull()
        {
            // Arrange
            var request = new LoginRequest(TEST_USERNAME, "WrongPassword");

            // Hash รหัสผ่านที่ถูกต้องเพื่อใช้ในการจำลอง User
            string hashedPassword = _passwordHasher.HashPassword(null, TEST_PASSWORD);

            var existingUser = new User { Id = 1, Username = TEST_USERNAME, HashedPassword = hashedPassword };

            // Mock: GetUserByUsername คืนค่า User ที่มีอยู่จริง
            _mockUserRepository.Setup(r => r.GetUserByUsername(TEST_USERNAME)).Returns(existingUser);

            // Act
            var result = _authService.Login(request);

            // Assert
            Assert.Null(result); // รหัสผ่านผิด ต้องคืนค่า null

            // ตรวจสอบว่า GetUserByUsername ถูกเรียก
            _mockUserRepository.Verify(r => r.GetUserByUsername(TEST_USERNAME), Times.Once);
        }

        // ====================================================================
        // C. TEST CASES สำหรับการจัดการ Error (Exception Handling)
        // ====================================================================

        [Fact(DisplayName = "Ex_001_HandleRepoException_Register")]
        public void Register_RepositoryThrowsException_PropagatesException()
        {
            // Arrange
            var request = new RegisterRequest(TEST_USERNAME, TEST_PASSWORD);
            var exceptionMessage = "Database connection error.";

            _mockUserRepository.Setup(r => r.ExistsByUsername(TEST_USERNAME)).Returns(false);

            // Mock: กำหนดให้ AddUser โยน Exception ออกมา
            _mockUserRepository.Setup(r => r.AddUser(It.IsAny<User>()))
                               .Throws(new System.Exception(exceptionMessage));

            // Act & Assert
            // คาดหวังว่า Exception จะถูกโยนออกมาจาก Service (เนื่องจาก Service ไม่ได้ดักจับ)
            var caughtException = Assert.Throws<System.Exception>(() =>
                _authService.Register(request)
            );

            Assert.Equal(exceptionMessage, caughtException.Message);

            // ตรวจสอบว่า ExistsByUsername ถูกเรียก และ AddUser ก็ถูกเรียกตาม Logic
            _mockUserRepository.Verify(r => r.ExistsByUsername(TEST_USERNAME), Times.Once);
            _mockUserRepository.Verify(r => r.AddUser(It.IsAny<User>()), Times.Once);
        }
    }
}