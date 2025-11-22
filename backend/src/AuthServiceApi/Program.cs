using AuthServiceApi.Data;
using AuthServiceApi.DTOs;
using AuthServiceApi.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
const string AngularClientOrigin = "_angularClientOrigin";

builder.Services.AddControllers();

// ดึง Secret Key จาก Configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings["Secret"]!);

// --- 1. การ Register Services และ Dependencies ---
// Register Services: 
// AddSingleton: UserRepository จะถูกสร้างครั้งเดียวตลอดอายุแอปฯ
builder.Services.AddScoped<IUserRepository, UserRepository>();
// AddScoped: AuthService ถูกสร้างใหม่ทุกๆ HTTP Request (ดีสำหรับ DI ทั่วไป)
builder.Services.AddScoped<IAuthService, AuthService>();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
// ลบ: builder.Services.AddOpenApi();
// เพิ่ม: 
builder.Services.AddEndpointsApiExplorer(); // สำหรับ Minimal API
builder.Services.AddSwaggerGen();           // สำหรับการสร้างเอกสาร Swagger

// 1. เพิ่ม Authentication Service
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "Bearer";
    options.DefaultChallengeScheme = "Bearer";
})
.AddJwtBearer("Bearer", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, // ตรวจสอบผู้ออก Token
        ValidateAudience = true, // ตรวจสอบผู้รับ Token
        ValidateLifetime = true, // ตรวจสอบอายุ Token
        ValidateIssuerSigningKey = true, // ตรวจสอบลายเซ็น (Secret Key)

        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key) // ใช้ Secret Key ในการถอดรหัส
    };
});
// 2. เพิ่ม Authorization Service
builder.Services.AddAuthorization();
// ต้องเพิ่ม Service นี้ใน DI เพื่อให้เข้าถึง IHttpContextAccessor ได้
builder.Services.AddHttpContextAccessor();

var connectionString = builder.Configuration.GetConnectionString("PostgreSql");
builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: AngularClientOrigin,
                      policy =>
                      {
                          // **ตรวจสอบให้แน่ใจว่า Origin ตรงกับ Frontend ของคุณ**
                          policy.WithOrigins("http://localhost:4200")
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials();
                      });
});

var app = builder.Build();

// ==========================================================
// ✅ ADDED: โค้ด AUTO-MIGRATION
// ==========================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    // ดึง Logger มาไว้ในขอบเขตนี้ทันทีเพื่อใช้ใน Catch Block
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        // ดึง UserDbContext ออกมาจาก Service Provider
        var context = services.GetRequiredService<UserDbContext>();

        // ตรวจสอบว่ามี Migration ที่รอดำเนินการหรือไม่
        if (context.Database.GetPendingMigrations().Any())
        {
            // รัน Migration (สร้างตาราง)
            context.Database.Migrate();
            logger.LogInformation("Database migrations applied successfully.");
        }
    }
    catch (Exception ex)
    {
        // 'logger' สามารถเข้าถึงได้เพราะถูกประกาศไว้ด้านนอก Try/Catch
        logger.LogError(ex, "An error occurred during database migration.");
    }
}
// ==========================================================

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    // ลบ: app.MapOpenApi();
    // เพิ่ม:
    app.UseSwagger();           // สร้าง JSON Document
    app.UseSwaggerUI();         // แสดงหน้า GUI ที่ /swagger/index.html
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseCors(AngularClientOrigin);
app.UseAuthentication();
app.UseAuthorization();

// POST /api/auth/register: Endpoint สำหรับการลงทะเบียน
app.MapPost("/api/auth/register", (IAuthService authService, RegisterRequest request) =>
{
    // ตรวจสอบความถูกต้องของข้อมูลพื้นฐาน (เช่น ถ้า Username หรือ Password ว่าง)
    if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
    {
        return Results.BadRequest("Username and Password are required.");
    }

    var user = authService.Register(request);

    if (user == null)
    {
        // หากผู้ใช้ซ้ำ หรือเกิดปัญหาในการลงทะเบียน
        return Results.Conflict("Username already exists.");
    }

    // ลงทะเบียนสำเร็จ: คืนค่า 201 Created
    // ลบ HashedPassword ออกก่อนส่งคืน (เพื่อความปลอดภัย)
    return Results.Created($"/api/users/{user.Id}", new { user.Id, user.Username });
})
.WithTags("Auth") // จัดกลุ่มใน Swagger
.WithName("RegisterUser");


// POST /api/auth/login: Endpoint สำหรับการเข้าสู่ระบบ
app.MapPost("/api/auth/login", (IAuthService authService, LoginRequest request) =>
{
    var token = authService.Login(request);

    if (token == null)
    {
        // เข้าสู่ระบบไม่สำเร็จ (Username ไม่พบ หรือ รหัสผ่านผิด)
        return Results.Unauthorized();
    }

    // เข้าสู่ระบบสำเร็จ: คืนค่า 200 OK พร้อม JWT Token
    return Results.Ok(new { Token = token });
})
.WithTags("Auth")
.WithName("LoginUser");

// GET /api/user/profile: ต้องมีการยืนยันตัวตน (Authorization)
app.MapGet("/api/user/profile", (IHttpContextAccessor httpContextAccessor) =>
{
    // ตัวอย่างการดึง Username จาก Token ใน Request
    var username = httpContextAccessor.HttpContext?.User.Identity?.Name;
    if (username == null)
    {
        // ไม่ควรเกิดขึ้นถ้า Token ถูกต้อง
        return Results.Unauthorized();
    }
    return Results.Ok(new { message = $"Welcome, {username}! This is your secure profile data." });
})
.RequireAuthorization() // <--- บรรทัดนี้ทำให้ Endpoint นี้ต้องใช้ Token
.WithTags("User")
.WithName("GetUserProfile");

app.Run();
