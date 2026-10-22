import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, UserProfile } from '../../services/api.service';

@Component({
  selector: 'app-pin-entry',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pin-screen">
      <!-- Top Title -->
      <div class="top-title-bar">
        <h1 class="page-title">Enter your M-PESA PIN</h1>
      </div>

      <!-- User Profile Information matching photo -->
      <div class="user-profile-section" (click)="toggleSwitcher()" title="Tap to switch profile">
        <div class="avatar-circle">
          {{ user.initials || 'AW' }}
        </div>
        <div class="user-name">{{ user.name || 'Alex Wanjiku' }}</div>
        <div class="user-phone">{{ user.maskedPhone || '079******85' }}</div>
      </div>

      <!-- Green Data Bundles Notice Pill matching photo -->
      <div class="bundles-notice-pill">
        <div class="notice-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#00c853" stroke-width="2" fill="rgba(0, 200, 83, 0.15)"/>
            <path d="M12 7.5v5M12 16v0.5" stroke="#00c853" stroke-width="2.2" stroke-linecap="round"/>
          </svg>
        </div>
        <span class="notice-text">This app will not use any of your data bundles</span>
      </div>

      <!-- 4 PIN Square Input Boxes (dances in red on wrong PIN) -->
      <div class="pin-boxes-container" [class.wrong-dance]="isWrongPinDancing">
        <div class="pin-box" [class.filled]="pin.length >= 1">
          <div class="pin-dot" *ngIf="pin.length >= 1"></div>
        </div>
        <div class="pin-box" [class.filled]="pin.length >= 2">
          <div class="pin-dot" *ngIf="pin.length >= 2"></div>
        </div>
        <div class="pin-box" [class.filled]="pin.length >= 3">
          <div class="pin-dot" *ngIf="pin.length >= 3"></div>
        </div>
        <div class="pin-box" [class.filled]="pin.length >= 4">
          <div class="pin-dot" *ngIf="pin.length >= 4"></div>
        </div>
      </div>

      <!-- Numeric Keypad matching photo (clean floating numbers & green/red backspace) -->
      <div class="keypad-wrapper">
        <div class="keypad-row">
          <button class="num-key" (click)="pressKey('1')">1</button>
          <button class="num-key" (click)="pressKey('2')">2</button>
          <button class="num-key" (click)="pressKey('3')">3</button>
        </div>
        <div class="keypad-row">
          <button class="num-key" (click)="pressKey('4')">4</button>
          <button class="num-key" (click)="pressKey('5')">5</button>
          <button class="num-key" (click)="pressKey('6')">6</button>
        </div>
        <div class="keypad-row">
          <button class="num-key" (click)="pressKey('7')">7</button>
          <button class="num-key" (click)="pressKey('8')">8</button>
          <button class="num-key" (click)="pressKey('9')">9</button>
        </div>
        <div class="keypad-row">
          <div class="num-key empty-key"></div>
          <button class="num-key" (click)="pressKey('0')">0</button>
          <!-- Green round backspace button with red x from photo -->
          <button class="num-key backspace-btn" (click)="deleteKey()" title="Delete">
            <div class="green-ring-x">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#00c853" stroke-width="2.2"/>
                <path d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5" stroke="#e53935" stroke-width="2.2" stroke-linecap="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      <!-- Bottom Android Gesture Bar -->
      <div class="bottom-bar">
        <div class="home-indicator"></div>
      </div>

      <!-- ========================================================================= -->
      <!-- QUICK ACCOUNT SWITCHER BOTTOM SHEET (Zero login screen, pure convenience) -->
      <!-- ========================================================================= -->
      <div class="switcher-backdrop" *ngIf="showSwitcher" (click)="toggleSwitcher()"></div>
      <div class="switcher-sheet" *ngIf="showSwitcher">
        <div class="sheet-handle"></div>
        <div class="sheet-header">
          <h3>Select Active Profile</h3>
          <p class="sheet-sub">Each admin controls their own isolated balance & working PINs</p>
        </div>
        <div class="profiles-list">
          <div 
            class="profile-item" 
            *ngFor="let p of availableProfiles" 
            [class.active-p]="p.phone === activeAdminPhone"
            (click)="selectProfile(p)">
            <div class="p-avatar">{{ p.initials || 'AD' }}</div>
            <div class="p-info">
              <span class="p-name">{{ p.name }}</span>
              <span class="p-phone">{{ p.maskedPhone || p.phone }}</span>
            </div>
            <div class="p-check" *ngIf="p.phone === activeAdminPhone">
              <svg viewBox="0 0 20 20" fill="#00c853">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
        <button class="close-sheet-btn" (click)="toggleSwitcher()">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .pin-screen {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      background-color: #000000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      color: #ffffff;
      padding: calc(env(safe-area-inset-top, 0px) + 20px) 24px calc(env(safe-area-inset-bottom, 0px) + 12px) 24px;
      user-select: none;
      position: relative;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .top-title-bar {
      text-align: center;
      margin-top: 10px;
    }

    .page-title {
      font-size: 16px;
      font-weight: 500;
      color: #ffffff;
      letter-spacing: 0.25px;
    }

    .user-profile-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-top: 20px;
      margin-bottom: 4px;
      cursor: pointer;
    }

    .avatar-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #e53935;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .user-name {
      font-size: 17.5px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.2px;
      margin-bottom: 4px;
    }

    .user-phone {
      font-size: 13.5px;
      color: #8e959b;
      font-weight: 400;
      letter-spacing: 0.4px;
    }

    .bundles-notice-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: #14281c;
      border: 1px solid rgba(0, 200, 83, 0.35);
      padding: 7px 16px;
      border-radius: 20px;
      margin: 18px auto 34px auto;
      max-width: 330px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
    }

    .notice-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notice-icon svg {
      width: 100%;
      height: 100%;
    }

    .notice-text {
      font-size: 11.5px;
      font-weight: 500;
      color: #d1d5db;
      line-height: 1.25;
      text-align: center;
      white-space: nowrap;
    }

    .pin-boxes-container {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin: 0 auto 38px auto;
    }

    .pin-box {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      border: 1.5px solid rgba(255, 255, 255, 0.5);
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .pin-box.filled {
      border-color: rgba(255, 255, 255, 0.88);
    }

    .pin-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background-color: #ffffff;
      box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    }

    /* Wrong PIN Red Dancing Box Animation */
    @keyframes redBoxDance {
      0% { transform: translateX(0); }
      15% { transform: translateX(-12px) rotate(-1.5deg); }
      30% { transform: translateX(11px) rotate(1.5deg); }
      45% { transform: translateX(-9px) rotate(-1deg); }
      60% { transform: translateX(7px) rotate(0.8deg); }
      75% { transform: translateX(-4px); }
      90% { transform: translateX(2px); }
      100% { transform: translateX(0); }
    }

    .pin-boxes-container.wrong-dance {
      animation: redBoxDance 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    .pin-boxes-container.wrong-dance .pin-box {
      border-color: #ff3333 !important;
      background: rgba(255, 51, 51, 0.15) !important;
      box-shadow: 0 0 16px rgba(255, 51, 51, 0.5) !important;
    }

    .pin-boxes-container.wrong-dance .pin-dot {
      background-color: #ff3333 !important;
      box-shadow: 0 0 10px rgba(255, 51, 51, 0.9) !important;
    }

    .keypad-wrapper {
      width: 100%;
      max-width: 320px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .keypad-wrapper.disabled-keypad {
      pointer-events: none;
    }

    .keypad-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .num-key {
      flex: 1;
      height: 64px;
      background: transparent;
      border: none;
      color: #ffffff;
      font-size: 32px;
      font-weight: 350;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      border-radius: 50%;
      transition: background 0.12s ease;
    }

    .num-key:active {
      background: rgba(255, 255, 255, 0.08);
    }

    .empty-key {
      cursor: default;
      pointer-events: none;
    }

    .backspace-btn {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .green-ring-x {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .green-ring-x svg {
      width: 100%;
      height: 100%;
    }

    .bottom-bar {
      display: flex;
      justify-content: center;
      padding-bottom: 6px;
      flex-shrink: 0;
    }

    .home-indicator {
      width: 110px;
      height: 4px;
      background-color: #636b72;
      border-radius: 4px;
      opacity: 0.65;
    }

    /* Switcher Sheet */
    .switcher-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(4px);
      z-index: 99;
    }

    .switcher-sheet {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: #161b20;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px 20px 0 0;
      padding: 16px 20px 24px 20px;
      z-index: 100;
      animation: slideUp 0.25s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .sheet-handle {
      width: 36px;
      height: 4px;
      background: #4b5563;
      border-radius: 2px;
      margin: 0 auto 14px auto;
    }

    .sheet-header h3 {
      font-size: 17px;
      font-weight: 700;
      margin: 0;
      color: #ffffff;
    }

    .sheet-sub {
      font-size: 12px;
      color: #9aa0a6;
      margin: 4px 0 16px 0;
    }

    .profiles-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 260px;
      overflow-y: auto;
      margin-bottom: 16px;
    }

    .profile-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #1f272e;
      border: 1px solid rgba(255, 255, 255, 0.06);
      padding: 12px 14px;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .profile-item.active-p {
      border-color: #00c853;
      background: rgba(0, 200, 83, 0.1);
    }

    .p-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #b71c1c;
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .p-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .p-name {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }

    .p-phone {
      font-size: 12px;
      color: #9aa0a6;
    }

    .p-check svg {
      width: 22px;
      height: 22px;
    }

    .close-sheet-btn {
      width: 100%;
      padding: 12px;
      background: #283038;
      border: none;
      border-radius: 10px;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class PinEntryComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  pin = '';
  isWrongPinDancing = false;
  isNavigating = false;
  showSwitcher = false;
  activeAdminPhone = '0722220165';
  availableProfiles: any[] = [];
  private wrongDanceTimer: any = null;

  user: UserProfile = {
    name: 'Brian',
    initials: 'BR',
    phone: '0722220165',
    maskedPhone: '072******65',
    greeting: 'Good morning,',
    balance: 176528.65,
    fuliza: 100.00,
    airtime: 0.00
  };

  ngOnInit(): void {
    this.activeAdminPhone = this.api.getActiveAdminPhone();

    this.api.user$.subscribe(u => {
      if (u) {
        this.user = u;
        this.cdr.detectChanges();
      }
    });

    // Fetch initial user wallet for active admin (also triggers backend sync)
    this.api.getUser(this.activeAdminPhone).subscribe(res => {
      if (res && res.user) {
        this.user = res.user;
        this.cdr.detectChanges();
      }
    });

    // Preload available admin profiles for switcher
    this.api.getPublicAdminProfiles().subscribe(profiles => {
      this.availableProfiles = profiles;
      this.cdr.detectChanges();
    });

    // Sync admin list from backend: ensures any PIN created from admin dashboard
    // on another device is available here immediately
    this.api.syncAdminsFromBackend().then(() => {
      this.api.getPublicAdminProfiles().subscribe(profiles => {
        this.availableProfiles = profiles;
        this.cdr.detectChanges();
      });
    });
  }

  toggleSwitcher(): void {
    if (this.isNavigating) return;
    this.showSwitcher = !this.showSwitcher;
    if (this.showSwitcher) {
      this.api.getPublicAdminProfiles().subscribe(profiles => {
        this.availableProfiles = profiles;
        this.cdr.detectChanges();
      });
    }
  }

  selectProfile(p: any): void {
    this.activeAdminPhone = p.phone;
    this.api.setActiveAdminPhone(p.phone);
    this.showSwitcher = false;
    this.pin = '';
    this.api.getUser(p.phone).subscribe(res => {
      if (res && res.user) {
        this.user = res.user;
        this.cdr.detectChanges();
      }
    });
  }

  pressKey(digit: string): void {
    if (this.isNavigating) {
      return;
    }

    // If wrong PIN was dancing, immediately cancel the dance, clear PIN, and accept the new keypress
    if (this.isWrongPinDancing) {
      if (this.wrongDanceTimer) {
        clearTimeout(this.wrongDanceTimer);
        this.wrongDanceTimer = null;
      }
      this.isWrongPinDancing = false;
      this.pin = '';
    }

    if (this.pin.length >= 4) {
      return;
    }
    this.pin += digit;
    this.cdr.detectChanges();

    if (this.pin.length === 4) {
      this.api.verifyAppPin(this.pin, this.activeAdminPhone).subscribe({
        next: (res) => {
          if (res && res.success) {
            if (res.user) this.user = res.user;
            if (res.adminPhone) {
              this.activeAdminPhone = res.adminPhone;
              this.api.setActiveAdminPhone(res.adminPhone);
            }
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('mpesa_pin_authenticated', 'true');
            }
            this.isNavigating = true;
            this.cdr.detectChanges();
            setTimeout(() => {
              this.router.navigate(['/home']);
            }, 120);
          } else {
            this.triggerWrongPinDance();
          }
        },
        error: () => {
          this.triggerWrongPinDance();
        }
      });
    }
  }

  triggerWrongPinDance(): void {
    this.isWrongPinDancing = true;
    this.isNavigating = false;
    this.cdr.detectChanges();

    if (this.wrongDanceTimer) {
      clearTimeout(this.wrongDanceTimer);
    }

    this.wrongDanceTimer = setTimeout(() => {
      this.pin = '';
      this.isWrongPinDancing = false;
      this.isNavigating = false;
      this.cdr.detectChanges();
    }, 550);
  }

  deleteKey(): void {
    if (this.isNavigating) return;
    if (this.isWrongPinDancing) {
      if (this.wrongDanceTimer) {
        clearTimeout(this.wrongDanceTimer);
        this.wrongDanceTimer = null;
      }
      this.isWrongPinDancing = false;
      this.pin = '';
      this.cdr.detectChanges();
      return;
    }
    if (this.pin.length > 0) {
      this.pin = this.pin.slice(0, -1);
      this.cdr.detectChanges();
    }
  }
}
