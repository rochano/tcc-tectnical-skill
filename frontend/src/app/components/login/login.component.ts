import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="bg-white p-8 rounded-xl shadow-2xl space-y-6 w-full max-w-sm md:max-w-md">
        <h2 class="text-3xl font-bold text-gray-800 text-center">เข้าสู่ระบบ</h2>
        
        <form (ngSubmit)="onLogin()">
            <div class="space-y-4">
                <label class="block">
                    <span class="text-gray-700 font-medium">ชื่อผู้ใช้ (Username)</span>
                    <input type="text" [(ngModel)]="loginData.username" name="username" required
                           class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-150">
                </label>
                <label class="block">
                    <span class="text-gray-700 font-medium">รหัสผ่าน (Password)</span>
                    <input type="password" [(ngModel)]="loginData.password" name="password" required
                           class="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 transition duration-150">
                </label>
            </div>
            
            <div class="mt-8">
                <button type="submit" [disabled]="isLoading()"
                        class="w-full px-4 py-3 text-white font-semibold rounded-lg shadow-lg transition duration-150 
                               bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center transform hover:scale-[1.01]">
                    @if (isLoading()) {
                        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    }
                    {{ isLoading() ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ' }}
                </button>
            </div>
        </form>

        @if (error()) {
            <div class="p-3 border-l-4 border-red-400 bg-red-100 text-red-700 rounded-lg text-sm text-center font-medium shadow-inner mt-4">
                {{ error() }}
            </div>
        }

        <p class="text-center text-sm text-gray-500 pt-2">
            ยังไม่มีบัญชี? 
            <a [routerLink]="['/register']" class="text-indigo-600 hover:text-indigo-800 font-medium transition duration-150">ลงทะเบียนที่นี่</a>
        </p>
    </div>
  `,
})
export class LoginComponent {
  // Signals
  loginData = { username: '', password: '' };
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Services
  private authService = inject(AuthService);
  private router = inject(Router);

  async onLogin() {
    this.isLoading.set(true);
    this.error.set(null); // Clear previous errors

    // Basic validation
    if (!this.loginData.username || !this.loginData.password) {
        this.error.set('Please enter both username and password.');
        this.isLoading.set(false);
        return;
    }

    const success = await this.authService.login(this.loginData);
    this.isLoading.set(false);

    if (success) {
      // Login successful, authService handles fetchProfile and sets isLoggedIn
      this.router.navigate(['/']); 
    } else {
      this.error.set('Invalid username or password, or could not connect to the server.');
    }
  }
}