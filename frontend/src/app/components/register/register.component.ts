import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="bg-white p-8 rounded-xl shadow-2xl space-y-6 w-full max-w-sm md:max-w-md">
        <h2 class="text-3xl font-bold text-gray-800 text-center">ลงทะเบียนบัญชีใหม่</h2>
        
        <form (ngSubmit)="onRegister()">
            <div class="space-y-4">
                <label class="block">
                    <span class="text-gray-700 font-medium">ชื่อผู้ใช้ (Username)</span>
                    <input type="text" [(ngModel)]="registerData.username" name="username" required minlength="3"
                           class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                </label>
                <label class="block">
                    <span class="text-gray-700 font-medium">รหัสผ่าน (Password)</span>
                    <input type="password" [(ngModel)]="registerData.password" name="password" required minlength="6"
                           class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150">
                </label>
            </div>
            
            <div class="mt-8">
                <button type="submit" [disabled]="isLoading()"
                        class="w-full px-4 py-3 text-white font-semibold rounded-lg shadow-lg transition duration-150 
                               bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center transform hover:scale-[1.01]">
                    @if (isLoading()) {
                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    }
                    {{ isLoading() ? 'กำลังดำเนินการ...' : 'ลงทะเบียน' }}
                </button>
            </div>
        </form>

        @if (message(); as msg) {
            <div [class]="msg.success ? 'text-green-700 bg-green-100 border-green-400' : 'text-red-700 bg-red-100 border-red-400'" 
                 class="p-3 border-l-4 rounded-lg text-sm text-center font-medium shadow-inner mt-4">
                {{ msg.message }}
            </div>
        }

        <p class="text-center text-sm text-gray-500 pt-2">
            เป็นสมาชิกอยู่แล้ว? 
            <a [routerLink]="['/login']" class="text-indigo-600 hover:text-indigo-800 font-medium transition duration-150">เข้าสู่ระบบที่นี่</a>
        </p>
    </div>
  `,
})
export class RegisterComponent {
  // Signals
  registerData = { username: '', password: '' };
  message = signal<{ success: boolean, message: string } | null>(null);
  isLoading = signal(false);

  // Services
  private authService = inject(AuthService);
  private router = inject(Router);

  async onRegister() {
    this.isLoading.set(true);
    this.message.set(null);

    // Basic validation
    if (this.registerData.username.length < 3 || this.registerData.password.length < 6) {
        this.message.set({ success: false, message: 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร และรหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' });
        this.isLoading.set(false);
        return;
    }

    const result = await this.authService.register(this.registerData);
    this.isLoading.set(false);
    this.message.set(result);
    
    if (result.success) {
      // Clear form and navigate to login after successful registration
      this.registerData = { username: '', password: '' };
      // Allow user to see success message before navigating
      setTimeout(() => this.router.navigate(['/login']), 2000); 
    }
  }
}