import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-10 rounded-xl shadow-2xl text-center border-t-8 border-indigo-600 w-full max-w-lg">
        <div class="flex flex-col items-center">
            <!-- Icon placeholder: User Icon -->
            <svg class="w-16 h-16 text-indigo-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 6v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2m18 0a2 2 0 00-2-2H5a2 2 0 00-2 2m18 0h-1m-4 0h-2"></path>
            </svg>
            
            <h2 class="text-4xl font-extrabold text-gray-800 mb-2">Welcome</h2>
            <p class="text-2xl text-indigo-700 font-semibold mb-6">
                Hello, <span class="text-green-600">{{ authService.currentUsername() }}</span>
            </p>
        </div>

        <div class="mt-8 p-5 bg-indigo-50 rounded-xl border border-indigo-200">
            <h3 class="text-lg font-bold text-indigo-800 mb-2">Authentication Status</h3>
            <p class="text-gray-600 text-sm">You have accessed this page because you possess a valid and unexpired **JWT Token**.</p>
            <p class="font-bold text-lg text-indigo-600 mt-2">SECURE ACCESS GRANTED</p>
        </div>

        <div class="mt-8">
            <button (click)="authService.logout(); router.navigate(['/login'])"
                    class="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-150 transform hover:scale-[1.01]">
                Log out and Return to Login
            </button>
        </div>
    </div>
  `,
})
export class ProfileComponent {
    // Services
    authService = inject(AuthService);
    router = inject(Router);

    constructor() {
        // Fetch profile data if needed
        if (!this.authService.currentUsername()) {
            this.authService.fetchProfile();
        }
    }
}