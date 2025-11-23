import { Component, signal, effect, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';

// เนื่องจาก main.server.ts เรียกใช้ class App,
// ไฟล์นี้จึงต้องมี Template และ Logic ครบถ้วน
@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [CommonModule, FormsModule], 
  // Template ถูกเพิ่มเข้ามาเพื่อแก้ไข NG2001 error
  template: `
    <main class="min-h-screen bg-gray-50 flex flex-col font-sans">
      <!-- Header / Navigation -->
      <header class="bg-indigo-600 shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-white tracking-tight">Angular Auth App</h1>
          
          <nav>
            <!-- Navigation Buttons based on Auth Status -->
            @if (authService.isLoggedIn()) {
              <div class="flex items-center space-x-4">
                <span class="text-white text-lg font-medium hidden sm:inline">
                  Hi, {{ authService.currentUsername() || 'Loading...' }}!
                </span>
                <button 
                  (click)="logout()" 
                  class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition duration-150 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Logout
                </button>
              </div>
            } @else {
              <div class="flex space-x-3">
                <button 
                  (click)="setView('login')" 
                  [class.bg-indigo-700]="currentView() === 'login'"
                  class="px-4 py-2 bg-indigo-500 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-150"
                >
                  Login
                </button>
                <button 
                  (click)="setView('register')" 
                  [class.bg-indigo-700]="currentView() === 'register'"
                  class="px-4 py-2 bg-indigo-500 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition duration-150"
                >
                  Register
                </button>
              </div>
            }
          </nav>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="flex-grow flex items-start justify-center p-4 sm:p-10">
        
        <!-- Welcome / Default View (Not Logged In) -->
        @if (!authService.isLoggedIn()) {
            <div class="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
                <!-- Status Message Display -->
                @if (statusMessage() && currentView() !== 'profile') {
                    <div class="p-3 mb-4 rounded-lg text-sm font-medium transition duration-300 ease-in-out" 
                         [ngClass]="statusType() === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                        {{ statusMessage() }}
                    </div>
                }

                <!-- Switch between Login and Register Forms -->
                @switch (currentView()) {
                    @case ('login') {
                        <h2 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">Sign In</h2>
                        <form (submit)="login($event)">
                            <div class="space-y-4">
                                <input 
                                    type="text" 
                                    [(ngModel)]="loginUsername" 
                                    name="loginUsername"
                                    placeholder="Username" 
                                    required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                >
                                <input 
                                    type="password" 
                                    [(ngModel)]="loginPassword" 
                                    name="loginPassword"
                                    placeholder="Password" 
                                    required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                >
                            </div>
                            <button 
                                type="submit" 
                                [disabled]="isSubmitting()"
                                class="mt-6 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                @if (isSubmitting()) {
                                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                }
                                Log In
                            </button>
                        </form>
                        <p class="text-sm text-center text-gray-500 mt-4">
                            Don't have an account? 
                            <a (click)="setView('register')" class="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">Register here</a>
                        </p>
                    }
                    @case ('register') {
                        <h2 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">Create Account</h2>
                        <form (submit)="register($event)">
                            <div class="space-y-4">
                                <input 
                                    type="text" 
                                    [(ngModel)]="registerUsername" 
                                    name="registerUsername"
                                    placeholder="Username" 
                                    required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                >
                                <input 
                                    type="password" 
                                    [(ngModel)]="registerPassword" 
                                    name="registerPassword"
                                    placeholder="Password" 
                                    required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                                >
                                <input 
                                    type="password" 
                                    [(ngModel)]="registerConfirmPassword" 
                                    name="registerConfirmPassword"
                                    placeholder="Confirm Password" 
                                    required
                                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition duration-150"
                                >
                            </div>
                            <button 
                                type="submit" 
                                [disabled]="isSubmitting()"
                                class="mt-6 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                @if (isSubmitting()) {
                                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                }
                                Register
                            </button>
                        </form>
                        <p class="text-sm text-center text-gray-500 mt-4">
                            Already have an account? 
                            <a (click)="setView('login')" class="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer">Log in here</a>
                        </p>
                    }
                    @default {
                         <h2 class="text-3xl font-extrabold text-gray-900 mb-6 text-center">Welcome!</h2>
                         <p class="text-lg text-gray-600 text-center">Please use the navigation above to Login or Register.</p>
                    }
                }
            </div>
        } 
        
        <!-- Logged In Profile View -->
        @if (authService.isLoggedIn()) {
          <div class="w-full max-w-lg bg-white p-10 rounded-xl shadow-2xl border-l-4 border-indigo-500">
            <h2 class="text-4xl font-extrabold text-indigo-700 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 mr-3">
                    <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
                </svg>
                User Profile
            </h2>
            <div class="space-y-4">
                <p class="text-xl font-semibold text-gray-800">
                    Username: <span class="font-bold text-indigo-600">{{ authService.currentUsername() }}</span>
                </p>
                <p class="text-gray-600">
                    Status: <span class="font-medium text-green-500">Logged In (Authenticated)</span>
                </p>
                <div class="pt-4 border-t border-gray-200">
                    <p class="text-sm text-gray-500 italic">
                        This data was fetched securely from your .NET Core API using the JWT token stored in sessionStorage.
                    </p>
                </div>
            </div>
          </div>
        }
      </div>
    </main>
  `,
  styles: `
    /* Styles here */
    :host {
      display: contents;
    }
  `,
  providers: [AuthService] 
})
export class App implements OnInit {
  // Inject the service
  authService = inject(AuthService);

