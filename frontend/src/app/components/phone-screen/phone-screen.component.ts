import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-phone-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="phone-screen-container">
      <!-- Phone Top Status Bar -->
      <div class="phone-status-bar">
        <span class="status-time">{{ currentTime }}</span>
        <div class="status-icons">
          <span class="data-speed">1.00 KB/s</span>
          <!-- Wi-Fi Icon -->
          <svg class="status-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4ZM12 6C15.93 6 19.5 7.6 22.08 10.18L12 18.26 1.92 10.18C4.5 7.6 8.07 6 12 6Z"/>
          </svg>
          <!-- VoLTE Icon -->
          <span class="volte-badge">Vo LTE</span>
          <!-- Cellular Signal Bars -->
          <div class="signal-bars">
            <span class="bar b1"></span>
            <span class="bar b2"></span>
            <span class="bar b3"></span>
            <span class="bar b4"></span>
          </div>
          <!-- Battery with 26% -->
          <div class="battery-pill">
            <span class="battery-pct">26</span>
          </div>
        </div>
      </div>

      <!-- Phone Clock & Date Widget -->
      <div class="clock-widget">
        <h1 class="big-clock">{{ currentClock }}</h1>
        <p class="current-date">{{ currentDate }}</p>
      </div>

      <!-- Google Search Bar Widget -->
      <div class="search-widget">
        <div class="g-logo">G</div>
        <span class="search-placeholder">Search...</span>
        <div class="mic-lens">
          <span class="mic-icon">🎙️</span>
        </div>
      </div>

      <!-- App Grid on Phone Home Screen -->
      <div class="apps-grid">
        <!-- FEATURED APP: Official My OneApp with Cropped Squircle Icon -->
        <div class="app-item featured-mpesa" (click)="launchMpesaApp()">
          <div class="app-icon-squircle mpesa-glow" [class.launching]="isLaunching">
            <img src="/icons/app-icon.png" alt="My OneApp" (error)="useSvgFallback($event)" />
            <div class="app-badge-dot">1</div>
          </div>
          <span class="app-label highlight-label">My OneApp</span>
        </div>

        <!-- Phone App -->
        <div class="app-item">
          <div class="app-icon-squircle icon-phone">
            <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.4 11.4 0 003.58.57 1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.4 11.4 0 00.57 3.58 1 1 0 01-.24 1.02l-2.21 2.19z"/>
            </svg>
          </div>
          <span class="app-label">Phone</span>
        </div>

        <!-- Messages App -->
        <div class="app-item">
          <div class="app-icon-squircle icon-messages">
            <img src="/icons/google-messages-logo.png" alt="Messages" width="30" height="30" />
          </div>
          <span class="app-label">Messages</span>
        </div>

        <!-- Chrome App -->
        <div class="app-item">
          <div class="app-icon-squircle icon-chrome">
            <svg viewBox="0 0 24 24" width="32" height="32">
              <circle cx="12" cy="12" r="10" fill="#4285F4"/>
              <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
              <circle cx="12" cy="12" r="3.2" fill="#1a73e8"/>
            </svg>
          </div>
          <span class="app-label">Chrome</span>
        </div>

        <!-- Camera App -->
        <div class="app-item">
          <div class="app-icon-squircle icon-camera">
            <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/>
              <path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10z"/>
            </svg>
          </div>
          <span class="app-label">Camera</span>
        </div>

        <!-- Gallery / Photos -->
        <div class="app-item">
          <div class="app-icon-squircle icon-photos">
            <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
              <path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
          <span class="app-label">Photos</span>
        </div>

        <!-- Settings -->
        <div class="app-item">
          <div class="app-icon-squircle icon-settings">
            <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84c-.24 0-.44.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z"/>
            </svg>
          </div>
          <span class="app-label">Settings</span>
        </div>

        <!-- WhatsApp -->
        <div class="app-item">
          <div class="app-icon-squircle icon-whatsapp">
            <span style="font-size: 30px;">💬</span>
          </div>
          <span class="app-label">WhatsApp</span>
        </div>
      </div>

      <!-- Quick Hint Banner -->
      <div class="tap-hint" (click)="launchMpesaApp()">
        <span>👉 Tap <strong>My OneApp</strong> to start the app from phone screen</span>
      </div>

      <!-- Bottom Dock Bar -->
      <div class="phone-dock">
        <div class="dock-app" (click)="launchMpesaApp()">
          <div class="app-icon-squircle mpesa-dock-icon">
            <img src="/icons/app-icon.png" alt="My OneApp" (error)="useSvgFallback($event)" />
          </div>
        </div>
        <div class="dock-app">
          <div class="app-icon-squircle icon-phone">
            <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.4 11.4 0 003.58.57 1 1 0 011 1v3.5a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.4 11.4 0 00.57 3.58 1 1 0 01-.24 1.02l-2.21 2.19z"/>
            </svg>
          </div>
        </div>
        <div class="dock-app">
          <div class="app-icon-squircle icon-messages">
            <img src="/icons/google-messages-logo.png" alt="Messages" width="26" height="26" />
          </div>
        </div>
        <div class="dock-app">
          <div class="app-icon-squircle icon-chrome">
            <svg viewBox="0 0 24 24" width="28" height="28">
              <circle cx="12" cy="12" r="10" fill="#4285F4"/>
              <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
              <circle cx="12" cy="12" r="3.2" fill="#1a73e8"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Bottom Gesture Bar -->
      <div class="bottom-bar">
        <div class="home-indicator"></div>
      </div>
    </div>
  `,
  styles: [`
    .phone-screen-container {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      background: radial-gradient(circle at 50% 20%, #17262c 0%, #0c1215 60%, #06090a 100%);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #ffffff;
      padding: 10px 18px 8px 18px;
      user-select: none;
      font-family: 'Plus Jakarta Sans', -apple-system, Roboto, sans-serif;
      overflow: hidden;
      position: relative;
    }

    /* Status Bar matching user phone */
    .phone-status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13.5px;
      font-weight: 600;
      color: #ffffff;
      padding: 4px 6px;
    }
    .status-icons {
      display: flex;
      align-items: center;
      gap: 7px;
    }
    .data-speed {
      font-size: 10.5px;
      color: #cfd6dd;
      font-weight: 500;
    }
    .status-icon {
      width: 15px;
      height: 15px;
    }
    .volte-badge {
      font-size: 9px;
      font-weight: 800;
      border: 1px solid rgba(255, 255, 255, 0.7);
      padding: 1px 3px;
      border-radius: 3px;
      line-height: 1;
    }
    .signal-bars {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 11px;
    }
    .signal-bars .bar {
      width: 2.5px;
      background: #ffffff;
      border-radius: 1px;
    }
    .b1 { height: 35%; }
    .b2 { height: 55%; }
    .b3 { height: 80%; }
    .b4 { height: 100%; }

    .battery-pill {
      border: 1.5px solid #ffffff;
      border-radius: 4px;
      padding: 1px 4px;
      font-size: 9.5px;
      font-weight: 700;
      display: flex;
      align-items: center;
      height: 14px;
      position: relative;
    }
    .battery-pill::after {
      content: '';
      position: absolute;
      right: -3px;
      top: 3px;
      width: 2px;
      height: 5px;
      background: #ffffff;
      border-radius: 0 1px 1px 0;
    }

    /* Clock Widget */
    .clock-widget {
      text-align: center;
      margin-top: 28px;
    }
    .big-clock {
      font-size: 64px;
      font-weight: 300;
      letter-spacing: -2px;
      margin: 0;
      line-height: 1;
    }
    .current-date {
      font-size: 14px;
      color: #9aa6b2;
      margin: 8px 0 0 0;
      font-weight: 500;
    }

    /* Google Search Widget */
    .search-widget {
      background: rgba(255, 255, 255, 0.12);
      backdrop-filter: blur(12px);
      border-radius: 26px;
      height: 48px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      gap: 12px;
      margin: 18px 4px 0 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .g-logo {
      font-weight: 800;
      font-size: 19px;
      color: #4285F4;
    }
    .search-placeholder {
      flex: 1;
      font-size: 14px;
      color: #8b949e;
    }
    .mic-lens {
      font-size: 16px;
    }

    /* Apps Grid */
    .apps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 22px 14px;
      margin: 30px 4px 10px 4px;
      justify-items: center;
    }
    .app-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      width: 68px;
    }
    .app-icon-squircle {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      position: relative;
      transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
      overflow: hidden;
    }
    .app-item:active .app-icon-squircle {
      transform: scale(0.9);
    }
    .app-icon-squircle img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .app-label {
      font-size: 11.5px;
      font-weight: 500;
      color: #ffffff;
      text-align: center;
      white-space: nowrap;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    }

    /* Featured M-PESA App Styling */
    .featured-mpesa .app-icon-squircle {
      width: 62px;
      height: 62px;
      border-radius: 17px;
      box-shadow: 0 6px 20px rgba(0, 200, 83, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .highlight-label {
      font-weight: 700;
      color: #00e676;
    }
    .app-badge-dot {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #e50914;
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #000;
    }
    .launching {
      animation: launchPulse 0.35s ease forwards;
    }
    @keyframes launchPulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); filter: brightness(1.2); }
      100% { transform: scale(1); }
    }

    /* Standard App Icon Backgrounds */
    .icon-phone { background: linear-gradient(135deg, #00c853, #009624); }
    .icon-messages { background: #1a73e8; }
    .icon-chrome { background: #ffffff; }
    .icon-camera { background: linear-gradient(135deg, #d32f2f, #f57c00); }
    .icon-photos { background: linear-gradient(135deg, #ab47bc, #7b1fa2); }
    .icon-settings { background: linear-gradient(135deg, #78909c, #455a64); }
    .icon-whatsapp { background: #25d366; }

    /* Hint Banner */
    .tap-hint {
      background: rgba(0, 200, 83, 0.15);
      border: 1px solid rgba(0, 200, 83, 0.4);
      border-radius: 18px;
      padding: 8px 14px;
      text-align: center;
      font-size: 12px;
      color: #00e676;
      margin: 8px auto;
      cursor: pointer;
      width: fit-content;
      box-shadow: 0 4px 12px rgba(0, 200, 83, 0.15);
    }
    .tap-hint strong {
      color: #ffffff;
      text-decoration: underline;
    }

    /* Phone Dock */
    .phone-dock {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(18px);
      border-radius: 28px;
      padding: 10px 18px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      margin: 4px 0 10px 0;
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .dock-app {
      cursor: pointer;
    }
    .dock-app .app-icon-squircle {
      width: 52px;
      height: 52px;
    }
    .mpesa-dock-icon {
      border: 1px solid rgba(255, 255, 255, 0.25);
      box-shadow: 0 4px 14px rgba(0, 200, 83, 0.35);
    }

    /* Bottom Bar */
    .bottom-bar {
      display: flex;
      justify-content: center;
      padding-bottom: 4px;
    }
    .home-indicator {
      width: 110px;
      height: 4px;
      background-color: #ffffff;
      border-radius: 4px;
      opacity: 0.6;
    }
  `]
})
export class PhoneScreenComponent implements OnInit {
  private router = inject(Router);

  currentTime = '11:53';
  currentClock = '11:53';
  currentDate = 'Sunday, September 6';
  isLaunching = false;

  ngOnInit(): void {
    this.updateClock();
    setInterval(() => this.updateClock(), 10000);
  }

  updateClock(): void {
    const now = new Date();
    this.currentClock = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
    this.currentTime = this.currentClock;
    this.currentDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  useSvgFallback(e: Event): void {
    const target = e.target as HTMLImageElement;
    target.src = '/icons/app-icon-splash.svg';
  }

  launchMpesaApp(): void {
    if (this.isLaunching) return;
    this.isLaunching = true;
    setTimeout(() => {
      // Launches app starting with the official squircle splash screen
      this.router.navigate(['/']);
    }, 250);
  }
}
