import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, UserProfile, Transaction } from '../../services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <!-- Scrollable Main Content -->
      <div class="scroll-content">
        <!-- Top Header Profile & Actions -->
        <header class="home-header">
          <div class="profile-left">
            <div class="avatar-badge">
              <div class="avatar-circle">
                {{ user.initials || 'RO' }}
              </div>
              <div class="verified-dot">
                <svg viewBox="0 0 16 16" fill="none">
                  <path d="M4 8.5L6.5 11L12 5.5" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <div class="greeting-text">
              <span class="greeting-sub">{{ dynamicGreeting }}</span>
              <span class="user-name">{{ user.name || 'Alex' }} 👋</span>
            </div>
          </div>

          <div class="header-actions">
            <!-- Notification Bell with Red Dot -->
            <button class="icon-btn notif-btn" (click)="toggleNotifications()">
              <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="red-dot"></span>
            </button>

            <!-- Search Button -->
            <button class="icon-btn search-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- Balance Cards Carousel (Scrollable to the left matching media_1788730176652.jpg) -->
        <section class="cards-carousel">
          <div class="carousel-track" #carouselTrack (scroll)="onCarouselScroll($event)">
            <!-- Card 1: M-PESA Balance -->
            <div class="balance-card">
              <!-- Left Corner Gradient Overlay (Bright Green to Cyan/Blue) -->
              <svg class="card-edge-gradient" viewBox="0 0 24 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="edgeGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#00e676"/>
                    <stop offset="35%" stop-color="#00c853"/>
                    <stop offset="75%" stop-color="#00bcd4"/>
                    <stop offset="100%" stop-color="#0084ff"/>
                  </linearGradient>
                </defs>
                <path d="M24 0 H16 C7.16 0 0 7.16 0 16 V104 C0 112.84 7.16 120 16 120 H24" fill="none" stroke="url(#edgeGrad1)" stroke-width="3" stroke-linecap="round"/>
              </svg>

              <div class="card-pattern"></div>
              <div class="card-content">
                <div class="card-label">M-PESA Balance</div>

                <!-- Balance Row -->
                <div class="card-amount-row">
                  <!-- When Visible: Ksh 61.66 -->
                  <ng-container *ngIf="!hideBalance">
                    <span class="amount-val">
                      <span class="currency-prefix">Ksh </span>
                      <span class="currency-num">{{ user.balance | number:'1.2-2' }}</span>
                    </span>
                    <!-- Eye-slash toggle icon -->
                    <button class="eye-toggle-btn" (click)="toggleHideBalance()" title="Hide balance">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#8e959b" stroke-width="1.8" stroke-linecap="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    </button>
                  </ng-container>

                  <!-- When Hidden: Exact match to media_1788696544306.jpg -->
                  <ng-container *ngIf="hideBalance">
                    <div class="hidden-balance-pill"></div>
                    <!-- Open eye icon with concentric pupil circle -->
                    <button class="eye-toggle-btn" (click)="toggleHideBalance()" title="Show balance">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke="#cfd4d9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="12" r="3.2" stroke="#cfd4d9" stroke-width="1.8"/>
                        <circle cx="12" cy="12" r="1.3" fill="#cfd4d9"/>
                      </svg>
                    </button>
                  </ng-container>
                </div>

                <!-- Subtext Row -->
                <div *ngIf="!hideBalance" class="card-subtext">
                  Available Fuliza: Ksh {{ user.fuliza | number:'1.2-2' }}
                </div>
                <!-- Hidden Fuliza Pill from media_1788696544306.jpg -->
                <div *ngIf="hideBalance" class="hidden-subtext-pill"></div>

                <button class="statements-btn" (click)="openStatements()">
                  View Statements
                </button>
              </div>
            </div>

            <!-- Card 2: My Balances (Airtime & Bonga Points) matching media_1788730176652.jpg -->
            <div class="balance-card">
              <!-- Left Corner Gradient Overlay (Bright Green to Cyan/Blue) -->
              <svg class="card-edge-gradient" viewBox="0 0 24 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="edgeGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#00e676"/>
                    <stop offset="35%" stop-color="#00c853"/>
                    <stop offset="75%" stop-color="#00bcd4"/>
                    <stop offset="100%" stop-color="#0084ff"/>
                  </linearGradient>
                </defs>
                <path d="M24 0 H16 C7.16 0 0 7.16 0 16 V104 C0 112.84 7.16 120 16 120 H24" fill="none" stroke="url(#edgeGrad2)" stroke-width="3" stroke-linecap="round"/>
              </svg>

              <div class="card-pattern"></div>
              <div class="card-content">
                <div class="card-label">My Balances</div>

                <div class="split-balances-row">
                  <!-- Airtime Column -->
                  <div class="bal-col">
                    <div class="bal-col-label">Airtime</div>
                    <div class="bal-col-val">Ksh. {{ (user.airtime || 0) | number:'1.0-2' }}</div>
                  </div>

                  <!-- Thin Vertical Divider Line -->
                  <div class="bal-vertical-divider"></div>

                  <!-- Bonga Column -->
                  <div class="bal-col">
                    <div class="bal-col-label">Bonga</div>
                    <div class="bal-col-val">{{ (user.bonga !== undefined ? user.bonga : 0.41) | number:'1.2-2' }} Points</div>
                  </div>
                </div>

                <button class="view-all-balances-btn" (click)="openAllBalances()">
                  View All Balances
                </button>
              </div>
            </div>
          </div>

          <!-- Carousel Dot Indicators (Active dot dynamically highlights based on scroll position) -->
          <div class="carousel-dots">
            <span [ngClass]="activeCardIndex === 0 ? 'dot-pill' : 'dot-circle'" (click)="scrollToCard(0)"></span>
            <span [ngClass]="activeCardIndex === 1 ? 'dot-pill' : 'dot-circle'" (click)="scrollToCard(1)"></span>
          </div>
        </section>

        <!-- Quick Actions Grid (8 Items) -->
        <section class="quick-actions-section">
          <div class="section-header">
            <h3 class="section-title">Quick Actions</h3>
            <button class="view-all-link">
              View all
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="#00c853" stroke-width="2">
                <path d="M6 3l5 5-5 5"/>
              </svg>
            </button>
          </div>

          <div class="quick-actions-grid">
            <!-- 1. Send Money (Navigates to /send-money) -->
            <div class="action-item" (click)="goToSendMoney()">
              <div class="action-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <span class="action-label">Send<br/>Money</span>
            </div>

            <!-- 2. Lipa na M-PESA -->
            <div class="action-item">
              <div class="action-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
              <span class="action-label">Lipa na<br/>M-PESA</span>
            </div>

            <!-- 3. Withdraw Money -->
            <div class="action-item">
              <div class="action-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19 12l-3 3m0 0l-3-3m3 3V8" stroke="#e50914" stroke-width="2.2"/>
                </svg>
              </div>
              <span class="action-label">Withdraw<br/>Money</span>
            </div>

            <!-- 4. Pochi Wallet (Exact emblem from photo) -->
            <div class="action-item">
              <div class="action-circle pochi-circle">
                <img src="/icons/pochi-wallet.png" alt="Pochi Wallet" class="pochi-img" />
              </div>
              <span class="action-label">Pochi<br/>Wallet</span>
            </div>

            <!-- 5. Buy Bundles -->
            <div class="action-item">
              <div class="action-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 17V7m0 0L3 11m4-4l4 4" stroke="#00c853"/>
                  <path d="M17 7v10m0 0l4-4m-4 4l-4-4" stroke="#e50914"/>
                </svg>
              </div>
              <span class="action-label">Buy<br/>Bundles</span>
            </div>

            <!-- 6. Airtime Top Up -->
            <div class="action-item">
              <div class="action-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <span class="action-label">Airtime<br/>Top Up</span>
            </div>

            <!-- 7. Tunukiwa Bundles -->
            <div class="action-item">
              <div class="action-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12"/>
                  <rect x="2" y="7" width="20" height="5"/>
                  <line x1="12" y1="22" x2="12" y2="7"/>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
              </div>
              <span class="action-label">Tunukiwa<br/>Bundles</span>
            </div>

            <!-- 8. Home Internet -->
            <div class="action-item">
              <div class="action-circle">
                <svg viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                  <path d="M10 9a3 3 0 0 1 4 0" stroke="#00c853"/>
                </svg>
              </div>
              <span class="action-label">Home<br/>Internet</span>
            </div>
          </div>
        </section>

        <!-- Frequents Section -->
        <section class="frequents-section">
          <div class="frequents-header" (click)="toggleFrequents()">
            <h3 class="section-title">Frequents</h3>
            <svg class="chevron-icon" [class.rotated]="!frequentsOpen" viewBox="0 0 24 24" fill="none" stroke="#8e959b" stroke-width="2.5">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </div>

          <div class="frequents-body" *ngIf="frequentsOpen">
            <!-- Filter Pills -->
            <div class="pills-row">
              <button class="pill-btn" [class.active]="activeFrequentTab === 'Apps'" (click)="activeFrequentTab = 'Apps'">Apps</button>
              <button class="pill-btn" [class.active]="activeFrequentTab === 'Send'" (click)="activeFrequentTab = 'Send'">Send</button>
              <button class="pill-btn" [class.active]="activeFrequentTab === 'Pay'" (click)="activeFrequentTab = 'Pay'">Pay</button>
              <button class="pill-btn" [class.active]="activeFrequentTab === 'Bundles'" (click)="activeFrequentTab = 'Bundles'">Bundles</button>
            </div>

            <!-- Frequent Card Item -->
            <div class="frequent-item-card">
              <div class="visa-icon-box">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="2" width="14" height="20" rx="3" fill="#00c853"/>
                  <rect x="7" y="5" width="10" height="12" rx="1" fill="#1f2327"/>
                  <circle cx="12" cy="19.5" r="1" fill="#ffffff"/>
                  <path d="M9 8h6M9 11h4" stroke="#00c853" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="frequent-item-name">M-Pesa Visa Card(Glob...</div>
            </div>
          </div>
        </section>

        <!-- Explore & Discover Deals -->
        <section class="deals-section">
          <div class="deals-header">
            <h3 class="section-title">Explore & Discover Deals 🔥</h3>
          </div>

          <div class="deal-banner">
            <!-- Left Info Zone -->
            <div class="banner-left-content">
              <!-- Leeza Logo & Stickman -->
              <div class="leeza-brand-row">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
                  <circle cx="12" cy="5" r="2.2" fill="#111111"/>
                  <path d="M12 7.5v5l3 3.5M12 10.5l-3 2.5M9 7.5l3 2.5 4-1.5" stroke="#111111" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
                <div class="leeza-text-col">
                  <span class="leeza-name">leeza</span>
                  <span class="leeza-tag">ck your world</span>
                </div>
              </div>

              <!-- 3-Line Heading matching screenshot -->
              <div class="deal-main-title">
                Watch Ads, Answer<br/>
                Simple Questions &<br/>
                Unlock Rewards
              </div>

              <!-- Carousel Pagination Dashes -->
              <div class="banner-carousel-pills">
                <span class="bpill bpill-active"></span>
                <span class="bpill"></span>
                <span class="bpill"></span>
              </div>
            </div>

            <!-- Right Phone Mockup Zone -->
            <div class="banner-phone-mockup">
              <div class="mini-phone-frame">
                <div class="mini-phone-notch"></div>
                <div class="mini-phone-header">
                  <span>Reward Ads</span>
                  <span class="mph-sub">Earn coins: Ksh 220</span>
                </div>
                <div class="mini-phone-grid">
                  <div class="mini-card-thumb t-orange">
                    <span class="mct-lbl">CHICKEN</span>
                  </div>
                  <div class="mini-card-thumb t-red">
                    <span class="mct-lbl">BURGER</span>
                  </div>
                  <div class="mini-card-thumb t-dark">
                    <span class="mct-lbl">PIZZA</span>
                  </div>
                  <div class="mini-card-thumb t-green">
                    <span class="mct-lbl">DEAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- My Finances Section (from media_1788697431530.jpg) -->
        <section class="apps-section finances-section">
          <div class="section-header">
            <h3 class="section-title">My Finances</h3>
            <button class="view-all-link">
              View all
              <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="#00c853" stroke-width="2">
                <path d="M6 3l5 5-5 5"/>
              </svg>
            </button>
          </div>

          <div class="apps-scroll-row">
            <!-- 1. ZiiDi Trader -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-dark-green">
                <div class="ziidi-trader-icon">
                  <span class="zt-lbl">ZiiDi Trader</span>
                  <svg viewBox="0 0 20 8" width="20" height="8" fill="none" stroke="#00e676" stroke-width="1.2">
                    <polyline points="0 7 6 3 11 6 19 1"/>
                  </svg>
                </div>
              </div>
              <span class="app-card-label">ZiiDi<br/>Trader</span>
            </div>

            <!-- 2. ZiiDi Invest & Save -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-dark-green">
                <div class="ziidi-badge-pill">
                  <span class="zbp-text">ZiiDi</span>
                </div>
              </div>
              <span class="app-card-label">ZiiDi<br/>Invest &amp; Save</span>
            </div>

            <!-- 3. Tuunza Mapato -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-solid-green">
                <div class="tuunza-circle">
                  <span class="tc-top">TUUNZA</span>
                  <span class="tc-bot">MAPATO</span>
                </div>
              </div>
              <span class="app-card-label">Tuunza<br/>Mapato</span>
            </div>

            <!-- 4. ShirikiPay -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-charcoal">
                <div class="shiriki-circle">
                  <svg viewBox="0 0 20 20" width="18" height="18" fill="none">
                    <path d="M3 14c3-6 10-6 14 0" stroke="#e50914" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M7 8l3-4 3 4" fill="#e50914"/>
                  </svg>
                </div>
              </div>
              <span class="app-card-label">ShirikiPay</span>
            </div>

            <!-- 5. Mali -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-dark-green">
                <div class="mali-circle">
                  <span class="mc-text">MALI</span>
                </div>
              </div>
              <span class="app-card-label">Mali</span>
            </div>
          </div>
        </section>

        <!-- Entertainment Section (from media_1788697431530.jpg) -->
        <section class="apps-section entertainment-section">
          <div class="section-header">
            <h3 class="section-title">Entertainment</h3>
          </div>

          <div class="apps-scroll-row">
            <!-- 1. Baze -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-cream">
                <div class="baze-logo">
                  <span class="bz-b">B</span><span class="bz-a">a</span><span class="bz-z">z</span><span class="bz-e">e</span>
                </div>
              </div>
              <span class="app-card-label">Baze</span>
            </div>

            <!-- 2. Games -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-cream">
                <div class="games-icon">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                    <rect x="2" y="5" width="7" height="7" rx="1.5" fill="#f05a28"/>
                    <circle cx="5.5" cy="8.5" r="1" fill="#ffffff"/>
                    <path d="M13 10c0-2 2-3 5-3s5 1 5 3-1 6-3 6h-4c-2 0-3-4-3-6z" fill="#d85230"/>
                    <path d="M16 11h2m-1-1v2" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
                    <circle cx="20.5" cy="11.5" r="1" fill="#ffffff"/>
                  </svg>
                </div>
              </div>
              <span class="app-card-label">Games</span>
            </div>

            <!-- 3. Newspaper -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-cream">
                <div class="newspaper-icon">
                  <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                    <rect x="4" y="3" width="16" height="18" rx="2" fill="#eceff1" stroke="#b0bec5" stroke-width="1"/>
                    <rect x="7" y="6" width="10" height="2" fill="#37474f"/>
                    <rect x="7" y="10" width="4" height="4" fill="#90a4ae"/>
                    <line x1="13" y1="10" x2="17" y2="10" stroke="#78909c" stroke-width="1.2"/>
                    <line x1="13" y1="13" x2="17" y2="13" stroke="#78909c" stroke-width="1.2"/>
                    <line x1="7" y1="16" x2="17" y2="16" stroke="#78909c" stroke-width="1.2"/>
                  </svg>
                </div>
              </div>
              <span class="app-card-label">Newspaper</span>
            </div>

            <!-- 4. Skiza -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-white">
                <div class="skiza-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
                    <!-- Green splash shape -->
                    <path d="M12 2c3 1 7 4 8 7s-1 8-4 10-8 1-11-2 1-7 3-10 1-4 4-5z" fill="#00c853"/>
                    <path d="M8 12c1-2 3-3 6-2s3 3 2 4-4 2-5 1" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                </div>
              </div>
              <span class="app-card-label">Skiza</span>
            </div>

            <!-- 5. VybCu... -->
            <div class="app-card-item">
              <div class="app-icon-squircle sq-solid-green">
                <div class="vyb-icon">
                  <span class="vyb-text">Vyb</span>
                </div>
              </div>
              <span class="app-card-label">VybCu...</span>
            </div>
          </div>
        </section>

        <!-- Do more with M-PESA Section -->
        <section class="do-more-section">
          <h3 class="do-more-title">Do more with M-PESA</h3>
          <p class="do-more-subtitle">Pay, book, learn, and earn in one place.</p>
        </section>
      </div>

      <!-- Floating Customer Care Avatar (waving agent from screenshot) -->
      <div class="floating-care-avatar" (click)="openCareDialog()" title="Customer Care Support">
        <div class="care-avatar-inner">
          <svg viewBox="0 0 50 50" fill="none">
            <!-- Circular white background -->
            <circle cx="25" cy="25" r="24" fill="#ffffff"/>
            <!-- Torso / White blouse -->
            <path d="M12 45c0-7 6-11 13-11s13 4 13 11z" fill="#f0f4f8"/>
            <path d="M21 34l4 6 4-6z" fill="#22a958"/>
            <!-- Head / Face -->
            <ellipse cx="25" cy="22" rx="7" ry="8" fill="#a06048"/>
            <!-- Hair -->
            <path d="M17 21c0-5 3-9 8-9s8 4 8 9c0 2-1 3-2 3-2 0-3-4-6-4s-4 4-6 4c-1 0-2-1-2-3z" fill="#2d1d17"/>
            <circle cx="25" cy="12" r="3" fill="#2d1d17"/>
            <!-- Smiling mouth -->
            <path d="M23 25q2 1.5 4 0" stroke="#ffffff" stroke-width="0.8" stroke-linecap="round"/>
            <!-- Waving right hand -->
            <path d="M34 32c2-3 4-8 2-11-1.5-2-3.5 1-3.5 3l-1.5 6" stroke="#a06048" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <!-- Floating "Scan to pay" Button (Pill matching media_1788695968507.png) -->
      <div class="floating-scan-btn" (click)="openScanToPay()">
        <div class="scan-qr-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <!-- Top-Left Green Corner -->
            <path d="M3 8V5a2 2 0 0 1 2-2h3" stroke="#22a958" stroke-width="2.2" stroke-linecap="round"/>
            <!-- Top-Right Red Corner -->
            <path d="M16 3h3a2 2 0 0 1 2 2v3" stroke="#e50914" stroke-width="2.2" stroke-linecap="round"/>
            <!-- Bottom-Left Green Corner -->
            <path d="M3 16v3a2 2 0 0 0 2 2h3" stroke="#22a958" stroke-width="2.2" stroke-linecap="round"/>
            <!-- Bottom-Right Red Corner -->
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" stroke="#e50914" stroke-width="2.2" stroke-linecap="round"/>
            <!-- Center dots/matrix -->
            <rect x="7" y="7" width="3" height="3" fill="#22a958"/>
            <rect x="14" y="7" width="3" height="3" fill="#e50914"/>
            <rect x="7" y="14" width="3" height="3" fill="#22a958"/>
            <rect x="14" y="14" width="3" height="3" fill="#ffffff"/>
          </svg>
        </div>
        <span class="scan-label">Scan to pay</span>
      </div>

      <!-- Statements Modal -->
      <div class="modal-backdrop" *ngIf="showStatementsModal" (click)="closeStatements()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>M-PESA Statements</h3>
            <button class="close-btn" (click)="closeStatements()">✕</button>
          </div>
          <div class="modal-body">
            <div class="balance-summary">
              <div>
                <span class="sub-label">Current Balance</span>
                <h4>Ksh {{ user.balance | number:'1.2-2' }}</h4>
              </div>
              <div>
                <span class="sub-label">Available Fuliza</span>
                <h4>Ksh {{ user.fuliza | number:'1.2-2' }}</h4>
              </div>
            </div>

            <h4 class="history-title">Recent Transactions</h4>
            <div class="transactions-list">
              <div class="tx-item" *ngFor="let tx of transactions">
                <div class="tx-left">
                  <div class="tx-icon" [class.send-icon]="tx.type === 'SEND'">
                    <svg *ngIf="tx.type === 'SEND'" viewBox="0 0 24 24" fill="none" stroke="#e50914" stroke-width="2.2">
                      <path d="M7 17L17 7m0 0H9m8 0v8"/>
                    </svg>
                    <svg *ngIf="tx.type !== 'SEND'" viewBox="0 0 24 24" fill="none" stroke="#00c853" stroke-width="2.2">
                      <path d="M17 7L7 17m0 0h8m-8 0V9"/>
                    </svg>
                  </div>
                  <div class="tx-info">
                    <div class="tx-recipient">{{ tx.recipient }}</div>
                    <div class="tx-meta">{{ tx.displayDate || tx.date | slice:0:10 }} • {{ tx.id }}</div>
                  </div>
                </div>
                <div class="tx-right">
                  <div class="tx-amount" [class.negative]="tx.type === 'SEND'">
                    {{ tx.type === 'SEND' ? '-' : '+' }}Ksh {{ tx.amount | number:'1.2-2' }}
                  </div>
                  <div class="tx-bal">Bal: Ksh {{ tx.balanceAfter | number:'1.2-2' }}</div>
                </div>
              </div>
              <div class="empty-tx" *ngIf="transactions.length === 0">
                No statement records found.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- In-App Floating Toast Notification -->
      <div class="home-toast" *ngIf="homeToast.show" [ngClass]="homeToast.type">
        <div class="toast-dot"></div>
        <span>{{ homeToast.message }}</span>
      </div>

      <!-- Bottom Gesture Line -->
      <div class="bottom-bar">
        <div class="home-indicator"></div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      width: 100%;
      height: 100%;
      min-height: 100vh;
      min-height: 100dvh;
      background-color: #101214;
      display: flex;
      flex-direction: column;
      position: relative;
      color: #ffffff;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .scroll-content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding-bottom: 96px;
      -webkit-overflow-scrolling: touch;
    }

    /* Header Profile */
    .home-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px 12px 16px;
    }
    .profile-left {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }
    .avatar-badge {
      position: relative;
    }
    .avatar-circle {
      width: 44px;
      height: 44px;
      background: #541544;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    .verified-dot {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 14px;
      height: 14px;
      background-color: #00c853;
      border: 1.5px solid #101214;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5px;
    }
    .verified-dot svg {
      width: 100%;
      height: 100%;
    }
    .greeting-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .greeting-sub {
      font-size: 12px;
      font-weight: 400;
      color: #9aa0a6;
      line-height: 1.2;
    }
    .user-name {
      font-size: 15px;
      font-weight: 500;
      color: #ffffff;
      line-height: 1.2;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .icon-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1a1e21;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      border: 1px solid #252b30;
      cursor: pointer;
    }
    .icon-btn svg {
      width: 18px;
      height: 18px;
    }
    .notif-btn .red-dot {
      position: absolute;
      top: 6px;
      right: 7px;
      width: 6px;
      height: 6px;
      background-color: #e50914;
      border-radius: 50%;
      border: 1px solid #1a1e21;
    }

    /* Balance Cards Carousel */
    .cards-carousel {
      padding: 4px 16px 14px 16px;
    }
    .carousel-track {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      position: relative;
      padding: 0 0 2px 0;
    }
    .carousel-track::-webkit-scrollbar {
      display: none;
    }
    .balance-card {
      background-color: #16191c;
      border-radius: 16px;
      border: 1px solid #23282c;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      flex: 0 0 88%;
      scroll-snap-align: center;
      padding: 16px 16px 14px 16px;
      box-sizing: border-box;
      min-height: 154px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-edge-gradient {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 24px;
      height: 100%;
      pointer-events: none;
      z-index: 5;
    }
    .card-pattern {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background-image: 
        radial-gradient(circle at 80% 20%, rgba(0, 200, 83, 0.08) 0%, transparent 60%),
        url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0l60 30-30 60L0 0zm60 30l60-10-20 70-40-60zm40 60l20-70v100l-20-30zm-40-60l30 60-60 30 30-90z' fill='none' stroke='%2300c853' stroke-width='0.4' stroke-opacity='0.08'/%3E%3C/svg%3E");
      background-repeat: repeat;
      pointer-events: none;
    }
    .card-content {
      position: relative;
      z-index: 2;
    }
    .card-label {
      color: #00c853;
      font-size: 12.5px;
      font-weight: 500;
      margin-bottom: 6px;
      letter-spacing: 0.1px;
    }
    .peeking-label {
      color: #00c853;
    }
    .airtime-sub {
      color: #ffffff;
      font-size: 12px;
      font-weight: 400;
      margin-bottom: 6px;
    }
    .card-amount-row {
      display: flex;
      align-items: center;
      gap: 12px;
      height: 32px;
      margin-bottom: 6px;
    }
    .currency-prefix {
      font-size: 18px;
      font-weight: 400;
      color: #ffffff;
    }
    .currency-num {
      font-size: 22px;
      font-weight: 500;
      color: #ffffff;
      letter-spacing: -0.3px;
    }
    .hidden-balance-pill {
      width: 96px;
      height: 25px;
      background: #252a2d;
      border-radius: 7px;
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
    }
    .hidden-subtext-pill {
      width: 156px;
      height: 13px;
      background: #222629;
      border-radius: 6px;
      filter: blur(1.5px);
      opacity: 0.9;
      margin-bottom: 14px;
    }
    .eye-toggle-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
    }
    .eye-toggle-btn svg {
      width: 20px;
      height: 20px;
    }
    .card-subtext {
      color: #8e959b;
      font-size: 11.5px;
      font-weight: 400;
      margin-bottom: 14px;
    }
    .statements-btn {
      width: 100%;
      padding: 9px 0;
      border: 1.2px solid #00c853;
      border-radius: 8px;
      background: transparent;
      color: #00c853;
      font-size: 13px;
      font-weight: 500;
      text-align: center;
      cursor: pointer;
      letter-spacing: 0.1px;
      transition: background 0.15s;
    }
    .statements-btn:active {
      background: rgba(0, 200, 83, 0.12);
    }

    /* Card 2: My Balances Details (matching media_1788730176652.jpg) */
    .split-balances-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 4px 0 10px 0;
      padding: 0 4px;
    }
    .bal-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .bal-col-label {
      color: #b0bec5;
      font-size: 13px;
      font-weight: 400;
    }
    .bal-col-val {
      color: #ffffff;
      font-size: 19px;
      font-weight: 500;
      letter-spacing: -0.2px;
      white-space: nowrap;
    }
    .bal-vertical-divider {
      width: 1px;
      height: 38px;
      background: rgba(255, 255, 255, 0.12);
      margin: 0 14px;
      flex-shrink: 0;
    }
    .view-all-balances-btn {
      width: 100%;
      height: 38px;
      border: 1.5px solid #00c853;
      background: transparent;
      color: #00c853;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
      margin-top: 4px;
    }
    .view-all-balances-btn:active {
      background: rgba(0, 200, 83, 0.12);
    }

    .carousel-dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin-top: 10px;
    }
    .dot-pill {
      width: 18px;
      height: 4px;
      border-radius: 3px;
      background-color: #00c853;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dot-circle {
      width: 6px;
      height: 4px;
      border-radius: 3px;
      background-color: #3e454c;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    /* Quick Actions */
    .quick-actions-section {
      background-color: #16191c;
      margin: 0 16px 14px 16px;
      padding: 16px 14px 14px 14px;
      border-radius: 14px;
      border: 1px solid #202428;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 14.5px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: 0.1px;
    }
    .view-all-link {
      color: #00c853;
      font-size: 12.5px;
      font-weight: 400;
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      row-gap: 16px;
      column-gap: 8px;
    }
    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      text-align: center;
    }
    .action-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1f2327;
      border: 1px solid #282f34;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      transition: transform 0.15s;
    }
    .action-circle:active {
      transform: scale(0.94);
    }
    .action-circle svg {
      width: 20px;
      height: 20px;
    }
    .action-circle.pochi-circle {
      background: transparent;
      border: none;
      padding: 0;
      overflow: hidden;
    }
    .pochi-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: block;
      object-fit: cover;
    }
    .action-label {
      font-size: 11px;
      font-weight: 400;
      color: #cfd4d9;
      line-height: 1.22;
      text-align: center;
    }

    /* Frequents Section */
    .frequents-section {
      background-color: #16191c;
      margin: 0 16px 14px 16px;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid #202428;
    }
    .frequents-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
    }
    .frequents-header .section-title {
      font-size: 14.5px;
      font-weight: 600;
      color: #ffffff;
    }
    .chevron-icon {
      width: 16px;
      height: 16px;
      stroke: #8e959b;
      transition: transform 0.2s;
    }
    .chevron-icon.rotated {
      transform: rotate(180deg);
    }
    .pills-row {
      display: flex;
      gap: 6px;
      margin: 14px 0 12px 0;
    }
    .pill-btn {
      padding: 5px 16px;
      border-radius: 18px;
      background: #202428;
      border: none;
      color: #9aa0a6;
      font-size: 12px;
      font-weight: 400;
      cursor: pointer;
      transition: background 0.15s;
    }
    .pill-btn.active {
      background: #00c853;
      color: #ffffff;
      font-weight: 500;
    }
    .frequent-item-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 80px;
    }
    .visa-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1f2327;
      border: 1px solid #282f34;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
    }
    .visa-icon-box svg {
      width: 20px;
      height: 20px;
    }
    .frequent-item-name {
      font-size: 10.5px;
      font-weight: 400;
      color: #9aa0a6;
      text-align: center;
      line-height: 1.2;
    }

    /* Deals Section */
    .deals-section {
      margin: 0 16px 20px 16px;
    }
    .deals-header {
      margin-bottom: 10px;
    }
    .deals-header .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }
    /* Deals Section */
    .deals-section {
      margin: 0 16px 14px 16px;
    }
    .deals-header {
      margin-bottom: 10px;
    }
    .deals-header .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }
    .deal-banner {
      background: linear-gradient(105deg, #ff8028 0%, #ff4b58 55%, #ee1b58 100%);
      border-radius: 16px;
      padding: 16px 14px 16px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      box-shadow: 0 6px 20px rgba(238, 27, 88, 0.22);
    }
    .banner-left-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      z-index: 2;
    }
    .leeza-brand-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .leeza-text-col {
      display: flex;
      flex-direction: column;
    }
    .leeza-name {
      font-size: 16px;
      font-weight: 800;
      color: #111111;
      line-height: 1;
    }
    .leeza-tag {
      font-size: 7.5px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.75);
    }
    .deal-main-title {
      font-size: 14.5px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.25;
      margin-bottom: 12px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    }
    .banner-carousel-pills {
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .bpill {
      width: 6px;
      height: 2.5px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 2px;
    }
    .bpill-active {
      width: 14px;
      background: #ffffff;
    }

    /* Mini Phone Mockup inside Banner */
    .banner-phone-mockup {
      width: 95px;
      height: 125px;
      flex-shrink: 0;
      position: relative;
      z-index: 2;
      margin-left: 8px;
    }
    .mini-phone-frame {
      width: 100%;
      height: 100%;
      background: #ffffff;
      border: 3px solid #1a1a1a;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
    }
    .mini-phone-notch {
      width: 30px;
      height: 3px;
      background: #1a1a1a;
      border-radius: 0 0 3px 3px;
      margin: 0 auto;
    }
    .mini-phone-header {
      background: #e50914;
      color: #ffffff;
      padding: 3px 4px;
      font-size: 7px;
      font-weight: 700;
      display: flex;
      flex-direction: column;
      line-height: 1.1;
    }
    .mph-sub {
      font-size: 5.5px;
      font-weight: 400;
      opacity: 0.9;
    }
    .mini-phone-grid {
      padding: 4px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3px;
      flex: 1;
      background: #f8f9fa;
    }
    .mini-card-thumb {
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 34px;
    }
    .mct-lbl {
      font-size: 5px;
      font-weight: 700;
      color: #ffffff;
    }
    .t-orange { background: #ff7824; }
    .t-red { background: #e50914; }
    .t-dark { background: #263238; }
    .t-green { background: #00c853; }

    /* App Sections (My Finances & Entertainment) */
    .apps-section {
      background-color: #16191c;
      margin: 0 16px 14px 16px;
      padding: 16px 14px 14px 14px;
      border-radius: 14px;
      border: 1px solid #202428;
    }
    .apps-scroll-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 6px;
    }
    .app-card-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      min-width: 58px;
      max-width: 68px;
      cursor: pointer;
      text-align: center;
    }
    .app-icon-squircle {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      position: relative;
    }
    .sq-dark-green {
      background: #092614;
      border: 1px solid #144023;
    }
    .sq-solid-green {
      background: #00c853;
    }
    .sq-charcoal {
      background: #1f2327;
      border: 1px solid #283035;
    }
    .sq-cream {
      background: #fdf6ec;
      border: 1px solid #eee4d7;
    }
    .sq-white {
      background: #ffffff;
      border: 1px solid #e0e0e0;
    }
    .ziidi-trader-icon {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .zt-lbl {
      font-size: 7.5px;
      font-weight: 700;
      color: #00e676;
      line-height: 1;
    }
    .ziidi-badge-pill {
      background: #ffffff;
      padding: 2px 8px;
      border-radius: 10px;
    }
    .zbp-text {
      font-size: 10px;
      font-weight: 800;
      color: #00c853;
      letter-spacing: -0.2px;
    }
    .tuunza-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
    .tc-top {
      font-size: 6px;
      font-weight: 800;
      color: #00c853;
    }
    .tc-bot {
      font-size: 5px;
      font-weight: 700;
      color: #00c853;
    }
    .shiriki-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mali-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1.5px dashed #00e676;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mc-text {
      font-size: 8px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    .baze-logo {
      font-size: 12px;
      font-weight: 800;
      display: flex;
      letter-spacing: -0.3px;
    }
    .bz-b { color: #8e24aa; }
    .bz-a { color: #f57c00; }
    .bz-z { color: #00c853; }
    .bz-e { color: #0288d1; }
    .vyb-icon {
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
    }
    .app-card-label {
      font-size: 11px;
      font-weight: 400;
      color: #cfd4d9;
      line-height: 1.2;
      text-align: center;
    }

    /* Do more with M-PESA Section */
    .do-more-section {
      margin: 10px 16px 20px 16px;
      padding: 6px 4px 18px 4px;
    }
    .do-more-title {
      font-size: 14.5px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 3px;
    }
    .do-more-subtitle {
      font-size: 12px;
      font-weight: 400;
      color: #8e959b;
    }

    /* Floating Elements */
    .floating-care-avatar {
      position: absolute;
      right: 16px;
      bottom: 80px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #ffffff;
      border: 1.5px solid #333a40;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 40;
      overflow: hidden;
      transition: transform 0.15s;
    }
    .floating-care-avatar:active {
      transform: scale(0.94);
    }
    .care-avatar-inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .care-avatar-inner svg {
      width: 100%;
      height: 100%;
    }

    .floating-scan-btn {
      position: absolute;
      bottom: 22px;
      right: 16px;
      background-color: #22272b;
      border: 1px solid #333a41;
      border-radius: 24px;
      padding: 10px 18px 10px 14px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7);
      cursor: pointer;
      z-index: 45;
      transition: transform 0.15s;
      white-space: nowrap;
    }
    .floating-scan-btn:active {
      transform: scale(0.96);
    }
    .scan-qr-icon {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .scan-qr-icon svg {
      width: 100%;
      height: 100%;
    }
    .scan-label {
      font-size: 14px;
      font-weight: 500;
      color: #ffffff;
      white-space: nowrap;
      letter-spacing: 0.1px;
    }

    /* Modal Backdrop & Card */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      z-index: 999;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    .modal-card {
      background: #16191c;
      width: 100%;
      max-width: 420px;
      border-radius: 24px 24px 0 0;
      padding: 20px;
      border-top: 1px solid #2e353b;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .modal-header h3 {
      font-size: 16px;
      font-weight: 600;
    }
    .close-btn {
      color: #8e959b;
      font-size: 18px;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 4px;
    }
    .modal-body {
      overflow-y: auto;
    }
    .balance-summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: #111416;
      padding: 12px 14px;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .sub-label {
      font-size: 11px;
      color: #8e959b;
    }
    .balance-summary h4 {
      font-size: 15px;
      font-weight: 500;
      color: #00c853;
      margin-top: 2px;
    }
    .history-title {
      font-size: 13.5px;
      font-weight: 500;
      margin-bottom: 10px;
      color: #cfd4d9;
    }
    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .tx-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #1b1f22;
      border-radius: 10px;
    }
    .tx-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .tx-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #252b30;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tx-icon svg {
      width: 16px;
      height: 16px;
    }
    .tx-recipient {
      font-size: 12.5px;
      font-weight: 500;
    }
    .tx-meta {
      font-size: 10.5px;
      color: #8e959b;
    }
    .tx-right {
      text-align: right;
    }
    .tx-amount {
      font-size: 13px;
      font-weight: 500;
      color: #00c853;
    }
    .tx-amount.negative {
      color: #e50914;
    }
    .tx-bal {
      font-size: 10px;
      color: #8e959b;
    }
    .empty-tx {
      text-align: center;
      color: #8e959b;
      font-size: 13px;
      padding: 20px 0;
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
    .home-toast {
      position: absolute;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      background: #1c2227;
      color: #ffffff;
      border: 1px solid #2e3840;
      padding: 10px 18px;
      border-radius: 24px;
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.6);
      z-index: 1100;
      animation: toastSlide 0.25s ease-out;
    }
    .home-toast.success .toast-dot { background: #00c853; }
    .home-toast.info .toast-dot { background: #00e676; }
    .home-toast.warning .toast-dot { background: #ff9100; }
    .toast-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00c853;
      flex-shrink: 0;
    }
    @keyframes toastSlide {
      from { opacity: 0; transform: translate(-50%, -15px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private pollInterval: any;
  private toastTimer: any;

  @ViewChild('carouselTrack') carouselTrackRef!: ElementRef<HTMLDivElement>;
  activeCardIndex = 0;

  homeToast = {
    show: false,
    message: '',
    type: 'info' as 'info' | 'success' | 'warning'
  };

  user: UserProfile = {
    name: 'Alex Wanjiku',
    initials: 'AW',
    phone: '0712345678',
    greeting: 'Good morning,',
    balance: 61.66,
    fuliza: 100.00,
    airtime: 0.00,
    bonga: 0.41
  };

  hideBalance = false;
  frequentsOpen = true;
  activeFrequentTab = 'Apps';
  showStatementsModal = false;
  transactions: Transaction[] = [];

  showToast(message: string, type: 'info' | 'success' | 'warning' = 'info'): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.homeToast = { show: true, message, type };
    this.toastTimer = setTimeout(() => {
      this.homeToast.show = false;
    }, 2800);
  }

  onCarouselScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el) {
      const scrollLeft = el.scrollLeft;
      const cardWidth = el.offsetWidth * 0.75;
      const newIndex = scrollLeft > cardWidth * 0.4 ? 1 : 0;
      if (newIndex !== this.activeCardIndex) {
        this.activeCardIndex = newIndex;
        this.cdr.detectChanges();
      }
    }
  }

  scrollToCard(index: number): void {
    this.activeCardIndex = index;
    if (this.carouselTrackRef && this.carouselTrackRef.nativeElement) {
      const el = this.carouselTrackRef.nativeElement;
      const cardWidth = el.offsetWidth * 0.88 + 12;
      el.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth'
      });
      this.cdr.detectChanges();
    }
  }

  openAllBalances(): void {
    this.showToast('Airtime: Ksh ' + (this.user.airtime || 0) + ' | Bonga: ' + (this.user.bonga !== undefined ? this.user.bonga : 0.41) + ' Points', 'info');
  }

  get dynamicGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good morning,';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon,';
    } else {
      return 'Good evening,';
    }
  }

  lockApp(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('mpesa_pin_authenticated');
    }
    this.router.navigate(['/pin']);
  }

  goToPhoneScreen(): void {
    this.router.navigate(['/phone-screen']);
  }

  ngOnInit(): void {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mpesa_pin_authenticated') !== 'true') {
      this.router.navigate(['/pin']);
      return;
    }
    this.api.user$.subscribe(u => {
      if (u) {
        this.user = u;
        this.cdr.detectChanges();
      }
    });
    this.fetchData();
    this.pollInterval = setInterval(() => {
      this.fetchData();
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  fetchData(): void {
    this.api.getUser().subscribe({
      next: (res) => {
        if (res && res.user) {
          this.user = res.user;
          this.cdr.detectChanges();
        }
      }
    });

    this.api.getTransactions().subscribe({
      next: (txs) => {
        this.transactions = txs;
      }
    });
  }

  toggleHideBalance(): void {
    this.hideBalance = !this.hideBalance;
  }

  toggleFrequents(): void {
    this.frequentsOpen = !this.frequentsOpen;
  }

  goToSendMoney(): void {
    this.router.navigate(['/send-money']);
  }

  openStatements(): void {
    this.fetchData();
    this.showStatementsModal = true;
  }

  closeStatements(): void {
    this.showStatementsModal = false;
  }

  toggleNotifications(): void {
    this.showToast('No new notifications', 'info');
  }

  openCareDialog(): void {
    this.showToast('Connecting to Safaricom Customer Care...', 'info');
  }

  openScanToPay(): void {
    this.showToast('Camera QR scanner ready', 'info');
  }
}
