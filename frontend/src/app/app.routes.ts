import { Routes, Router } from '@angular/router'; // ต้องมี Router เพื่อใช้ navigate ใน Guard
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { ProfileComponent } from './components/profile/profile.component';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

// Guard function to protect the Profile route
const authGuard = () => {
    const authService = inject(AuthService);
    const router = inject(Router); // ต้อง inject Router เพื่อ Redirect

    // ถ้ายังไม่ได้ล็อกอิน
    if (!authService.isLoggedIn()) {
        // ให้ Router นำทางไปยังหน้า Login ทันที
        // การใช้ router.navigate() ที่นี่เป็นการแจ้งให้ Router ทราบถึงการเปลี่ยนเส้นทางอย่างเป็นทางการ
        router.navigate(['/login']);
        return false; // หยุดการเข้าถึง ProfileComponent
    }
    router.navigate(['/']);
    return true; // อนุญาตให้เข้าถึง
};

export const routes: Routes = [
    // 1. Path Root ('/') ถูกกำหนดให้เป็น Profile
    { 
        path: '', 
        component: ProfileComponent, 
        canActivate: [authGuard] 
    },
    // 2. Login และ Register เป็น Path ย่อย
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    
    // 3. Path 'profile' (ตัวเก่า) ถูกเอาออกแล้ว 

    // 4. Handle 404 (Redirect กลับไปหน้าหลักซึ่งคือ Profile หรือ Login ผ่าน Guard)
    { path: '**', redirectTo: '' } // Redirect 404s ไปที่ Path Root
];