import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-screen" (click)="advanceStage()">
      <!-- Stage 1: Official App Squircle Icon -->
      <div class="stage-container fade-in" *ngIf="stage === 1">
        <div class="app-icon-wrapper">
          <img src="/icons/app-icon.png" alt="My OneApp" class="splash-app-icon" />
        </div>
      </div>

      <!-- Stage 2: Horizontal Safaricom | m-pesa Logo -->
      <div class="stage-container fade-in" *ngIf="stage === 2">
        <div class="horizontal-logo-wrapper">
          <img src="/icons/stage2-logo-transparent.png" alt="Safaricom | m-pesa" class="stage2-logo-img" />
        </div>
      </div>

      <!-- Bottom Android Gesture Bar -->
      <div class="bottom-bar">
        <div class="home-indicator"></div>
      </div>
    </div>
  `,
  styles: [`
    .splash-screen {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      background-color: #0b0c0e;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      cursor: pointer;
      user-select: none;
    }
    .stage-container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      width: 100%;
    }
    .app-icon-wrapper {
      width: 145px;
      height: 145px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: zoomIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .splash-app-icon {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 34px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    }
    .horizontal-logo-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 24px;
      animation: fadeIn 0.4s ease;
    }
    .stage2-logo-img {
      width: 240px;
      max-width: 80vw;
      height: auto;
      object-fit: contain;
    }
    .bottom-bar {
      display: flex;
      justify-content: center;
      padding-bottom: 12px;
      flex-shrink: 0;
    }
    .home-indicator {
      width: 110px;
      height: 4px;
      background-color: #636b72;
      border-radius: 4px;
      opacity: 0.65;
    }
    @keyframes zoomIn {
      from { transform: scale(0.85); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class SplashComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  stage = 1;
  private timer1: any = null;
  private timer2: any = null;
  private gone = false;

  ngOnInit(): void {
    this.gone = false;
    this.stage = 1;
    this.startTimers();
  }

  ngOnDestroy(): void {
    this.gone = true;
    this.clearTimers();
  }

  private clearTimers(): void {
    if (this.timer1) { clearTimeout(this.timer1); this.timer1 = null; }
    if (this.timer2) { clearTimeout(this.timer2); this.timer2 = null; }
  }

  private startTimers(): void {
    this.clearTimers();
    this.timer1 = setTimeout(() => {
      if (this.gone) return;
      this.stage = 2;
      this.cdr.detectChanges();
      this.timer2 = setTimeout(() => {
        if (this.gone) return;
        this.goToPin();
      }, 1500);
    }, 1500);
  }

  advanceStage(): void {
    if (this.gone) return;
    this.clearTimers();
    if (this.stage === 1) {
      this.stage = 2;
      this.cdr.detectChanges();
      this.timer2 = setTimeout(() => {
        if (this.gone) return;
        this.goToPin();
      }, 1500);
    } else {
      this.goToPin();
    }
  }

  goToPin(): void {
    if (this.gone) return;
    this.gone = true;
    this.clearTimers();
    this.router.navigate(['/pin']);
  }
}
