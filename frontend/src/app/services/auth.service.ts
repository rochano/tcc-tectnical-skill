import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common'; // <-- นำเข้า isPlatformBrowser
import { API_URL } from '../app.config'; 

// Interface for data structure
interface AuthResponse {
  token: string;
}

interface UserCredentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Main user state (Signals)
  isLoggedIn = signal(false);
  currentUsername = signal<string | null>(null);

  // 1. Inject Base API URL (e.g., 'http://localhost:5000')
  private apiBaseUrl = inject(API_URL); // <-- รับค่า Base URL จาก Injection Token

  // 2. Construct Full URLs โดยใช้ Base URL
  // URL สำหรับ Authentication Controller: /api/auth
  private readonly authControllerUrl = `${this.apiBaseUrl}/api/auth`; 
  // URL สำหรับ User Profile Endpoint: /api/user/profile
  private readonly profileUrl = `${this.apiBaseUrl}/api/user/profile`;

  // Inject PLATFORM_ID to determine where the code is running
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  constructor(private http: HttpClient) {
    // Check for existing token ONLY if running in the browser
    if (this.isBrowser) {
      this.checkInitialAuth();
    }
  }

  // --- Token Management ---
  // เพิ่มการตรวจสอบ isBrowser ในทุกฟังก์ชันที่ใช้ sessionStorage
  
  getToken(): string | null {
    if (!this.isBrowser) return null; // Guard against SSR
    return sessionStorage.getItem('authToken');
  }

  setToken(token: string): void {
    if (!this.isBrowser) return; // Guard against SSR
    sessionStorage.setItem('authToken', token);
    this.isLoggedIn.set(true);
  }

  removeToken(): void {
    if (!this.isBrowser) return; // Guard against SSR
    sessionStorage.removeItem('authToken');
    this.isLoggedIn.set(false);
    this.currentUsername.set(null);
  }

  // --- Authentication Logic ---

  private checkInitialAuth(): void {
    const token = this.getToken();
    if (token) {
      this.isLoggedIn.set(true);
      this.fetchProfile();
    }
  }

  // ************ API Calls (ใช้ fetch() API อยู่แล้ว) ************

  async register(credentials: UserCredentials): Promise<{ success: boolean, message: string }> {
    try {
      // ใช้ fetch() API โดยตรงเพื่อจัดการ Error Status codes
      const response = await fetch(`${this.authControllerUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.status === 201) {
        return { success: true, message: 'Registration successful! Please log in.' };
      } else if (response.status === 409) {
        return { success: false, message: 'This username is already taken.' };
      } else {
        const errorData = await response.json();
        return { success: false, message: `Registration failed: ${errorData.title || 'An unknown error occurred'}` };
      }
    } catch (error) {
      console.error('Register API Error:', error);
      return { success: false, message: 'Cannot connect to the server.' };
    }
  }

  async login(credentials: UserCredentials): Promise<boolean> {
    try {
      const response = await fetch(`${this.authControllerUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        this.setToken(data.token);
        this.fetchProfile(); // Fetch profile immediately after successful login
        return true;
      } else {
        // 401 Unauthorized or other errors
        return false;
      }
    } catch (error) {
      console.error('Login API Error:', error);
      return false;
    }
  }

  async fetchProfile(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      this.removeToken();
      return;
    }

    try {
      const response = await fetch(this.profileUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Profile API returns Username in the message: "Welcome, {username}!"
        const match = data.message.match(/Welcome, ([^!]+)!/);
        this.currentUsername.set(match ? match[1] : 'Unknown User');
      } else if (response.status === 401) {
        // Token expired or invalid
        this.removeToken(); 
      }
    } catch (error) {
      console.error('Profile API Error:', error);
      this.removeToken(); // Assume connection error means auth is compromised
    }
  }

  logout(): void {
    this.removeToken();
  }
}