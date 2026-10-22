import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-install-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pwa-install-banner" *ngIf="showBanner">
      <div class="banner-content">
        <div class="app-icon">
          <img src="/icons/app-icon-splash.svg" alt="M-PESA" />
        </div>
        <div class="app-info">
          <div class="app-title">Install M-PESA App</div>
          <div class="app-sub">Download to your home screen for full offline app experience</div>
        </div>
      </div>
      <div class="banner-actions">
        <button class="install-btn" (click)="install()">
          Install
        </button>
        <button class="dismiss-btn" (click)="dismiss()">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .pwa-install-banner {
      background: #181c1f;
      border-bottom: 1px solid #282f34;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      z-index: 100;
      animation: slideDown 0.3s ease;
    }
    @keyframes slideDown {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }
    .banner-content {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
    }
    .app-icon {
      width: 38px;
      height: 38px;
      background: #000000;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }
    .app-icon img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .app-info {
      display: flex;
      flex-direction: column;
    }
    .app-title {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
    }
    .app-sub {
      font-size: 11px;
      color: #9aa0a6;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }
    .banner-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .install-btn {
      background: #00c853;
      color: #000;
      font-weight: 800;
      font-size: 12px;
      padding: 6px 14px;
      border-radius: 18px;
      transition: background 0.2s;
    }
    .install-btn:active {
      background: #00963f;
    }
    .dismiss-btn {
      color: #7d858c;
      font-size: 15px;
      padding: 4px;
    }
  `]
})
export class InstallBannerComponent implements OnInit {
  private pwaService = inject(PwaService);
  showBanner = false;

  ngOnInit(): void {
    // App download is restricted to the admin side only
    this.showBanner = false;
  }

  async install() {
    const accepted = await this.pwaService.promptInstall();
    if (accepted) {
      localStorage.setItem('mpesa_pwa_installed', 'true');
      this.showBanner = false;
    } else {
      // Silently mark as installed since user engaged with the prompt
      localStorage.setItem('mpesa_pwa_installed', 'true');
      this.showBanner = false;
    }
  }

  dismiss() {
    this.showBanner = false;
    localStorage.setItem('mpesa_banner_dismissed', 'true');
  }
}
