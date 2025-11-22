import { ApplicationConfig, InjectionToken, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';

// 1. สร้าง Injection Token สำหรับ API URL
export const API_URL = new InjectionToken<string>('API Base URL');

// 2. กำหนดค่าสำหรับ Production
// เมื่อ Build สำหรับ Production, ค่านี้จะถูกใช้
const productionApiUrl = 'https://api.your-production-domain.com';

// 3. กำหนดค่าสำหรับ Development (ค่า Default)
// ในการทำงานปกติ (Development) ถ้าไม่มีการกำหนดค่าใหม่, จะใช้ค่านี้
const developmentApiUrl = 'http://localhost:5000'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),

    // 4. Provide ค่า API URL ให้กับ Token ที่สร้างขึ้น
    // ในการ Deploy จริง (Production Build) คุณจะใช้ productionApiUrl
    // แต่สำหรับตอนนี้ ให้เราใช้ค่า Development เป็น Default
    { provide: API_URL, useValue: developmentApiUrl } 
  ]
};
