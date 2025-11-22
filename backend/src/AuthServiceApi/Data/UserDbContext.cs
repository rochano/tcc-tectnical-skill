using AuthServiceApi.Models;
using Microsoft.EntityFrameworkCore;

namespace AuthServiceApi.Data
{
    public class UserDbContext : DbContext
    {
        // Constructor รับ DbContextOptions เพื่อใช้ในการตั้งค่าการเชื่อมต่อ
        public UserDbContext(DbContextOptions<UserDbContext> options)
            : base(options)
        {
        }

        // DbSet ใช้สำหรับอ้างถึงตารางในฐานข้อมูล
        // ตารางนี้ชื่อว่า "Users" (ตาม convention ของ EF Core)
        public DbSet<User> Users { get; set; } = default!;

        // Override OnModelCreating เพื่อตั้งค่าเพิ่มเติมให้กับ Model (ถ้ามี)
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // กำหนดให้ Id เป็น Primary Key (EF Core จะทำให้อัตโนมัติอยู่แล้ว แต่เพิ่มเพื่อความชัดเจน)
            modelBuilder.Entity<User>()
                .HasKey(u => u.Id);

            // กำหนดให้ Username เป็น Unique Index (ป้องกันการลงทะเบียนซ้ำ)
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();
        }
    }
}