  // Form Inputs (using FormsModule, not Reactive Forms for simplicity here)
  loginUsername = '';
  loginPassword = '';
  registerUsername = '';
  registerPassword = '';
  registerConfirmPassword = '';

  // UI State Management (Signals)
  currentView = signal<'login' | 'register' | 'profile' | 'welcome'>('welcome');
  isSubmitting = signal(false);
  statusMessage = signal<string | null>(null);
  statusType = signal<'success' | 'error'>('success');
  
  // Effect to automatically show the profile when logged in
  constructor() {
    effect(() => {
      // When login status changes
      if (this.authService.isLoggedIn()) {
        this.currentView.set('profile');
      } else {
        // When logged out, revert to login or register view
        if (this.currentView() === 'profile') {
          this.currentView.set('login');
        }
      }
    });
  }

  ngOnInit(): void {
      // Set initial view to login if not logged in
      if (!this.authService.isLoggedIn()) {
        this.currentView.set('login');
      }
  }

  setView(view: 'login' | 'register' | 'profile' | 'welcome'): void {
    this.currentView.set(view);
    this.statusMessage.set(null); // Clear message on view change
  }

  // --- Login Handler ---
  async login(event: Event): Promise<void> {
    event.preventDefault();
    this.isSubmitting.set(true);
    this.statusMessage.set(null);

    const success = await this.authService.login({
      username: this.loginUsername,
      password: this.loginPassword,
    });
    
    this.isSubmitting.set(false);

    if (success) {
      // Logged in successfully, effect will change view to 'profile'
      this.statusType.set('success');
      this.statusMessage.set(`Welcome back, ${this.authService.currentUsername()}!`);
    } else {
      this.statusType.set('error');
      this.statusMessage.set('Login failed. Please check your username and password.');
    }
  }

  // --- Register Handler ---
  async register(event: Event): Promise<void> {
    event.preventDefault();
    this.isSubmitting.set(true);
    this.statusMessage.set(null);
    
    // 1. Basic Validation
    if (!this.registerUsername || !this.registerPassword || !this.registerConfirmPassword) {
      this.statusType.set('error');
      this.statusMessage.set('Please fill in both username and password.');
      this.isSubmitting.set(false);
      return;
    }

    // 2. Confirm Password Check
    if (this.registerPassword !== this.registerConfirmPassword) {
      this.statusType.set('error');
      this.statusMessage.set('Passwords do not match. Please ensure both passwords are the same.');
      this.isSubmitting.set(false);
      return;
    }

    const result = await this.authService.register({
      username: this.registerUsername,
      password: this.registerPassword,
    });
    
    this.isSubmitting.set(false);

    if (result.success) {
      this.statusType.set('success');
      this.statusMessage.set(result.message);
      this.setView('login'); // Switch to login after successful registration
      this.loginUsername = this.registerUsername; // Pre-fill login username
      this.registerUsername = '';
      this.registerPassword = '';
      this.registerConfirmPassword = '';
    } else {
      this.statusType.set('error');
      this.statusMessage.set(result.message);
    }
  }

  // --- Logout Handler ---
  logout(): void {
    this.authService.logout();
    this.setView('login');
    this.statusType.set('success');
    this.statusMessage.set('You have been logged out successfully.');
  }
}