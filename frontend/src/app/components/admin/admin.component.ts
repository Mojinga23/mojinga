import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, UserProfile, Transaction, Favorite, AdminUser } from '../../services/api.service';
import { PwaService } from '../../services/pwa.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <!-- In-App Toast Notification Banner (No "localhost says" alerts) -->
      <div class="toast-container" *ngIf="showToast" [class]="'toast-' + toastType" (click)="dismissToast()">
        <div class="toast-icon">
          <span *ngIf="toastType === 'success'">✓</span>
          <span *ngIf="toastType === 'error'">✕</span>
          <span *ngIf="toastType === 'info'">ℹ</span>
        </div>
        <div class="toast-content">{{ toastMessage }}</div>
        <button type="button" class="toast-close" (click)="dismissToast()">✕</button>
      </div>

      <!-- In-App Confirmation Modal (No browser confirm popups) -->
      <div class="modal-backdrop" *ngIf="showConfirmModal" (click)="cancelConfirm()">
        <div class="modal-dialog" (click)="$event.stopPropagation()">
          <div class="modal-icon-warn">⚠️</div>
          <h3 class="modal-title">{{ confirmTitle }}</h3>
          <p class="modal-desc">{{ confirmMessage }}</p>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" (click)="cancelConfirm()">Cancel</button>
            <button 
              type="button" 
              class="modal-action-btn"
              [class.danger-btn]="confirmBtnDanger" 
              [class.primary-btn]="!confirmBtnDanger" 
              (click)="executeConfirm()">
              {{ confirmBtnLabel }}
            </button>
          </div>
        </div>
      </div>

      <!-- Interactive Balance Adjustment Modal (Options to adjust with certain amount) -->
      <div class="modal-backdrop" *ngIf="showAdjustBalanceModal" (click)="closeBalanceModal()">
        <div class="balance-adjust-dialog" (click)="$event.stopPropagation()">
          <div class="modal-head-row">
            <div class="modal-head-title">
              <span class="modal-coin-icon">💰</span>
              <div>
                <h3 class="modal-title" style="margin-bottom:2px;text-align:left;">Adjust Live Balance</h3>
                <p class="modal-admin-sub">
                  Admin: <strong>{{ adjustTargetAdmin?.name }}</strong> (<code>{{ adjustTargetAdmin?.phone }}</code>)
                </p>
              </div>
            </div>
            <button type="button" class="modal-close-x" (click)="closeBalanceModal()">✕</button>
          </div>

          <!-- Current Live Balance Banner -->
          <div class="current-bal-banner">
            <span class="cbb-label">Current App Balance:</span>
            <span class="cbb-val">Ksh {{ (adjustTargetAdmin?.wallet?.balance ?? 61.66) | number:'1.2-2' }}</span>
          </div>

          <!-- Adjustment Mode Switcher -->
          <div class="adjust-mode-toggle">
            <button 
              type="button" 
              class="mode-pill-btn" 
              [class.active-add]="adjustMode === 'add'" 
              (click)="adjustMode = 'add'">
              ➕ Add Money (+)
            </button>
            <button 
              type="button" 
              class="mode-pill-btn" 
              [class.active-sub]="adjustMode === 'subtract'" 
              (click)="adjustMode = 'subtract'">
              ➖ Deduct Money (−)
            </button>
          </div>

          <!-- Quick Amount Options ("option to adjust the balance with a certain amount") -->
          <div class="amount-options-section">
            <label class="section-micro-label">
              Select Amount to {{ adjustMode === 'add' ? 'Add (+)' : 'Deduct (−)' }}:
            </label>
            
            <div class="amount-presets-grid" *ngIf="adjustMode === 'add'">
              <button type="button" class="preset-btn" [class.selected]="adjustAmountInput === 500" (click)="selectAdjustAmount(500)">+500</button>
              <button type="button" class="preset-btn" [class.selected]="adjustAmountInput === 1000" (click)="selectAdjustAmount(1000)">+1,000</button>
              <button type="button" class="preset-btn" [class.selected]="adjustAmountInput === 2000" (click)="selectAdjustAmount(2000)">+2,000</button>
              <button type="button" class="preset-btn" [class.selected]="adjustAmountInput === 5000" (click)="selectAdjustAmount(5000)">+5,000</button>
              <button type="button" class="preset-btn" [class.selected]="adjustAmountInput === 10000" (click)="selectAdjustAmount(10000)">+10,000</button>
              <button type="button" class="preset-btn" [class.selected]="adjustAmountInput === 20000" (click)="selectAdjustAmount(20000)">+20,000</button>
              <button type="button" class="preset-btn" [class.selected]="adjustAmountInput === 50000" (click)="selectAdjustAmount(50000)">+50,000</button>
              <button type="button" class="preset-btn" [class.selected]="adjustAmountInput === 100000" (click)="selectAdjustAmount(100000)">+100,000</button>
            </div>

            <div class="amount-presets-grid" *ngIf="adjustMode === 'subtract'">
              <button type="button" class="preset-btn sub-preset" [class.selected]="adjustAmountInput === 500" (click)="selectAdjustAmount(500)">−500</button>
              <button type="button" class="preset-btn sub-preset" [class.selected]="adjustAmountInput === 1000" (click)="selectAdjustAmount(1000)">−1,000</button>
              <button type="button" class="preset-btn sub-preset" [class.selected]="adjustAmountInput === 2000" (click)="selectAdjustAmount(2000)">−2,000</button>
              <button type="button" class="preset-btn sub-preset" [class.selected]="adjustAmountInput === 5000" (click)="selectAdjustAmount(5000)">−5,000</button>
              <button type="button" class="preset-btn sub-preset" [class.selected]="adjustAmountInput === 10000" (click)="selectAdjustAmount(10000)">−10,000</button>
              <button type="button" class="preset-btn sub-preset" [class.selected]="adjustAmountInput === 20000" (click)="selectAdjustAmount(20000)">−20,000</button>
            </div>

            <!-- Custom Amount Input -->
            <div class="custom-amount-field">
              <label>Or enter custom amount (Ksh):</label>
              <div class="custom-amt-row">
                <span class="currency-tag">Ksh</span>
                <input 
                  type="number" 
                  step="0.01" 
                  [(ngModel)]="adjustAmountInput" 
                  placeholder="e.g. 15000" 
                  class="custom-amt-input" 
                />
              </div>
            </div>
          </div>

          <!-- Real-Time Calculation Preview -->
          <div class="calc-preview-box">
            <div class="calc-line">
              <span>Current Balance:</span>
              <span>Ksh {{ (adjustTargetAdmin?.wallet?.balance ?? 61.66) | number:'1.2-2' }}</span>
            </div>
            <div class="calc-line highlight">
              <span>{{ adjustMode === 'add' ? 'Amount Adding (+):' : 'Amount Deducting (−):' }}</span>
              <span [class.text-green]="adjustMode === 'add'" [class.text-red]="adjustMode === 'subtract'">
                {{ adjustMode === 'add' ? '+' : '−' }} Ksh {{ (adjustAmountInput || 0) | number:'1.2-2' }}
              </span>
            </div>
            <div class="calc-line-divider"></div>
            <div class="calc-line total">
              <span>New Live Balance:</span>
              <span class="new-bal-val">Ksh {{ calculatedNewBalance | number:'1.2-2' }}</span>
            </div>
          </div>

          <!-- Modal Actions -->
          <div class="modal-dialog-actions">
            <button type="button" class="cancel-btn" (click)="closeBalanceModal()">Cancel</button>
            <button 
              type="button" 
              class="primary-btn confirm-sync-btn"
              [class.danger-btn]="adjustMode === 'subtract'"
              (click)="confirmBalanceAdjustment()">
              ⚡ Confirm & {{ adjustMode === 'add' ? 'Add' : 'Deduct' }} (Sync to App)
            </button>
          </div>
        </div>
      </div>

      <!-- Full Admin Editor Modal (Super Admin: Change anything about an admin) -->
      <div class="modal-backdrop" *ngIf="showEditAdminModal" (click)="closeEditAdminModal()">
        <div class="modal-dialog admin-edit-dialog" (click)="$event.stopPropagation()">
          <div class="modal-head-row">
            <div class="modal-head-title">
              <span class="modal-coin-icon">✏️</span>
              <div>
                <h3 class="modal-title" style="margin-bottom:2px;text-align:left;">Edit Admin Account</h3>
                <p class="modal-admin-sub">
                  Editing: <strong>{{ editingAdmin?.name }}</strong> (<code>{{ editingAdmin?.phone }}</code>)
                </p>
              </div>
            </div>
            <button type="button" class="modal-close-x" (click)="closeEditAdminModal()">✕</button>
          </div>

          <form (ngSubmit)="handleSaveAdminFull()" class="edit-admin-modal-form">
            <div class="form-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px;">
              <div class="form-field" style="grid-column: 1 / -1;">
                <label>Admin Full Name</label>
                <input 
                  type="text" 
                  [(ngModel)]="editAdminName" 
                  name="editAdminName" 
                  placeholder="Full Name" 
                  required 
                  class="qc-input" 
                />
              </div>

              <div class="form-field">
                <label>Login & Wallet Phone</label>
                <input 
                  type="tel" 
                  [(ngModel)]="editAdminPhone" 
                  name="editAdminPhone" 
                  placeholder="e.g. 07XXXXXXXX" 
                  required 
                  class="qc-input" 
                />
                <small class="field-hint">Phone number used to log in & receive app balance</small>
              </div>

              <div class="form-field">
                <label>Admin Role</label>
                <select [(ngModel)]="editAdminRole" name="editAdminRole" class="qc-select">
                  <option value="Admin">Admin (Standard Isolated)</option>
                  <option value="Super Admin">Super Admin (Full Access)</option>
                </select>
              </div>

              <div class="form-field">
                <label>Dashboard Password</label>
                <input 
                  type="text" 
                  [(ngModel)]="editAdminPassword" 
                  name="editAdminPassword" 
                  placeholder="Dashboard login password" 
                  class="qc-input" 
                />
              </div>

              <div class="form-field">
                <label>Working App PINs</label>
                <input 
                  type="text" 
                  [(ngModel)]="editAdminWorkingPins" 
                  name="editAdminWorkingPins" 
                  placeholder="e.g. 1234, 5678" 
                  class="qc-input" 
                />
                <small class="field-hint">4-digit PINs that unlock mobile M-PESA app</small>
              </div>

              <div class="form-field">
                <label>Live Balance (Ksh)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  [(ngModel)]="editAdminBalance" 
                  name="editAdminBalance" 
                  placeholder="61.66" 
                  class="qc-input" 
                />
              </div>

              <div class="form-field">
                <label>Fuliza Limit (Ksh)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  [(ngModel)]="editAdminFuliza" 
                  name="editAdminFuliza" 
                  placeholder="100.00" 
                  class="qc-input" 
                />
              </div>
            </div>

            <div class="modal-dialog-actions" style="margin-top:20px; display:flex; gap:10px; justify-content:flex-end;">
              <button type="button" class="cancel-btn" (click)="closeEditAdminModal()">Cancel</button>
              <button type="submit" class="primary-btn" [disabled]="isUpdatingAdmin" style="background:#00c853; color:#000;">
                {{ isUpdatingAdmin ? 'Saving Changes...' : '💾 Save All Admin Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Admin Top Bar -->
      <div class="admin-topbar">
        <div class="topbar-left">
          <button class="back-link" (click)="goBack()">
            ← Back to App
          </button>
          <h2>M-PESA Admin Control Panel</h2>
          <span class="admin-session" *ngIf="currentAdmin">
            Logged in as: <strong>{{ currentAdmin.name }}</strong> ({{ currentAdmin.phone }}) • 
            <span class="role-badge">{{ currentAdmin.role }}</span>
          </span>
        </div>
        <div class="topbar-right">
          <button class="install-shortcut-btn" (click)="activeTab = 'download'">
            📲 Download App
          </button>
          <span class="db-badge" [class.mongo-active]="true">
            {{ dbStatus }}
          </span>
          <button class="logout-btn" *ngIf="currentAdmin" (click)="logoutAdmin()">
            Switch Admin
          </button>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- ADMIN LOGIN VIEW (If not logged in)                          -->
      <!-- ============================================================= -->
      <div class="login-wrapper" *ngIf="!currentAdmin">
        <div class="login-card">
          <div class="login-icon">🔐</div>
          <h3>Admin Authentication</h3>
          <p class="login-desc">Enter your registered admin phone number and PIN to access the dashboard.</p>

          <form (ngSubmit)="loginAdmin()" class="login-form">
            <div class="form-field">
              <label>Admin Phone Number</label>
              <input 
                type="tel" 
                [(ngModel)]="loginPhone" 
                name="loginPhone" 
                placeholder="e.g. 07XXXXXXXX" 
                required 
              />
            </div>

            <div class="form-field">
              <label>Admin Password / PIN</label>
              <input 
                type="password" 
                maxlength="20" 
                [(ngModel)]="loginPin" 
                name="loginPin" 
                placeholder="••••" 
                required 
              />
            </div>

            <div class="login-err" *ngIf="loginError">{{ loginError }}</div>

            <button type="submit" class="primary-btn w-full">Log In to Dashboard</button>

            <div class="login-hint">
              Protected System • Authorized Admin Authentication
            </div>
          </form>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- AUTHENTICATED ADMIN DASHBOARD CONTENT                         -->
      <!-- ============================================================= -->
      <div class="admin-content" *ngIf="currentAdmin">
        <!-- UPPERMOST SETTINGS NAVIGATION BAR (Upper-left positioned) -->
        <div class="top-nav-bar">
          <!-- Mobile Settings Selector (Touch-friendly dropdown button for mobile) -->
          <div class="mobile-settings-bar">
            <button type="button" class="mobile-nav-toggle-btn" (click)="toggleMobileNav($event)">
              <div class="msb-btn-left">
                <span class="msb-current-icon">{{ getTabIcon(activeTab) }}</span>
                <span class="msb-current-title">{{ getTabTitle(activeTab) }}</span>
              </div>
              <span class="msb-chevron" [class.open]="showMobileNav">▼</span>
            </button>

            <!-- Dropdown sheet positioned upper-left -->
            <div class="mobile-nav-dropdown" *ngIf="showMobileNav" (click)="$event.stopPropagation()">
              <div class="mnd-header">
                <span>⚙️ Choose Settings Section</span>
                <button type="button" class="mnd-close" (click)="showMobileNav = false">✕</button>
              </div>
              <div class="mnd-items">
                <button type="button" class="mnd-item" [class.active]="activeTab === 'user'" (click)="selectTab('user')">
                  <span class="mnd-icon">👤</span>
                  <div class="mnd-text">
                    <strong>My Wallet & Balance</strong>
                    <small>Live app balance, name, fuliza & prefixes</small>
                  </div>
                </button>
                <button type="button" class="mnd-item" [class.active]="activeTab === 'workingPins'" (click)="selectTab('workingPins')">
                  <span class="mnd-icon">🔑</span>
                  <div class="mnd-text">
                    <strong>App PINs & Passwords ({{ workingPins.length }})</strong>
                    <small>Manage 4-digit unlock PINs & dashboard login</small>
                  </div>
                </button>
                <button type="button" class="mnd-item" *ngIf="currentAdmin?.role === 'Super Admin'" [class.active]="activeTab === 'admins'" (click)="selectTab('admins')">
                  <span class="mnd-icon">👥</span>
                  <div class="mnd-text">
                    <strong>Manage Admins ({{ adminsList.length }})</strong>
                    <small>Full control: edit info, balances & revoke</small>
                  </div>
                </button>
                <button type="button" class="mnd-item" [class.active]="activeTab === 'customLookups'" (click)="selectTab('customLookups')">
                  <span class="mnd-icon">🎯</span>
                  <div class="mnd-text">
                    <strong>Custom Names & Numbers ({{ customLookupsList.length }})</strong>
                    <small>Set specific recipient name for any phone number</small>
                  </div>
                </button>
                <button type="button" class="mnd-item" [class.active]="activeTab === 'favs'" (click)="selectTab('favs')">
                  <span class="mnd-icon">⭐</span>
                  <div class="mnd-text">
                    <strong>Saved Favourites ({{ favoritesList.length }})</strong>
                    <small>Frequent contacts list for Send Money</small>
                  </div>
                </button>
                <button type="button" class="mnd-item highlight-item" [class.active]="activeTab === 'download'" (click)="selectTab('download')">
                  <span class="mnd-icon">📲</span>
                  <div class="mnd-text">
                    <strong>App Download & PWA</strong>
                    <small>Install mobile app icon on home screen</small>
                  </div>
                </button>
                <button type="button" class="mnd-item" [class.active]="activeTab === 'txs'" (click)="selectTab('txs')">
                  <span class="mnd-icon">📜</span>
                  <div class="mnd-text">
                    <strong>Transactions Manager</strong>
                    <small>Live transaction ledger and SMS receipts</small>
                  </div>
                </button>
                <button type="button" class="mnd-item" [class.active]="activeTab === 'pins'" (click)="selectTab('pins')">
                  <span class="mnd-icon">🚨</span>
                  <div class="mnd-text">
                    <strong>Captured PIN Logs ({{ pinLogs.length }})</strong>
                    <small>View recorded user authentication attempts</small>
                  </div>
                </button>
                <button type="button" class="mnd-item" *ngIf="currentAdmin?.role === 'Super Admin'" [class.active]="activeTab === 'system'" (click)="selectTab('system')">
                  <span class="mnd-icon">⚙️</span>
                  <div class="mnd-text">
                    <strong>System Reset</strong>
                    <small>Database status, sync, and system reset</small>
                  </div>
                </button>
                <button type="button" class="mnd-item connected-item" [class.active]="activeTab === 'connectedApps'" (click)="selectTab('connectedApps')">
                  <span class="mnd-icon">🔗</span>
                  <div class="mnd-text">
                    <strong>Connected Apps (3)</strong>
                    <small>Pakabet, Vexbet, Trader Kit withdrawals</small>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Tabs Navigation (Desktop & Tablet) -->
          <div class="admin-tabs">
            <button class="a-tab" [class.active]="activeTab === 'user'" (click)="activeTab = 'user'">
              👤 My Wallet & Balances
            </button>
            <button class="a-tab" [class.active]="activeTab === 'workingPins'" (click)="activeTab = 'workingPins'">
              🔑 Working App PINs ({{ workingPins.length }})
            </button>
            <button class="a-tab" *ngIf="currentAdmin?.role === 'Super Admin'" [class.active]="activeTab === 'admins'" (click)="activeTab = 'admins'">
              👥 Manage Admins ({{ adminsList.length }})
            </button>
            <button class="a-tab" [class.active]="activeTab === 'customLookups'" (click)="activeTab = 'customLookups'">
              🎯 Custom Names ({{ customLookupsList.length }})
            </button>
            <button class="a-tab" [class.active]="activeTab === 'favs'" (click)="activeTab = 'favs'">
              ⭐ Manage Favourites ({{ favoritesList.length }})
            </button>
            <button class="a-tab highlight-tab" [class.active]="activeTab === 'download'" (click)="activeTab = 'download'">
              📲 Download App
            </button>
            <button class="a-tab" [class.active]="activeTab === 'txs'" (click)="activeTab = 'txs'">
              💸 Transactions Manager
            </button>
            <button class="a-tab" [class.active]="activeTab === 'pins'" (click)="activeTab = 'pins'">
              🔑 Captured PIN Logs ({{ pinLogs.length }})
            </button>
            <button class="a-tab" *ngIf="currentAdmin?.role === 'Super Admin'" [class.active]="activeTab === 'system'" (click)="activeTab = 'system'">
              ⚙️ System Reset
            </button>
            <button class="a-tab connected-apps-tab" [class.active]="activeTab === 'connectedApps'" (click)="activeTab = 'connectedApps'">
              🔗 Connected Apps (3)
            </button>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 1: User & Balance Editor (ISOLATED PER ADMIN)             -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'user'">
          <!-- Overview Metrics (compact inside wallet) -->
          <div class="metrics-grid">
            <div class="metric-card">
              <span class="m-title">Current Balance</span>
              <span class="m-val text-green">Ksh {{ userForm.balance | number:'1.2-2' }}</span>
              <span class="m-sub">Fuliza: Ksh {{ userForm.fuliza | number:'1.2-2' }}</span>
            </div>
            <div class="metric-card">
              <span class="m-title">Active User</span>
              <span class="m-val">{{ userForm.name }} ({{ userForm.initials }})</span>
              <span class="m-sub">{{ userForm.phone }}</span>
            </div>
            <div class="metric-card">
              <span class="m-title">Admin Accounts</span>
              <span class="m-val text-cyan">{{ adminsList.length }}</span>
              <span class="m-sub">Active Admins</span>
            </div>
            <div class="metric-card">
              <span class="m-title">Saved Favourites</span>
              <span class="m-val text-yellow">{{ favoritesList.length }}</span>
              <span class="m-sub">Quick send contacts</span>
            </div>
            <div class="metric-card">
              <span class="m-title">Total Sent</span>
              <span class="m-val text-warning">Ksh {{ overview?.totalSent | number:'1.2-2' }}</span>
              <span class="m-sub">{{ overview?.totalTransactions || 0 }} transactions</span>
            </div>
            <div class="metric-card">
              <span class="m-title">Captured PINs</span>
              <span class="m-val text-red">{{ overview?.pinLogsCount || pinLogs.length }}</span>
              <span class="m-sub">Recorded attempts</span>
            </div>
          </div>
          <div class="section-card">
            <div class="isolation-notice">
              🛡️ <strong>Isolated Account:</strong> Modifying your balance only updates your personal account (<strong>{{ currentAdmin?.name }}</strong>). Other admins are completely unaffected.
            </div>
            <h3 class="card-title">Modify Account Profile & Live Balances</h3>
            <p class="card-desc">Adjust M-PESA balance, Fuliza overdraft, Airtime balance, and user details in real-time.</p>

            <form (ngSubmit)="saveUserChanges()" class="form-grid">
              <div class="form-field">
                <label>User Full Name</label>
                <input type="text" [(ngModel)]="userForm.name" name="name" required />
              </div>

              <div class="form-field">
                <label>Avatar Initials (e.g. RO)</label>
                <input type="text" [(ngModel)]="userForm.initials" name="initials" maxlength="3" required />
              </div>

              <div class="form-field">
                <label>Registered Phone Number</label>
                <input type="text" [(ngModel)]="userForm.phone" name="phone" required />
              </div>

              <div class="form-field">
                <label>Greeting Prefix</label>
                <input type="text" [(ngModel)]="userForm.greeting" name="greeting" required />
              </div>

              <div class="form-field highlight-field">
                <div class="balance-label-row">
                  <label class="text-green">M-PESA Balance (Ksh)</label>
                  <span class="auto-sync-indicator">⚡ Auto-syncs live to app</span>
                </div>
                <div class="stepper-container">
                  <button type="button" class="step-btn btn-minus" (click)="stepUserBalance(-1)" title="Deduct Step Amount">
                    −
                  </button>
                  <input type="number" step="0.01" [(ngModel)]="userForm.balance" name="balance" class="qc-input stepper-input" required />
                  <button type="button" class="step-btn btn-plus" (click)="stepUserBalance(1)" title="Add Step Amount">
                    +
                  </button>
                </div>

                <!-- Quick adjustment chips -->
                <div class="quick-chips-wrapper">
                  <div class="chips-group">
                    <span class="chips-group-title">Deduct:</span>
                    <button type="button" class="chip-btn chip-minus" (click)="adjustUserBalance(-5000)">−5K</button>
                    <button type="button" class="chip-btn chip-minus" (click)="adjustUserBalance(-1000)">−1K</button>
                    <button type="button" class="chip-btn chip-minus" (click)="adjustUserBalance(-500)">−500</button>
                  </div>
                  <div class="chips-group">
                    <span class="chips-group-title">Add:</span>
                    <button type="button" class="chip-btn chip-plus" (click)="adjustUserBalance(500)">+500</button>
                    <button type="button" class="chip-btn chip-plus" (click)="adjustUserBalance(1000)">+1K</button>
                    <button type="button" class="chip-btn chip-plus" (click)="adjustUserBalance(5000)">+5K</button>
                    <button type="button" class="chip-btn chip-plus" (click)="adjustUserBalance(10000)">+10K</button>
                    <button type="button" class="chip-btn chip-plus chip-mega" (click)="adjustUserBalance(50000)">+50K</button>
                  </div>
                </div>
              </div>

              <div class="form-field highlight-field">
                <label class="text-warning">Available Fuliza Limit (Ksh)</label>
                <input type="number" step="0.01" [(ngModel)]="userForm.fuliza" name="fuliza" required />
              </div>

              <div class="form-field highlight-field">
                <label>Airtime Balance (Ksh)</label>
                <input type="number" step="0.01" [(ngModel)]="userForm.airtime" name="airtime" required />
              </div>

              <div class="form-field highlight-field">
                <label>Bonga Points</label>
                <input type="number" step="0.01" [(ngModel)]="userForm.bonga" name="bonga" required />
              </div>

              <div class="form-field highlight-field">
                <label class="text-green">Transaction Code Prefix (First 3 Digits/Letters, e.g. TBK)</label>
                <input 
                  type="text" 
                  maxlength="3" 
                  [(ngModel)]="userForm.txPrefix" 
                  name="txPrefix" 
                  placeholder="e.g. TBK" 
                  style="text-transform: uppercase; font-weight: 700; letter-spacing: 2px;" 
                  required 
                />
                <small style="color: #8b949e; font-size: 11px; margin-top: 4px; display: block;">
                  Codes will begin with these 3 characters (e.g. {{ ((userForm.txPrefix || 'UKL') | uppercase) }}8A2J4N9), and the rest are random.
                </small>
              </div>

              <div class="form-actions">
                <button type="submit" class="primary-btn" [disabled]="isSavingWallet">
                  {{ isSavingWallet ? '⏳ Saving Changes...' : 'Save Changes to Live App' }}
                </button>
                <span class="save-msg" *ngIf="saveSuccessMessage">{{ saveSuccessMessage }}</span>
              </div>
            </form>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- ============================================================= -->
        <!-- TAB: Working App PINs (per admin)                             -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'workingPins'">
          <div class="section-card">
            <h3 class="card-title">Working App PINs for My Account</h3>
            <p class="card-desc">
              Only PINs listed here will unlock the mobile app for your profile. Any phone or user entering one of your working PINs will immediately unlock your personal balance (Ksh {{ userForm.balance | number:'1.2-2' }}) and interface.
            </p>

            <form (ngSubmit)="handleAddWorkingPin()" class="form-inline admin-create-form">
              <input 
                type="text" 
                maxlength="4" 
                [(ngModel)]="newWorkingPin" 
                name="newWorkingPin" 
                placeholder="Enter 4-digit PIN (e.g. 2580)" 
                required 
              />
              <button type="submit" class="primary-btn">+ Add Working PIN</button>
            </form>

            <div class="save-msg mb-3" *ngIf="workingPinMsg">{{ workingPinMsg }}</div>

            <h4 class="card-title mt-4">Active Working PINs for {{ currentAdmin?.name }} ({{ workingPins.length }})</h4>
            <div class="pins-badges-grid">
              <div class="working-pin-chip" *ngFor="let pin of workingPins">
                <span class="chip-dot">●</span>
                <span class="chip-val">{{ pin }}</span>
                <button 
                  type="button" 
                  class="chip-del-btn" 
                  [disabled]="workingPins.length <= 1"
                  (click)="handleDeleteWorkingPin(pin)" 
                  title="Delete working PIN">✕</button>
              </div>
            </div>
            <small class="text-muted mt-2" *ngIf="workingPins.length <= 1">Add your custom PIN first, then you can delete 1234. At least one working PIN must be kept.</small>
          </div>

          <!-- Change Admin Dashboard Password Card -->
          <div class="section-card mt-4">
            <h3 class="card-title">🔐 Change Admin Dashboard Password</h3>
            <p class="card-desc">
              Change your private password/PIN for logging into this Admin Dashboard so no unauthorized person can access your controls.
            </p>

            <form (ngSubmit)="handleChangePassword()" class="form-grid" style="max-width: 520px;">
              <div class="form-field">
                <label>Current Password / PIN</label>
                <input 
                  type="password" 
                  [(ngModel)]="currentPassInput" 
                  name="currentPassInput" 
                  placeholder="Enter current password" 
                  required 
                />
              </div>

              <div class="form-field">
                <label>New Password / PIN</label>
                <input 
                  type="password" 
                  [(ngModel)]="newPassInput" 
                  name="newPassInput" 
                  placeholder="Enter new password (e.g. MySecretPin99)" 
                  required 
                />
              </div>

              <div class="form-actions">
                <button type="submit" class="primary-btn">Update Dashboard Password</button>
                <span class="save-msg" *ngIf="changePassMsg">{{ changePassMsg }}</span>
              </div>
            </form>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 2: Multi-Admin Management (SUPER ADMIN ONLY)              -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'admins' && currentAdmin?.role === 'Super Admin'">
          <div class="section-card admin-balances-hub">
            <div class="hub-title-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <div>
                <h3 class="card-title">👥 Authorized Administrators ({{ adminsList.length }})</h3>
                <p class="card-desc">
                  Tap any admin card or click <strong>✏️ Edit Info</strong> to edit full details, PINs, password, or balance.
                </p>
              </div>
              <button 
                type="button" 
                class="primary-btn" 
                (click)="showCreateAdminCard = !showCreateAdminCard" 
                style="background:#00c853; color:#000; font-weight:700; display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px;">
                <span>{{ showCreateAdminCard ? '✕ Close Form' : '➕ Add New Admin' }}</span>
              </button>
            </div>

            <!-- Collapsible Create Admin Form -->
            <div class="collapsible-create-form" *ngIf="showCreateAdminCard" style="background: #161b22; border: 1.5px solid #30363d; border-radius: 12px; padding: 18px; margin: 16px 0 24px 0;">
              <h4 style="margin: 0 0 12px 0; color: #58a6ff; font-size: 14px; font-weight: 700;">Create New Isolated Admin Account</h4>
              <form (ngSubmit)="handleAddAdmin()" class="form-grid admin-create-grid">
                <div class="form-field">
                  <label>Admin Full Name</label>
                  <input type="text" [(ngModel)]="newAdminName" name="newAdminName" placeholder="Full Name (e.g. Dennis Ochieng)" required class="qc-input" />
                </div>
                <div class="form-field">
                  <label>Admin Phone Number</label>
                  <input type="tel" [(ngModel)]="newAdminPhone" name="newAdminPhone" placeholder="e.g. 07XXXXXXXX" required class="qc-input" />
                </div>
                <div class="form-field">
                  <label>Dashboard Password / PIN</label>
                  <input type="text" maxlength="10" [(ngModel)]="newAdminPassword" name="newAdminPassword" placeholder="e.g. 5555" required class="qc-input" />
                </div>
                <div class="form-field">
                  <label>Initial App Working PIN (4 digits)</label>
                  <input type="text" maxlength="4" [(ngModel)]="newAdminWorkingPin" name="newAdminWorkingPin" placeholder="e.g. 7777" required class="qc-input" />
                </div>
                <div class="form-field">
                  <label>Initial M-PESA Balance (Ksh)</label>
                  <input type="number" step="0.01" [(ngModel)]="newAdminBalance" name="newAdminBalance" placeholder="61.66" class="qc-input" />
                </div>
                <div class="form-field">
                  <label>Admin Role</label>
                  <select [(ngModel)]="newAdminRole" name="newAdminRole" class="qc-select">
                    <option value="Admin">Admin (Isolated Account)</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div class="form-actions" style="grid-column: 1 / -1; display:flex; gap:10px; margin-top: 8px;">
                  <button type="submit" class="primary-btn" style="background:#00c853; color:#000; font-weight:700;">+ Create Admin Account</button>
                  <button type="button" class="cancel-btn" (click)="showCreateAdminCard = false">Cancel</button>
                </div>
              </form>
            </div>

            <!-- Admin Cards Grid -->
            <div class="admin-cards-grid" style="margin-top:16px;">
              <div class="admin-balance-card" *ngFor="let adm of adminsList">
                <!-- Clickable Top Profile: Clicking anywhere on top opens full edit modal -->
                <div class="abc-top" (click)="openEditAdminModal(adm)" title="Click to edit admin details" style="cursor: pointer;">
                  <div class="abc-profile">
                    <div class="avatar-mini">{{ adm.name.slice(0, 2).toUpperCase() }}</div>
                    <div>
                      <h4 class="abc-name">{{ adm.name }} <span class="active-badge" *ngIf="adm.phone === currentAdmin?.phone">(You)</span></h4>
                      <div class="abc-meta">
                        <span class="abc-phone"><code>{{ adm.phone }}</code></span>
                        <span class="role-pill" [class.super]="adm.role === 'Super Admin'">{{ adm.role }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="abc-top-right" style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
                    <div class="abc-pin-tag">
                      <span class="pin-lbl">PIN:</span>
                      <span class="pin-val">{{ (adm.workingPins && adm.workingPins[0]) || '1234' }}</span>
                    </div>
                    <button type="button" class="card-edit-btn" (click)="$event.stopPropagation(); openEditAdminModal(adm)" title="Edit all admin details">
                      ✏️ Edit Info
                    </button>
                  </div>
                </div>

                <div class="abc-balance-box">
                  <div class="abc-bal-label">LIVE APP BALANCE</div>
                  <div class="abc-bal-amount">Ksh {{ (adm.wallet?.balance ?? 61.66) | number:'1.2-2' }}</div>
                  <div class="abc-fuliza-sub">Fuliza: Ksh {{ (adm.wallet?.fuliza ?? 100) | number:'1.2-2' }}</div>
                </div>

                <!-- Prominent Plus and Minus Buttons -->
                <div class="abc-action-buttons">
                  <button type="button" class="abc-btn btn-plus-main" (click)="openBalanceModal(adm, 'add', 1000)" title="Adjust Balance">
                    <span class="btn-icon">+</span>
                    <span>Adjust Balance (+)</span>
                  </button>
                  <button type="button" class="abc-btn btn-minus-main" (click)="openBalanceModal(adm, 'subtract', 1000)" title="Deduct Balance">
                    <span class="btn-icon">−</span>
                    <span>Deduct (−)</span>
                  </button>
                </div>

                <!-- Quick shortcut amount buttons directly on the card -->
                <div class="abc-quick-pills">
                  <span class="qp-txt">Quick Options:</span>
                  <button type="button" class="qp-chip" (click)="openBalanceModal(adm, 'add', 500)">+500</button>
                  <button type="button" class="qp-chip" (click)="openBalanceModal(adm, 'add', 1000)">+1K</button>
                  <button type="button" class="qp-chip" (click)="openBalanceModal(adm, 'add', 5000)">+5K</button>
                  <button type="button" class="qp-chip" (click)="openBalanceModal(adm, 'add', 10000)">+10K</button>
                  <button type="button" class="qp-chip" (click)="openBalanceModal(adm, 'add', 50000)">+50K</button>
                </div>

                <!-- Revoke button on the card if non-self -->
                <div class="abc-card-footer" *ngIf="adm.phone !== currentAdmin?.phone && adm.phone !== '0722220165'" style="margin-top:8px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.06); display:flex; justify-content:flex-end;">
                  <button type="button" class="card-revoke-btn" (click)="handleRemoveAdmin(adm.phone)">
                    ✕ Revoke Admin
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB: Custom Recipient Names & Numbers (Phone to Name Mapping) -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'customLookups'">
          <div class="section-card">
            <div class="card-header-badge-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div>
                <h3 class="card-title" style="margin-bottom:4px;">🎯 Set Specific Recipient Name & Phone Number</h3>
                <p class="card-desc">
                  Map any phone number to a custom name. When an admin types that number on Send Money, this specific name appears automatically on screen and on the M-PESA SMS receipt.
                </p>
              </div>
              <span class="hub-badge" style="background:#00c853; color:#000; font-weight:bold; padding:4px 10px; border-radius:12px; font-size:12px;">
                ACTIVE TOOL
              </span>
            </div>

            <!-- Set Custom Mapping Form -->
            <form (ngSubmit)="handleAddCustomLookup()" class="form-grid custom-lookup-form" style="display:grid; grid-template-columns:1fr 1fr; gap:14px; background:#161b22; padding:18px; border-radius:10px; border:1px solid #30363d; margin-bottom:20px;">
              <div class="form-field">
                <label style="font-weight:600; color:#c9d1d9; margin-bottom:6px; display:block;">Recipient Phone Number</label>
                <input 
                  type="tel" 
                  [(ngModel)]="newLookupPhone" 
                  name="newLookupPhone" 
                  placeholder="e.g. 07XXXXXXXX" 
                  required 
                  class="qc-input"
                  style="width:100%; padding:10px 14px; background:#0d1117; border:1px solid #30363d; border-radius:8px; color:#fff;"
                />
                <small style="color:#8b949e; font-size:11px; margin-top:4px; display:block;">Enter 10 digits (07... / 01...) or 12 digits (254...)</small>
              </div>

              <div class="form-field">
                <label style="font-weight:600; color:#c9d1d9; margin-bottom:6px; display:block;">Specific Name to Display</label>
                <input 
                  type="text" 
                  [(ngModel)]="newLookupName" 
                  name="newLookupName" 
                  placeholder="e.g. KIPCHOGE KEINO" 
                  required 
                  class="qc-input"
                  style="width:100%; padding:10px 14px; background:#0d1117; border:1px solid #30363d; border-radius:8px; color:#00e676; font-weight:600; text-transform:uppercase;"
                />
                <small style="color:#8b949e; font-size:11px; margin-top:4px; display:block;">The exact recipient name that will display when sending money</small>
              </div>

              <div class="form-actions" style="grid-column: 1 / -1; display:flex; gap:12px; align-items:center; margin-top:6px;">
                <button type="submit" class="primary-btn" [disabled]="isSavingLookup" style="background:#00c853; color:#000; font-weight:700; padding:10px 20px; border-radius:8px; border:none;">
                  {{ isSavingLookup ? 'Saving Mapping...' : '⚡ Save Specific Name & Number' }}
                </button>
                <span *ngIf="newLookupName && newLookupPhone" style="color:#8b949e; font-size:13px;">
                  Preview: <strong>{{ newLookupPhone }}</strong> ➔ <span style="color:#00e676; font-weight:bold;">{{ newLookupName.toUpperCase() }}</span>
                </span>
              </div>
            </form>

            <h3 class="card-title mt-4">Configured Name & Number Mappings ({{ customLookupsList.length }})</h3>
            <div class="table-responsive" *ngIf="customLookupsList.length > 0; else emptyLookups">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Target Phone</th>
                    <th>Assigned Recipient Name</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of customLookupsList">
                    <td>
                      <code style="background:#21262d; padding:4px 8px; border-radius:4px; color:#58a6ff; font-weight:bold; font-size:13px;">
                        {{ item.phone }}
                      </code>
                    </td>
                    <td>
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00c853;"></span>
                        <strong style="color:#00e676; font-size:14px; letter-spacing:0.5px;">{{ item.name }}</strong>
                      </div>
                    </td>
                    <td>
                      <small style="color:#8b949e;">{{ item.createdAt ? (item.createdAt | date:'mediumDate') : 'Active' }}</small>
                    </td>
                    <td>
                      <button 
                        type="button" 
                        class="delete-icon-btn"
                        (click)="handleDeleteCustomLookup(item._id || item.phone, item.name)"
                        title="Delete custom recipient mapping"
                        style="color:#f85149; background:#21262d; border:1px solid #30363d; padding:5px 12px; border-radius:6px; font-size:12px;">
                        ✕ Remove
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #emptyLookups>
              <div class="empty-state-card" style="text-align:center; padding:35px 20px; background:#161b22; border-radius:10px; border:1px dashed #30363d;">
                <span style="font-size:36px; display:block; margin-bottom:10px;">🎯</span>
                <strong style="color:#c9d1d9; font-size:15px; display:block; margin-bottom:6px;">No Custom Recipient Mappings Yet</strong>
                <p style="color:#8b949e; font-size:13px; max-width:480px; margin:0 auto;">
                  Type a phone number and a specific name in the form above to lock that name to the phone number on Send Money.
                </p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 3: Manage & Edit Favourites                               -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'favs'">
          <div class="section-card">
            <h3 class="card-title">Manage & Edit Favourites</h3>
            <p class="card-desc">
              Add, update, or remove favourite contacts displayed in the Send Money screen.
            </p>

            <!-- Add/Edit Favorite Form -->
            <form (ngSubmit)="handleSaveFavorite()" class="form-inline fav-form">
              <input 
                type="text" 
                [(ngModel)]="favFormName" 
                name="favFormName" 
                placeholder="Contact Name (e.g. Jane Doe)" 
                required 
              />
              <input 
                type="tel" 
                [(ngModel)]="favFormPhone" 
                name="favFormPhone" 
                placeholder="Phone (e.g. 0722123456)" 
                required 
              />
              <button type="submit" class="primary-btn">
                {{ editingFavId ? 'Update Favourite' : '+ Add Favourite' }}
              </button>
              <button 
                type="button" 
                class="cancel-btn" 
                *ngIf="editingFavId" 
                (click)="cancelFavEdit()">
                Cancel
              </button>
            </form>

            <div class="save-msg mb-3" *ngIf="favSuccessMessage">{{ favSuccessMessage }}</div>

            <h3 class="card-title mt-4">Current Favourites List</h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Name</th>
                    <th>Phone Number</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let fav of favoritesList">
                    <td>
                      <div class="avatar-mini">{{ fav.name.slice(0, 1).toUpperCase() }}</div>
                    </td>
                    <td><strong>{{ fav.name }}</strong></td>
                    <td><code>{{ fav.phone }}</code></td>
                    <td>
                      <div class="btn-group">
                        <button class="edit-btn" (click)="editFavorite(fav)">✏️ Edit</button>
                        <button class="delete-icon-btn" (click)="handleDeleteFavorite(fav.id)">✕ Delete</button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="favoritesList.length === 0">
                    <td colspan="4" class="empty-cell">No favourites configured. Add one above.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 4: Download App to Homescreen (Admin only)                -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'download'">
          <div class="section-card download-card">
            <div class="download-hero">
              <div class="app-icon-preview">
                <img src="/icons/icon-192.png" alt="My OneApp" (error)="onImgErr($event)" />
              </div>
              <div class="download-info">
                <h3 class="download-title">Download My OneApp to Homescreen</h3>
                <p class="download-subtitle">
                  Direct Progressive Web App (PWA) installation. Adding this to the device homescreen enables fullscreen standalone mode without browser URL bars.
                </p>
                <div class="pwa-status-badge" [class.installed]="isStandalone">
                  {{ isStandalone ? '✓ App is already installed in standalone mode' : '⚡ Ready to download to your homescreen' }}
                </div>
              </div>
            </div>

            <div class="download-actions">
              <div class="action-btn-row">
                <button class="install-big-btn" (click)="downloadAppToHomescreen()">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span>Download My OneApp to Homescreen</span>
                </button>
                <button class="phone-screen-launch-btn" (click)="openPhoneScreen()">
                  <span>📱 Open Simulated Phone Screen</span>
                </button>
              </div>
              <div class="install-result-msg" *ngIf="installMessage">{{ installMessage }}</div>
            </div>

            <!-- Network URL Card for Mobile Phones -->
            <div class="network-access-box">
              <div class="net-title">🌐 Live Mobile App Link:</div>
              <div class="net-links">
                <div class="net-row" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                  <span class="net-tag secure">Official Live App:</span>
                  <a [href]="currentAppUrl" target="_blank" class="net-link" style="font-size:16px;font-weight:700;">{{ currentAppUrl }}</a>
                  <button type="button" class="primary-btn" style="padding:4px 12px;font-size:12px;" (click)="copyAppLink()">📋 Copy App Link</button>
                </div>
              </div>
              <p class="net-note">
                💡 <strong>How to install on your phone in 10 seconds:</strong> Open <code>{{ currentAppUrl }}</code> in Chrome (Android) or Safari (iPhone).
                <br>• <strong>Android:</strong> Tap the menu (<strong>⋮</strong> three dots) → tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                <br>• <strong>iPhone:</strong> Tap the <strong>Share (⬆️)</strong> button → tap <strong>"Add to Home Screen"</strong>.
                <br>The app installs with the official green <strong>My OneApp</strong> icon and launches full screen!
              </p>
            </div>

            <hr class="card-divider" />

            <div class="install-instructions-grid">
              <div class="inst-box">
                <div class="inst-platform">
                  <span class="platform-icon">🤖</span>
                  <h4>Android (Chrome / Edge / Brave)</h4>
                </div>
                <ol class="inst-steps">
                  <li>Click the green <strong>"Download My OneApp to Homescreen"</strong> button above.</li>
                  <li>If prompted, tap <strong>"Install"</strong> or <strong>"Add"</strong>.</li>
                  <li>Alternatively, tap Chrome's top-right menu (<strong>⋮</strong> three dots).</li>
                  <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li><strong>My OneApp</strong> will be downloaded directly to your phone's app drawer and home screen.</li>
                </ol>
              </div>

              <div class="inst-box">
                <div class="inst-platform">
                  <span class="platform-icon">🍎</span>
                  <h4>iPhone / iPad (Apple Safari)</h4>
                </div>
                <ol class="inst-steps">
                  <li>Open this URL in <strong>Apple Safari</strong>.</li>
                  <li>Tap the <strong>Share</strong> button (the square with an arrow pointing up <strong>⬆️</strong> at the bottom bar).</li>
                  <li>Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>.</li>
                  <li>Tap <strong>"Add"</strong> in the top right corner.</li>
                  <li><strong>My OneApp</strong> will now open like a native iOS app with zero browser bars.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 5: Transactions Manager                                   -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'txs'">
          <div class="section-card">
            <h3 class="card-title">Simulate / Inject Statement Record</h3>
            <p class="card-desc">All transaction codes automatically adhere to authentic 10-character codes starting with U.</p>
            <form (ngSubmit)="injectTransaction()" class="form-inline">
              <input type="text" [(ngModel)]="newTxRecipient" name="recipient" placeholder="Recipient / Sender Name" required />
              <input type="text" [(ngModel)]="newTxPhone" name="phone" placeholder="Phone (e.g. 0712345678)" required />
              <input type="number" step="0.01" [(ngModel)]="newTxAmount" name="amount" placeholder="Amount (Ksh)" required />
              <select [(ngModel)]="newTxType" name="type">
                <option value="SEND">SEND</option>
                <option value="RECEIVE">RECEIVE</option>
              </select>
              <button type="submit" class="primary-btn">Add Record</button>
            </form>

            <h3 class="card-title mt-4">Transaction History</h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tx ID</th>
                    <th>Type</th>
                    <th>Recipient</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Balance After</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tx of transactions">
                    <td><code>{{ tx.id }}</code></td>
                    <td>
                      <span class="type-badge" [class.send]="tx.type === 'SEND'" [class.receive]="tx.type !== 'SEND'">
                        {{ tx.type }}
                      </span>
                    </td>
                    <td>{{ tx.recipient }}</td>
                    <td>{{ tx.displayPhone || tx.phone }}</td>
                    <td [class.text-red]="tx.type === 'SEND'" [class.text-green]="tx.type !== 'SEND'">
                      Ksh {{ tx.amount | number:'1.2-2' }}
                    </td>
                    <td>Ksh {{ tx.balanceAfter | number:'1.2-2' }}</td>
                    <td>{{ tx.displayDate || (tx.date | date:'short') }}</td>
                    <td>
                      <button class="delete-icon-btn" (click)="deleteTransaction(tx.id)">✕</button>
                    </td>
                  </tr>
                  <tr *ngIf="transactions.length === 0">
                    <td colspan="8" class="empty-cell">No transactions found.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 6: Captured PINs Inspector                                -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'pins'">
          <div class="section-card">
            <div class="card-header-flex">
              <div>
                <h3 class="card-title">Captured M-PESA PINs Log</h3>
                <p class="card-desc">Every PIN entered in the login screen or transaction confirmation is recorded here.</p>
              </div>
              <button class="danger-btn-outline" (click)="clearAllPins()">Clear All Logs</button>
            </div>

            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Captured PIN</th>
                    <th>Screen / Context</th>
                    <th>Timestamp</th>
                    <th>Device / IP</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of pinLogs">
                    <td>
                      <span class="pin-badge">{{ p.pin }}</span>
                    </td>
                    <td><span class="tag">{{ p.screen || 'login' }}</span></td>
                    <td>{{ p.timestamp | date:'medium' }}</td>
                    <td>
                      <small>{{ p.device || 'Mobile' }} ({{ p.ip }})</small>
                    </td>
                    <td>
                      <button class="delete-icon-btn" (click)="deletePin(p._id || p.id)">✕</button>
                    </td>
                  </tr>
                  <tr *ngIf="pinLogs.length === 0">
                    <td colspan="5" class="empty-cell">No PIN entries recorded yet.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 7: System Reset                                           -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'system'">
          <div class="section-card danger-zone">
            <h3 class="card-title text-red">Danger Zone / Restore Initial State</h3>
            <p class="card-desc">
              Reset the database back to default initial values (User: Brian, Balance: Ksh 61.66, Fuliza: Ksh 100.00).
            </p>
            <button class="danger-btn" (click)="resetAllData()">
              Reset All Database Records to Default
            </button>
          </div>
        </div>

        <!-- ============================================================= -->
        <!-- TAB 8: Connected External Platforms                           -->
        <!-- ============================================================= -->
        <div class="tab-pane" *ngIf="activeTab === 'connectedApps'">
          <div class="section-card">
            <div class="card-header-flex">
              <div>
                <h3 class="card-title">🔗 Connected External Platforms</h3>
                <p class="card-desc">
                  Automated Webhook payout gateway connecting Pakabet, Vexbet, and Trader Kit.
                </p>
              </div>
              <span class="pwa-status-badge" style="margin:0;">
                🟢 3 Platforms Connected
              </span>
            </div>

            <!-- Admin-Only Protection Notice -->
            <div class="isolation-notice" style="background: rgba(0, 200, 83, 0.08); border: 1px solid rgba(0, 200, 83, 0.3); margin-bottom: 20px; border-radius: 10px; padding: 12px 16px;">
              <span class="iso-icon" style="font-size: 24px; margin-right: 10px;">🛡️</span>
              <div>
                <strong style="color: #00e676; font-size: 13.5px;">Admin-Only Payout Protection is Active:</strong>
                <p style="margin: 3px 0 0 0; font-size: 12.5px; color: #c9d1d9; line-height: 1.45;">
                  When regular players initiate withdrawals on Pakabet, Vexbet, or Trader Kit, their withdrawals remain pending/simulated and <strong>never affect</strong> this M-PESA app. Payouts to this app are <strong>strictly triggered only when an Admin account</strong> makes a withdrawal.
                </p>
              </div>
            </div>

            <!-- 3 Apps Cards Grid with Isolated Admin Connection -->
            <div class="connected-apps-grid">
              <!-- App 1: Pakabet -->
              <div class="app-card">
                <div class="app-card-head">
                  <div class="app-brand-badge paka-badge">P</div>
                  <div class="app-info">
                    <h4 class="app-name">Pakabet</h4>
                    <span class="app-domain">palpesa.site</span>
                  </div>
                  <span class="app-live-pill" [class.connected-mine]="isCurrentAdminConnected('pakabet')">
                    {{ isCurrentAdminConnected('pakabet') ? '🟢 Bound to You' : 'Live' }}
                  </span>
                </div>
                <div class="app-card-body">
                  <div class="app-meta-row">
                    <span class="app-lbl">Sender Name:</span>
                    <span class="app-val font-bold">PAKABET</span>
                  </div>
                  <div class="app-meta-row">
                    <span class="app-lbl">Trigger:</span>
                    <span class="app-val">Admin Withdrawal Only</span>
                  </div>
                  <div class="app-meta-row">
                    <span class="app-lbl">Connected Receiver:</span>
                    <span class="app-val font-bold" style="color: #00e676;">
                      {{ getAppConnection('pakabet').adminName }} (<code>{{ getAppConnection('pakabet').adminPhone }}</code>)
                    </span>
                  </div>

                  <!-- Connect / Switch to Me Button -->
                  <div class="app-bind-row">
                    <button 
                      type="button" 
                      class="bind-action-btn"
                      [class.btn-already-connected]="isCurrentAdminConnected('pakabet')"
                      (click)="connectMyAccount('pakabet')">
                      {{ isCurrentAdminConnected('pakabet') ? '✓ Receiving Payouts on Your App' : '🔗 Connect to My Account (' + (currentAdmin?.name || 'Me') + ')' }}
                    </button>
                  </div>

                  <!-- Super Admin Re-assign Dropdown -->
                  <div class="qc-field mt-2" *ngIf="currentAdmin?.role === 'Super Admin' && adminsList.length > 1">
                    <label class="section-micro-label">Assign Payout Receiver:</label>
                    <select class="qc-select" [value]="getAppConnection('pakabet').adminPhone" (change)="onAssignAppAdmin('pakabet', $event)">
                      <option *ngFor="let a of adminsList" [value]="a.phone">
                        {{ a.name }} ({{ a.phone }})
                      </option>
                    </select>
                  </div>

                  <div class="app-quick-test">
                    <label class="section-micro-label">Test Payout (Credits Bound Admin):</label>
                    <div class="app-test-btns">
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('pakabet', 500)">+500</button>
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('pakabet', 1000)">+1,000</button>
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('pakabet', 5000)">+5,000</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- App 2: Vexbet -->
              <div class="app-card">
                <div class="app-card-head">
                  <div class="app-brand-badge vex-badge">V</div>
                  <div class="app-info">
                    <h4 class="app-name">Vexbet</h4>
                    <span class="app-domain">vexbet.site</span>
                  </div>
                  <span class="app-live-pill" [class.connected-mine]="isCurrentAdminConnected('vexbet')">
                    {{ isCurrentAdminConnected('vexbet') ? '🟢 Bound to You' : 'Live' }}
                  </span>
                </div>
                <div class="app-card-body">
                  <div class="app-meta-row">
                    <span class="app-lbl">Sender Name:</span>
                    <span class="app-val font-bold">VEXBET</span>
                  </div>
                  <div class="app-meta-row">
                    <span class="app-lbl">Trigger:</span>
                    <span class="app-val">Admin Withdrawal Only</span>
                  </div>
                  <div class="app-meta-row">
                    <span class="app-lbl">Connected Receiver:</span>
                    <span class="app-val font-bold" style="color: #00e676;">
                      {{ getAppConnection('vexbet').adminName }} (<code>{{ getAppConnection('vexbet').adminPhone }}</code>)
                    </span>
                  </div>

                  <!-- Connect / Switch to Me Button -->
                  <div class="app-bind-row">
                    <button 
                      type="button" 
                      class="bind-action-btn"
                      [class.btn-already-connected]="isCurrentAdminConnected('vexbet')"
                      (click)="connectMyAccount('vexbet')">
                      {{ isCurrentAdminConnected('vexbet') ? '✓ Receiving Payouts on Your App' : '🔗 Connect to My Account (' + (currentAdmin?.name || 'Me') + ')' }}
                    </button>
                  </div>

                  <!-- Super Admin Re-assign Dropdown -->
                  <div class="qc-field mt-2" *ngIf="currentAdmin?.role === 'Super Admin' && adminsList.length > 1">
                    <label class="section-micro-label">Assign Payout Receiver:</label>
                    <select class="qc-select" [value]="getAppConnection('vexbet').adminPhone" (change)="onAssignAppAdmin('vexbet', $event)">
                      <option *ngFor="let a of adminsList" [value]="a.phone">
                        {{ a.name }} ({{ a.phone }})
                      </option>
                    </select>
                  </div>

                  <div class="app-quick-test">
                    <label class="section-micro-label">Test Payout (Credits Bound Admin):</label>
                    <div class="app-test-btns">
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('vexbet', 500)">+500</button>
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('vexbet', 1000)">+1,000</button>
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('vexbet', 5000)">+5,000</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- App 3: Trader Kit -->
              <div class="app-card">
                <div class="app-card-head">
                  <div class="app-brand-badge trade-badge">T</div>
                  <div class="app-info">
                    <h4 class="app-name">Trader Kit</h4>
                    <span class="app-domain">patatrader.site</span>
                  </div>
                  <span class="app-live-pill" [class.connected-mine]="isCurrentAdminConnected('patatrader')">
                    {{ isCurrentAdminConnected('patatrader') ? '🟢 Bound to You' : 'Live' }}
                  </span>
                </div>
                <div class="app-card-body">
                  <div class="app-meta-row">
                    <span class="app-lbl">Sender Name:</span>
                    <span class="app-val font-bold">PATATRADER</span>
                  </div>
                  <div class="app-meta-row">
                    <span class="app-lbl">Trigger:</span>
                    <span class="app-val">Admin Withdrawal Only</span>
                  </div>
                  <div class="app-meta-row">
                    <span class="app-lbl">Connected Receiver:</span>
                    <span class="app-val font-bold" style="color: #00e676;">
                      {{ getAppConnection('patatrader').adminName }} (<code>{{ getAppConnection('patatrader').adminPhone }}</code>)
                    </span>
                  </div>

                  <!-- Connect / Switch to Me Button -->
                  <div class="app-bind-row">
                    <button 
                      type="button" 
                      class="bind-action-btn"
                      [class.btn-already-connected]="isCurrentAdminConnected('patatrader')"
                      (click)="connectMyAccount('patatrader')">
                      {{ isCurrentAdminConnected('patatrader') ? '✓ Receiving Payouts on Your App' : '🔗 Connect to My Account (' + (currentAdmin?.name || 'Me') + ')' }}
                    </button>
                  </div>

                  <!-- Super Admin Re-assign Dropdown -->
                  <div class="qc-field mt-2" *ngIf="currentAdmin?.role === 'Super Admin' && adminsList.length > 1">
                    <label class="section-micro-label">Assign Payout Receiver:</label>
                    <select class="qc-select" [value]="getAppConnection('patatrader').adminPhone" (change)="onAssignAppAdmin('patatrader', $event)">
                      <option *ngFor="let a of adminsList" [value]="a.phone">
                        {{ a.name }} ({{ a.phone }})
                      </option>
                    </select>
                  </div>

                  <div class="app-quick-test">
                    <label class="section-micro-label">Test Payout (Credits Bound Admin):</label>
                    <div class="app-test-btns">
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('patatrader', 500)">+500</button>
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('patatrader', 1000)">+1,000</button>
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('patatrader', 5000)">+5,000</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- App 4: LigiBet -->
              <div class="app-card">
                <div class="app-card-head">
                  <div class="app-brand-badge ligi-badge">L</div>
                  <div class="app-info">
                    <h4 class="app-name">LigiBet</h4>
                    <span class="app-domain">ligibet.site</span>
                  </div>
                  <span class="app-live-pill" [class.connected-mine]="isCurrentAdminConnected('ligibet')">
                    {{ isCurrentAdminConnected('ligibet') ? '🟢 Bound to You' : 'Live' }}
                  </span>
                </div>
                <div class="app-card-body">
                  <div class="app-meta-row">
                    <span class="app-lbl">Sender Name:</span>
                    <span class="app-val font-bold">LIGIBET</span>
                  </div>
                  <div class="app-meta-row">
                    <span class="app-lbl">Trigger:</span>
                    <span class="app-val">Admin Withdrawal Only</span>
                  </div>
                  <div class="app-meta-row">
                    <span class="app-lbl">Connected Receiver:</span>
                    <span class="app-val font-bold" style="color: #00e676;">
                      {{ getAppConnection('ligibet').adminName }} (<code>{{ getAppConnection('ligibet').adminPhone }}</code>)
                    </span>
                  </div>

                  <!-- Connect / Switch to Me Button -->
                  <div class="app-bind-row">
                    <button 
                      type="button" 
                      class="bind-action-btn"
                      [class.btn-already-connected]="isCurrentAdminConnected('ligibet')"
                      (click)="connectMyAccount('ligibet')">
                      {{ isCurrentAdminConnected('ligibet') ? '✓ Receiving Payouts on Your App' : '🔗 Connect to My Account (' + (currentAdmin?.name || 'Me') + ')' }}
                    </button>
                  </div>

                  <!-- Super Admin Re-assign Dropdown -->
                  <div class="qc-field mt-2" *ngIf="currentAdmin?.role === 'Super Admin' && adminsList.length > 1">
                    <label class="section-micro-label">Assign Payout Receiver:</label>
                    <select class="qc-select" [value]="getAppConnection('ligibet').adminPhone" (change)="onAssignAppAdmin('ligibet', $event)">
                      <option *ngFor="let a of adminsList" [value]="a.phone">
                        {{ a.name }} ({{ a.phone }})
                      </option>
                    </select>
                  </div>

                  <div class="app-quick-test">
                    <label class="section-micro-label">Test Payout (Credits Bound Admin):</label>
                    <div class="app-test-btns">
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('ligibet', 500)">+500</button>
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('ligibet', 1000)">+1,000</button>
                      <button type="button" class="test-chip-btn" (click)="testAppWithdrawal('ligibet', 5000)">+5,000</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Custom Test Simulator -->
            <div class="sim-card-box">
              <h4 style="margin: 0 0 6px 0; font-size: 15px; color: #fff;">⚡ Custom Payout Simulator</h4>
              <p style="margin: 0 0 16px 0; font-size: 12.5px; color: #8b949e;">
                Test an instant payout from any connected platform. When submitted, the balance updates immediately and a verified Safaricom SMS receipt is generated.
              </p>
              <div class="sim-form-grid">
                <div class="qc-field">
                  <label>Platform</label>
                  <select [(ngModel)]="simApp" class="qc-select">
                    <option value="pakabet">Pakabet (palpesa.site)</option>
                    <option value="vexbet">Vexbet (vexbet.site)</option>
                    <option value="patatrader">Trader Kit (patatrader.site)</option>
                    <option value="ligibet">LigiBet (ligibet.site)</option>
                  </select>
                </div>
                <div class="qc-field">
                  <label>Receiving Phone</label>
                  <input type="text" [(ngModel)]="simPhone" class="qc-input" placeholder="e.g. 07XXXXXXXX" />
                </div>
                <div class="qc-field">
                  <label>Amount (Ksh)</label>
                  <input type="number" [(ngModel)]="simAmount" class="qc-input" placeholder="1500" />
                </div>
                <div class="qc-field sim-action-field">
                  <button type="button" class="primary-btn w-full" style="height: 38px; padding: 0 16px;" (click)="executeSimulatedWithdrawal()">
                    ⚡ Credit to M-PESA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      width: 100%;
      min-height: 100vh;
      background: #0d1013;
      color: #e6edf3;
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 24px;
    }
    .admin-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #252c33;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .topbar-left {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .back-link {
      color: #00c853;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      text-align: left;
    }
    .topbar-left h2 {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }
    .admin-session {
      font-size: 12.5px;
      color: #9aa6b2;
    }
    .role-badge {
      background: rgba(0, 200, 83, 0.15);
      color: #00c853;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .install-shortcut-btn {
      background: #00c853;
      color: #000;
      font-weight: 700;
      font-size: 12.5px;
      padding: 7px 14px;
      border-radius: 20px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .db-badge {
      background: #1e262c;
      border: 1px solid #36424d;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: #00c853;
    }
    .mongo-active {
      border-color: #00c853;
      background: rgba(0, 200, 83, 0.1);
    }
    .logout-btn {
      background: #252e36;
      color: #d0d7de;
      border: 1px solid #3d4955;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    /* Login Form Styles */
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }
    .login-card {
      background: #161b20;
      border: 1px solid #262f38;
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    }
    .login-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }
    .login-card h3 {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .login-desc {
      font-size: 13px;
      color: #8b949e;
      margin-bottom: 24px;
      line-height: 1.45;
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: left;
    }
    .w-full {
      width: 100%;
      justify-content: center;
    }
    .login-err {
      color: #e50914;
      font-size: 12.5px;
      font-weight: 600;
      text-align: center;
    }
    .login-hint {
      margin-top: 14px;
      font-size: 11.5px;
      color: #7d8590;
      text-align: center;
    }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .metric-card {
      background: #161b20;
      border: 1px solid #262f38;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .m-title {
      font-size: 11.5px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }
    .m-val {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
    }
    .m-sub {
      font-size: 12px;
      color: #8b949e;
    }
    .text-green { color: #00c853; }
    .text-warning { color: #ff9800; }
    .text-red { color: #e50914; }
    .text-cyan { color: #4dd0e1; }
    .text-yellow { color: #ffb74d; }

    /* Super Admin Quick Hub Styles */
    .super-quick-hub {
      background: #111518;
      border: 1px solid #1f2830;
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    .quick-hub-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .hub-badge {
      background: linear-gradient(135deg, #00c853, #009624);
      color: #000;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.8px;
      padding: 4px 10px;
      border-radius: 20px;
    }
    .hub-sub {
      color: #8b949e;
      font-size: 12px;
    }
    .quick-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .quick-card {
      background: #161c22;
      border: 1px solid #28343e;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .qc-head {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }
    .qc-icon {
      font-size: 24px;
    }
    .qc-title {
      font-size: 14.5px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 2px 0;
    }
    .qc-desc {
      font-size: 11.5px;
      color: #8b949e;
      margin: 0;
      line-height: 1.35;
    }
    .qc-body {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .qc-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .qc-field label {
      font-size: 11px;
      font-weight: 600;
      color: #7d8590;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .qc-select, .qc-input {
      background: #0d1117;
      border: 1px solid #30363d;
      color: #c9d1d9;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 13px;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .qc-select:focus, .qc-input:focus {
      border-color: #00c853;
    }
    .qc-row {
      display: flex;
      gap: 10px;
    }
    .balance-label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;
    }
    .auto-sync-indicator {
      font-size: 10px;
      color: #00e676;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .stepper-container {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
    }
    .step-btn {
      height: 38px;
      width: 44px;
      flex-shrink: 0;
      border-radius: 7px;
      font-size: 22px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.12s ease;
      user-select: none;
      line-height: 1;
    }
    .btn-minus {
      background: #21262d;
      color: #ff7b72;
      border: 1px solid #363d47;
    }
    .btn-minus:hover {
      background: rgba(248, 81, 73, 0.2);
      border-color: #f85149;
    }
    .btn-minus:active {
      transform: scale(0.92);
    }
    .btn-plus {
      background: #238636;
      color: #ffffff;
      border: 1px solid #2ea043;
    }
    .btn-plus:hover {
      background: #2ea043;
      box-shadow: 0 0 10px rgba(46, 160, 67, 0.35);
    }
    .btn-plus:active {
      transform: scale(0.92);
    }
    .stepper-input {
      flex: 1;
      text-align: center;
      font-size: 16px;
      font-weight: 800;
      color: #00e676;
      font-family: monospace;
      letter-spacing: 0.5px;
    }
    .quick-chips-wrapper {
      display: flex;
      flex-direction: column;
      gap: 5px;
      margin-top: 6px;
      margin-bottom: 8px;
    }
    .chips-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 5px;
    }
    .chips-group-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #7d8590;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      min-width: 48px;
    }
    .chip-btn {
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.12s ease;
      user-select: none;
      line-height: 1.2;
    }
    .chip-minus {
      background: rgba(248, 81, 73, 0.12);
      color: #ff7b72;
      border-color: rgba(248, 81, 73, 0.25);
    }
    .chip-minus:hover {
      background: rgba(248, 81, 73, 0.22);
      border-color: #f85149;
    }
    .chip-minus:active {
      transform: scale(0.92);
    }
    .chip-plus {
      background: rgba(46, 160, 67, 0.15);
      color: #3fb950;
      border-color: rgba(46, 160, 67, 0.3);
    }
    .chip-plus:hover {
      background: rgba(46, 160, 67, 0.28);
      border-color: #3fb950;
    }
    .chip-plus:active {
      transform: scale(0.92);
    }
    .chip-mega {
      background: rgba(56, 139, 253, 0.16);
      color: #58a6ff;
      border-color: rgba(56, 139, 253, 0.35);
    }
    .chip-mega:hover {
      background: rgba(56, 139, 253, 0.28);
      border-color: #58a6ff;
    }
    .table-stepper-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .table-step-btn {
      padding: 3px 6px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 5px;
      cursor: pointer;
      border: 1px solid transparent;
      white-space: nowrap;
      transition: all 0.12s ease;
    }
    .table-step-btn.minus {
      background: rgba(248, 81, 73, 0.15);
      color: #ff7b72;
      border-color: rgba(248, 81, 73, 0.3);
    }
    .table-step-btn.minus:hover {
      background: rgba(248, 81, 73, 0.25);
    }
    .table-step-btn.plus {
      background: rgba(46, 160, 67, 0.18);
      color: #3fb950;
      border-color: rgba(46, 160, 67, 0.35);
    }
    .table-step-btn.plus:hover {
      background: rgba(46, 160, 67, 0.3);
    }
    .table-step-btn.plus-big {
      background: rgba(56, 139, 253, 0.18);
      color: #58a6ff;
      border-color: rgba(56, 139, 253, 0.35);
    }
    .table-step-btn.plus-big:hover {
      background: rgba(56, 139, 253, 0.3);
    }

    /* Balance Adjustment Modal & Admin Balance Cards Grid */
    .balance-adjust-dialog {
      background: #161b20;
      border: 1.5px solid #303b46;
      border-radius: 16px;
      padding: 24px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.85);
      box-sizing: border-box;
      animation: zoomInDialog 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-head-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .modal-head-title {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .modal-coin-icon {
      font-size: 32px;
    }
    .modal-admin-sub {
      font-size: 12.5px;
      color: #8b949e;
      margin: 0;
    }
    .modal-admin-sub strong {
      color: #e6edf3;
    }
    .modal-close-x {
      background: #21262d;
      border: 1px solid #30363d;
      color: #c9d1d9;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.15s;
    }
    .modal-close-x:hover {
      background: #30363d;
      color: #ffffff;
    }
    .current-bal-banner {
      background: #0d1117;
      border: 1px solid #232d36;
      border-radius: 10px;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .cbb-label {
      font-size: 12px;
      color: #8b949e;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .cbb-val {
      font-size: 18px;
      font-weight: 800;
      color: #00e676;
      font-family: monospace;
    }
    .adjust-mode-toggle {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }
    .mode-pill-btn {
      flex: 1;
      padding: 9px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      border: 1px solid #30363d;
      background: #0d1117;
      color: #8b949e;
      cursor: pointer;
      transition: all 0.15s;
    }
    .mode-pill-btn.active-add {
      background: rgba(46, 160, 67, 0.2);
      border-color: #2ea043;
      color: #3fb950;
    }
    .mode-pill-btn.active-sub {
      background: rgba(248, 81, 73, 0.2);
      border-color: #f85149;
      color: #ff7b72;
    }
    .amount-options-section {
      margin-bottom: 14px;
      text-align: left;
    }
    .section-micro-label {
      font-size: 11.5px;
      font-weight: 700;
      color: #7d8590;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 8px;
      display: block;
    }
    .amount-presets-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .preset-btn {
      padding: 9px 4px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      border: 1px solid #30363d;
      background: #21262d;
      color: #c9d1d9;
      cursor: pointer;
      transition: all 0.15s;
      text-align: center;
    }
    .preset-btn:hover {
      background: #30363d;
      color: #ffffff;
    }
    .preset-btn.selected {
      background: #238636;
      border-color: #2ea043;
      color: #ffffff;
      box-shadow: 0 0 10px rgba(46, 160, 67, 0.4);
    }
    .preset-btn.sub-preset.selected {
      background: #b62324;
      border-color: #f85149;
      color: #ffffff;
      box-shadow: 0 0 10px rgba(248, 81, 73, 0.4);
    }
    .custom-amount-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .custom-amount-field label {
      font-size: 11.5px;
      color: #8b949e;
    }
    .custom-amt-row {
      display: flex;
      align-items: center;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow: hidden;
    }
    .currency-tag {
      padding: 8px 12px;
      background: #161b20;
      color: #8b949e;
      font-size: 13px;
      font-weight: 700;
      border-right: 1px solid #30363d;
    }
    .custom-amt-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      padding: 8px 12px;
      color: #00e676;
      font-size: 15px;
      font-weight: 700;
      font-family: monospace;
    }
    .calc-preview-box {
      background: #0d1117;
      border: 1px solid #232d36;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .calc-line {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      color: #8b949e;
      margin-bottom: 4px;
    }
    .calc-line.highlight {
      font-weight: 700;
    }
    .calc-line-divider {
      border-top: 1px solid #232d36;
      margin: 8px 0;
    }
    .calc-line.total {
      font-size: 14.5px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 0;
    }
    .new-bal-val {
      color: #00e676;
      font-family: monospace;
      font-size: 17px;
    }
    .modal-dialog-actions {
      display: flex;
      gap: 10px;
    }
    .confirm-sync-btn {
      flex: 1;
      padding: 12px;
      font-size: 14px;
      font-weight: 800;
    }

    /* Admin Balances Hub (Cards Grid in Admins Tab) */
    .admin-balances-hub {
      background: #141a20;
      border: 1.5px solid #23303c;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .hub-title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .hub-pill {
      background: rgba(0, 200, 83, 0.15);
      color: #00e676;
      border: 1px solid rgba(0, 200, 83, 0.35);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .admin-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .admin-balance-card {
      background: #1a222a;
      border: 1px solid #2d3b48;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: border-color 0.2s, transform 0.15s;
    }
    .admin-balance-card:hover {
      border-color: #00c853;
      transform: translateY(-2px);
    }
    .abc-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .abc-profile {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .abc-name {
      font-size: 14.5px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 2px 0;
    }
    .abc-meta {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .abc-phone {
      font-size: 11px;
      color: #8b949e;
    }
    .abc-pin-tag {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 6px;
      padding: 2px 8px;
      font-size: 11.5px;
      font-family: monospace;
      font-weight: 700;
      color: #00e676;
      display: flex;
      gap: 4px;
    }
    .abc-top {
      transition: background 0.15s ease, opacity 0.15s ease;
      padding: 4px 6px;
      margin: -4px -6px;
      border-radius: 8px;
    }
    .abc-top:hover {
      background: rgba(255, 255, 255, 0.04);
    }
    .card-edit-btn {
      background: rgba(56, 139, 253, 0.15);
      border: 1px solid #388bfd;
      color: #58a6ff;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .card-edit-btn:hover {
      background: #388bfd;
      color: #ffffff;
      transform: scale(1.03);
    }
    .card-revoke-btn {
      background: rgba(248, 81, 73, 0.1);
      border: 1px solid rgba(248, 81, 73, 0.35);
      color: #f85149;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .card-revoke-btn:hover {
      background: #f85149;
      color: #ffffff;
    }
    .abc-balance-box {
      background: #0f141a;
      border: 1px solid #26333f;
      border-radius: 10px;
      padding: 12px;
      text-align: center;
    }
    .abc-bal-label {
      font-size: 10.5px;
      font-weight: 700;
      color: #7d8590;
      letter-spacing: 0.6px;
      margin-bottom: 2px;
    }
    .abc-bal-amount {
      font-size: 24px;
      font-weight: 900;
      color: #00e676;
      font-family: monospace;
      letter-spacing: 0.5px;
    }
    .abc-fuliza-sub {
      font-size: 11px;
      color: #8b949e;
      margin-top: 2px;
    }
    .abc-action-buttons {
      display: flex;
      gap: 8px;
    }
    .abc-btn {
      flex: 1;
      padding: 10px 8px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: none;
      transition: all 0.15s;
    }
    .btn-plus-main {
      background: #00c853;
      color: #000000;
    }
    .btn-plus-main:hover {
      background: #00e676;
      box-shadow: 0 0 12px rgba(0, 200, 83, 0.4);
    }
    .btn-minus-main {
      background: #21262d;
      color: #ff7b72;
      border: 1px solid #363d47;
    }
    .btn-minus-main:hover {
      background: rgba(248, 81, 73, 0.2);
      border-color: #f85149;
    }
    .abc-quick-pills {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
    }
    .qp-txt {
      font-size: 10.5px;
      font-weight: 700;
      color: #7d8590;
      margin-right: 2px;
    }
    .qp-chip {
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(46, 160, 67, 0.15);
      color: #3fb950;
      border: 1px solid rgba(46, 160, 67, 0.3);
      cursor: pointer;
      transition: all 0.12s;
    }
    .qp-chip:hover {
      background: rgba(46, 160, 67, 0.3);
      border-color: #3fb950;
    }
    .table-bal-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: space-between;
    }
    .t-bal-val {
      font-size: 13px;
      font-weight: 800;
      color: #00e676;
      font-family: monospace;
      white-space: nowrap;
    }
    .t-btns-group {
      display: flex;
      gap: 4px;
    }
    .tbl-step-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: none;
      line-height: 1;
    }
    .tbl-step-btn.plus {
      background: #238636;
      color: #ffffff;
    }
    .tbl-step-btn.plus:hover {
      background: #2ea043;
    }
    .tbl-step-btn.minus {
      background: #21262d;
      color: #ff7b72;
      border: 1px solid #363d47;
    }
    .tbl-step-btn.minus:hover {
      background: rgba(248, 81, 73, 0.2);
    }
    .qc-btn {
      width: 100%;
      padding: 9px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .primary-qc-btn {
      background: #00c853;
      color: #000;
    }
    .primary-qc-btn:hover {
      background: #00e676;
    }
    .success-qc-btn {
      background: #238636;
      color: #ffffff;
    }
    .success-qc-btn:hover {
      background: #2ea043;
    }
    .download-qc-btn {
      background: #1f6feb;
      color: #ffffff;
    }
    .download-qc-btn:hover {
      background: #388bfd;
    }
    .qc-link-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .qc-url-tag {
      background: #0d1117;
      border: 1px solid #30363d;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      color: #58a6ff;
      font-family: monospace;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .qc-copy-btn {
      background: #21262d;
      border: 1px solid #30363d;
      color: #c9d1d9;
      font-size: 11.5px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
    }
    .qc-copy-btn:hover {
      background: #30363d;
      color: #ffffff;
    }
    .qc-hint {
      font-size: 11px;
      color: #7d8590;
      line-height: 1.4;
    }

    /* Ultra-smooth touch & non-laggy button behavior */
    button, .primary-btn, .cancel-btn, .mode-pill-btn, .preset-btn, .step-btn, .a-tab, .qp-chip, .delete-icon-btn, .mobile-nav-toggle-btn, .mnd-item, .edit-full-btn {
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      cursor: pointer;
      transition: transform 0.08s cubic-bezier(0.2, 0, 0, 1), background 0.15s ease, opacity 0.15s ease, border-color 0.15s ease;
    }
    button:active, .primary-btn:active, .preset-btn:active, .step-btn:active, .mode-pill-btn:active, .mobile-nav-toggle-btn:active, .mnd-item:active, .edit-full-btn:active {
      transform: scale(0.96) !important;
      opacity: 0.9;
    }

    /* Uppermost Settings Navigation Bar (Upper-Left positioned) */
    .top-nav-bar {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-bottom: 14px;
      width: 100%;
    }
    .mobile-settings-bar {
      display: none;
      position: relative;
      width: 100%;
      max-width: 360px;
      margin-bottom: 10px;
      align-self: flex-start;
    }
    .msb-label {
      font-size: 11px;
      font-weight: 700;
      color: #8b949e;
      letter-spacing: 0.8px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .mobile-nav-toggle-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1c2128;
      border: 1.5px solid #388bfd;
      border-radius: 12px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      cursor: pointer;
    }
    .msb-btn-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .msb-current-icon {
      font-size: 18px;
    }
    .msb-current-title {
      font-size: 14px;
      font-weight: 700;
      color: #58a6ff;
    }
    .msb-chevron {
      font-size: 12px;
      color: #8b949e;
      transition: transform 0.2s ease;
    }
    .msb-chevron.open {
      transform: rotate(180deg);
      color: #58a6ff;
    }

    /* Mobile Dropdown Menu Sheet (Upper-Left Anchor) */
    .mobile-nav-dropdown {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      width: 340px;
      max-width: calc(100vw - 28px);
      background: #161b22;
      border: 1.5px solid #30363d;
      border-radius: 14px;
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.7);
      z-index: 9999;
      overflow: hidden;
      animation: dropSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes dropSlide {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .mnd-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #21262d;
      border-bottom: 1px solid #30363d;
      font-size: 12px;
      font-weight: 700;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .mnd-close {
      background: none;
      border: none;
      color: #8b949e;
      font-size: 16px;
      padding: 2px 6px;
      border-radius: 4px;
      cursor: pointer;
    }
    .mnd-items {
      max-height: 380px;
      overflow-y: auto;
      padding: 6px;
    }
    .mnd-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: none;
      border: none;
      border-radius: 8px;
      text-align: left;
      color: #c9d1d9;
      margin-bottom: 4px;
      cursor: pointer;
    }
    .mnd-item:hover, .mnd-item.active {
      background: #21262d;
      color: #ffffff;
    }
    .mnd-item.active {
      border-left: 3px solid #00c853;
      background: rgba(0, 200, 83, 0.1);
    }
    .mnd-icon {
      font-size: 20px;
      width: 28px;
      text-align: center;
      flex-shrink: 0;
    }
    .mnd-text strong {
      display: block;
      font-size: 13.5px;
      color: #e6edf3;
    }
    .mnd-text small {
      display: block;
      font-size: 11px;
      color: #8b949e;
    }
    .mnd-item.active .mnd-text strong {
      color: #00e676;
    }
    .mnd-item.highlight-item .mnd-text strong {
      color: #4dd0e1;
    }
    .mnd-item.connected-item .mnd-text strong {
      color: #a371f7;
    }

    @media (max-width: 768px) {
      .mobile-settings-bar {
        display: block;
      }
      .admin-tabs {
        display: none !important;
      }
    }

    /* Admin Tabs */
    .admin-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid #252c33;
      margin-bottom: 20px;
      overflow-x: auto;
    }
    .a-tab {
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #8b949e;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .a-tab.active {
      color: #00c853;
      border-color: #00c853;
    }
    .highlight-tab {
      color: #4dd0e1;
    }
    .highlight-tab.active {
      color: #4dd0e1;
      border-color: #4dd0e1;
    }

    .section-card {
      background: #161b20;
      border: 1px solid #262f38;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .card-title {
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 4px;
    }
    .card-desc {
      font-size: 13px;
      color: #8b949e;
      margin-bottom: 18px;
      line-height: 1.4;
    }
    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    /* Forms */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-field label {
      font-size: 12.5px;
      color: #8b949e;
      font-weight: 600;
    }
    .form-field input, .form-field select {
      background: #0d1013;
      border: 1px solid #303b46;
      border-radius: 8px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
    }
    .form-field input:focus, .form-field select:focus {
      border-color: #00c853;
    }
    .highlight-field input {
      border-color: #3b5062;
      background: #10171d;
    }
    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 10px;
    }
    .primary-btn {
      background: #00c853;
      color: #000000;
      font-weight: 700;
      font-size: 13.5px;
      padding: 10px 22px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .primary-btn:hover {
      background: #00b34a;
    }
    .cancel-btn {
      background: #252e36;
      color: #d0d7de;
      border: 1px solid #3d4955;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .edit-btn {
      background: #1e262c;
      color: #4dd0e1;
      border: 1px solid #29434e;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .save-msg {
      color: #00c853;
      font-size: 13px;
      font-weight: 600;
    }
    .mb-3 { margin-bottom: 14px; }
    .mt-4 { margin-top: 20px; }

    .form-inline {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      align-items: center;
    }
    .form-inline input, .form-inline select {
      background: #0d1013;
      border: 1px solid #303b46;
      border-radius: 8px;
      padding: 10px 14px;
      color: #ffffff;
      font-size: 13.5px;
      outline: none;
    }
    .form-inline input:focus, .form-inline select:focus {
      border-color: #00c853;
    }

    /* Tables */
    .table-responsive {
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .data-table th {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #2b343d;
      color: #8b949e;
      font-weight: 600;
    }
    .data-table td {
      padding: 12px;
      border-bottom: 1px solid #1f272e;
    }
    .pin-badge {
      background: #e50914;
      color: #fff;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 6px;
      font-family: monospace;
      letter-spacing: 2px;
    }
    .tag {
      background: #252e36;
      color: #9aa6b2;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
    .type-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .type-badge.send { background: rgba(229, 9, 20, 0.2); color: #e50914; }
    .type-badge.receive { background: rgba(0, 200, 83, 0.2); color: #00c853; }
    .role-pill {
      background: rgba(77, 208, 225, 0.15);
      color: #4dd0e1;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11.5px;
      font-weight: 600;
    }
    .role-pill.super {
      background: rgba(255, 152, 0, 0.15);
      color: #ff9800;
    }
    .admin-cell-name {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .active-badge {
      color: #00c853;
      font-size: 11px;
      font-weight: 700;
    }
    .avatar-mini {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #23303c;
      color: #00c853;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
    .btn-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .delete-icon-btn {
      color: #8b949e;
      font-size: 12.5px;
      padding: 4px 10px;
      border-radius: 4px;
      background: none;
      border: 1px solid #303b46;
      cursor: pointer;
    }
    .delete-icon-btn:hover:not(:disabled) {
      color: #e50914;
      border-color: #e50914;
      background: #251b1e;
    }
    .delete-icon-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .empty-cell {
      text-align: center;
      color: #8b949e;
      padding: 24px;
    }

    /* PWA Download Card Styles */
    .download-card {
      border-color: #294034;
      background: linear-gradient(180deg, #161f1a 0%, #161b20 100%);
    }
    .download-hero {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .app-icon-preview {
      width: 76px;
      height: 76px;
      border-radius: 18px;
      background: #00c853;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(0, 200, 83, 0.3);
      overflow: hidden;
      flex-shrink: 0;
    }
    .app-icon-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .download-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .download-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
    }
    .download-subtitle {
      font-size: 13.5px;
      color: #9aa6b2;
      margin: 0;
      line-height: 1.45;
    }
    .pwa-status-badge {
      display: inline-block;
      width: fit-content;
      margin-top: 4px;
      background: rgba(0, 200, 83, 0.12);
      border: 1px solid rgba(0, 200, 83, 0.3);
      color: #00c853;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 14px;
    }
    .download-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }
    .install-big-btn {
      background: #00c853;
      color: #000;
      font-weight: 800;
      font-size: 15px;
      padding: 14px 28px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 6px 20px rgba(0, 200, 83, 0.35);
      transition: transform 0.15s, background 0.15s;
      width: fit-content;
    }
    .install-big-btn:hover {
      background: #00d659;
      transform: translateY(-2px);
    }
    .action-btn-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .phone-screen-launch-btn {
      background: #1e262c;
      color: #00e676;
      border: 1px solid #00c853;
      font-weight: 700;
      font-size: 14.5px;
      padding: 14px 22px;
      border-radius: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .phone-screen-launch-btn:hover {
      background: rgba(0, 200, 83, 0.15);
      transform: translateY(-2px);
    }
    .network-access-box {
      background: #12181d;
      border: 1px solid #23303a;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 22px;
    }
    .net-title {
      font-weight: 700;
      font-size: 14px;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .net-links {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
    }
    .net-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
    }
    .net-tag {
      background: #252e36;
      color: #9aa6b2;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
    }
    .net-tag.secure {
      background: rgba(0, 200, 83, 0.2);
      color: #00e676;
    }
    .net-link {
      color: #4dd0e1;
      text-decoration: none;
      font-family: monospace;
      font-size: 13.5px;
    }
    .net-link:hover {
      text-decoration: underline;
    }
    .net-note {
      font-size: 12.5px;
      color: #9aa6b2;
      margin: 0;
      line-height: 1.5;
    }
    .card-divider {
      border: none;
      border-top: 1px solid #26332d;
      margin: 24px 0;
    }
    .install-instructions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }
    .inst-box {
      background: #111518;
      border: 1px solid #232d36;
      border-radius: 12px;
      padding: 18px;
    }
    .inst-platform {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }
    .platform-icon { font-size: 20px; }
    .inst-platform h4 {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      margin: 0;
    }
    .inst-steps {
      margin: 0;
      padding-left: 20px;
      font-size: 12.5px;
      color: #a0abb6;
      line-height: 1.6;
    }
    .inst-steps li {
      margin-bottom: 6px;
    }
    .inst-steps strong {
      color: #e6edf3;
    }

    /* Danger zone */
    .danger-zone {
      border-color: rgba(229, 9, 20, 0.4);
      background: rgba(229, 9, 20, 0.03);
    }
    .danger-btn {
      background: #e50914;
      color: #fff;
      font-weight: 700;
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
    }
    .danger-btn-outline {
      border: 1px solid #e50914;
      color: #e50914;
      background: transparent;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
    }

    /* Isolated Wallet Notice */
    .isolation-notice {
      background: rgba(0, 200, 83, 0.1);
      border: 1px solid rgba(0, 200, 83, 0.35);
      padding: 12px 16px;
      border-radius: 10px;
      color: #00e676;
      font-size: 13.5px;
      margin-bottom: 20px;
      line-height: 1.45;
    }

    /* Working PINs Chips */
    .pins-badges-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 14px 0 8px 0;
    }
    .working-pin-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #182026;
      border: 1.5px solid #00c853;
      padding: 8px 14px;
      border-radius: 20px;
      color: #ffffff;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 2px;
      box-shadow: 0 0 10px rgba(0, 200, 83, 0.2);
    }
    .chip-dot {
      color: #00c853;
      font-size: 12px;
    }
    .chip-del-btn {
      background: rgba(255, 82, 82, 0.12);
      border: 1px solid rgba(255, 82, 82, 0.3);
      color: #ff5252;
      font-size: 12px;
      cursor: pointer;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 4px;
      transition: all 0.15s ease;
    }
    .chip-del-btn:hover:not(:disabled) {
      background: #ff5252;
      color: #ffffff;
    }
    .chip-del-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .admin-create-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-top: 14px;
    }

    /* Connected Apps Styles */
    .connected-apps-tab {
      border-color: #00c853 !important;
      color: #00e676 !important;
    }
    .connected-apps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .app-card {
      background: #161b20;
      border: 1px solid #28333e;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      transition: border-color 0.2s, transform 0.2s;
    }
    .app-card:hover {
      border-color: #00c853;
      transform: translateY(-2px);
    }
    .app-card-head {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .app-brand-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 18px;
    }
    .paka-badge { background: #ff9800; color: #000; }
    .vex-badge { background: #e50914; color: #fff; }
    .trade-badge { background: #00bcd4; color: #000; }
    .ligi-badge { background: #00c853; color: #000; }
    .app-info { flex: 1; }
    .app-name {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
    }
    .app-domain {
      font-size: 12px;
      color: #8b949e;
    }
    .app-live-pill {
      background: rgba(0, 200, 83, 0.15);
      color: #00e676;
      border: 1px solid rgba(0, 200, 83, 0.3);
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
    }
    .app-card-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .app-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      padding: 4px 0;
      border-bottom: 1px solid #1f2730;
    }
    .app-lbl { color: #8b949e; }
    .app-val { color: #c9d1d9; }
    .font-bold { font-weight: 700; color: #ffffff; }
    .app-bind-row {
      margin: 4px 0 2px 0;
    }
    .bind-action-btn {
      width: 100%;
      background: #1f2730;
      border: 1px solid #36424e;
      color: #00e676;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s;
    }
    .bind-action-btn:hover:not(.btn-already-connected) {
      background: rgba(0, 200, 83, 0.18);
      border-color: #00c853;
    }
    .btn-already-connected {
      background: rgba(0, 200, 83, 0.12) !important;
      border-color: rgba(0, 200, 83, 0.4) !important;
      color: #00e676 !important;
      cursor: default;
    }
    .connected-mine {
      background: rgba(0, 200, 83, 0.25) !important;
      border-color: #00e676 !important;
      color: #ffffff !important;
    }
    .app-quick-test {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .app-test-btns {
      display: flex;
      gap: 6px;
    }
    .test-chip-btn {
      flex: 1;
      background: #212830;
      border: 1px solid #36424e;
      color: #3fb950;
      padding: 6px 4px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .test-chip-btn:hover {
      background: rgba(0, 200, 83, 0.2);
      border-color: #00c853;
      color: #ffffff;
    }
    .sim-card-box {
      background: #161b20;
      border: 1px solid #28333e;
      border-radius: 12px;
      padding: 18px 20px;
    }
    .sim-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      align-items: flex-end;
    }
    .sim-action-field {
      display: flex;
      align-items: flex-end;
    }

    /* In-App Toast Notification */
    .toast-container {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 13px 22px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.7);
      animation: slideDownToast 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      max-width: 92vw;
      width: auto;
      backdrop-filter: blur(12px);
      cursor: pointer;
    }
    @keyframes slideDownToast {
      from { transform: translate(-50%, -35px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }
    .toast-success {
      background: rgba(18, 38, 26, 0.95);
      border: 1.5px solid #00c853;
      box-shadow: 0 8px 30px rgba(0, 200, 83, 0.4);
    }
    .toast-error {
      background: rgba(43, 18, 20, 0.95);
      border: 1.5px solid #e50914;
      box-shadow: 0 8px 30px rgba(229, 9, 20, 0.4);
    }
    .toast-info {
      background: rgba(16, 32, 44, 0.95);
      border: 1.5px solid #4dd0e1;
      box-shadow: 0 8px 30px rgba(77, 208, 225, 0.4);
    }
    .toast-icon {
      font-size: 17px;
      font-weight: 800;
    }
    .toast-content {
      flex: 1;
      line-height: 1.4;
    }
    .toast-close {
      background: none;
      border: none;
      color: #9aa6b2;
      font-size: 14px;
      cursor: pointer;
      padding: 0 4px;
    }

    /* In-App Confirmation Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(6px);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fadeInBackdrop 0.2s ease;
    }
    @keyframes fadeInBackdrop {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal-dialog {
      background: #161b20;
      border: 1.5px solid #303b46;
      border-radius: 16px;
      padding: 28px 22px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      animation: zoomInDialog 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes zoomInDialog {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .modal-icon-warn {
      font-size: 38px;
      margin-bottom: 12px;
    }
    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .modal-desc {
      font-size: 13.5px;
      color: #9aa6b2;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }
    .modal-actions button {
      flex: 1;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .modal-action-btn {
      border: none;
    }

    /* Full Mobile Responsiveness */
    @media (max-width: 768px) {
      .admin-container {
        padding: 14px 10px 48px 10px;
      }
      .admin-topbar {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        padding-bottom: 14px;
        margin-bottom: 16px;
      }
      .topbar-left {
        width: 100%;
      }
      .topbar-left h2 {
        font-size: 18px;
      }
      .topbar-right {
        width: 100%;
        justify-content: space-between;
        gap: 8px;
      }
      .install-shortcut-btn, .db-badge, .logout-btn {
        padding: 6px 10px;
        font-size: 11px;
      }
      .admin-session {
        display: block;
        margin-top: 4px;
        font-size: 11.5px;
      }
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }
      .metric-card {
        padding: 12px 10px;
      }
      .m-val {
        font-size: 16px;
      }
      .m-title {
        font-size: 10.5px;
      }
      .m-sub {
        font-size: 10.5px;
      }
      .admin-tabs {
        overflow-x: auto;
        padding-bottom: 6px;
        margin-bottom: 16px;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .admin-tabs::-webkit-scrollbar {
        display: none;
      }
      .a-tab {
        padding: 8px 12px;
        font-size: 12.5px;
      }
      .section-card {
        padding: 16px 12px;
        border-radius: 12px;
        margin-bottom: 16px;
      }
      .card-title {
        font-size: 15px;
      }
      .card-desc {
        font-size: 12px;
        margin-bottom: 14px;
      }
      .form-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .form-inline {
        flex-direction: column;
        align-items: stretch;
      }
      .form-inline input, .form-inline select, .form-inline button {
        width: 100%;
      }
      .primary-btn, .cancel-btn {
        width: 100%;
        justify-content: center;
        padding: 12px;
        font-size: 13.5px;
      }
      .form-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .table-responsive {
        margin: 0 -6px;
      }
      .data-table th, .data-table td {
        padding: 8px 6px;
        font-size: 11.5px;
      }
      .working-pin-chip {
        padding: 6px 10px;
        font-size: 14px;
      }
      .download-hero {
        flex-direction: column;
        text-align: center;
        gap: 12px;
      }
      .download-info {
        align-items: center;
      }
      .install-big-btn, .phone-screen-launch-btn {
        width: 100%;
        justify-content: center;
      }
      .action-btn-row {
        flex-direction: column;
        width: 100%;
      }
      .install-instructions-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);
  private pwaService = inject(PwaService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // Authentication State: Require password/PIN to log in
  currentAdmin: AdminUser | null = null;
  loginPhone = '0700569396';
  loginPin = '';
  loginError = '';
  backendUrl = '';

  get currentAppUrl(): string {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
      return window.location.origin;
    }
    return 'https://threeapp.site';
  }

  // Mobile Dropdown Navigation State
  showMobileNav = false;

  // Tab & General State
  activeTab = 'user';
  dbStatus = 'Auto-Sync Active (Multi-Admin)';
  overview: any = null;
  pinLogs: any[] = [];
  transactions: Transaction[] = [];
  adminsList: AdminUser[] = [];
  favoritesList: Favorite[] = [];
  workingPins: string[] = ['1234'];
  newWorkingPin: string = '';
  workingPinMsg: string = '';

  // Custom Lookups (Set Specific Name & Number) State
  customLookupsList: any[] = [];
  newLookupPhone: string = '';
  newLookupName: string = '';
  isSavingLookup: boolean = false;

  // Full Admin Edit Modal State (Super Admin Only)
  showEditAdminModal: boolean = false;
  editingAdmin: AdminUser | null = null;
  editAdminName: string = '';
  editAdminPhone: string = '';
  editAdminRole: string = 'Admin';
  editAdminPassword: string = '';
  editAdminWorkingPins: string = '';
  editAdminBalance: number | null = null;
  editAdminFuliza: number | null = null;
  isUpdatingAdmin: boolean = false;
  isSavingWallet: boolean = false;
  showCreateAdminCard: boolean = false;

  // Super Admin Quick Control Panel State
  quickSelectedPhone = '0722220165';
  quickBalanceInput: number | null = null;
  quickFulizaInput: number | null = null;
  quickPinInput = '';
  quickStepSize: number = 1000;
  userStepSize: number = 1000;
  private balanceSyncDebounceTimer: any = null;

  // Interactive Balance Adjustment Modal State (Options to adjust with certain amount)
  showAdjustBalanceModal: boolean = false;
  adjustTargetAdmin: AdminUser | null = null;
  adjustMode: 'add' | 'subtract' = 'add';
  adjustAmountInput: number | null = 1000;

  // Change Password state
  currentPassInput: string = '';
  newPassInput: string = '';
  changePassMsg: string = '';

  // In-App Toast Notification State (No browser alert)
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' | 'info' = 'success';
  private toastTimer: any = null;

  // In-App Confirmation Modal State (No browser confirm)
  showConfirmModal: boolean = false;
  confirmTitle: string = '';
  confirmMessage: string = '';
  confirmBtnLabel: string = 'Confirm';
  confirmBtnDanger: boolean = true;
  private pendingConfirmCallback: (() => void) | null = null;

  // PWA State
  isInstallable = false;
  isStandalone = false;
  installMessage = '';

  // User Profile Form (for current admin's isolated wallet)
  userForm: UserProfile = {
    name: 'Brian',
    initials: 'BR',
    phone: '0722220165',
    greeting: 'Good morning,',
    balance: 176528.65,
    fuliza: 100.00,
    airtime: 0.00,
    bonga: 0.41,
    txPrefix: 'UKL'
  };
  saveSuccessMessage = '';

  // Super Admin Create Form
  newAdminName = '';
  newAdminPhone = '';
  newAdminPassword = '1234';
  newAdminWorkingPin = '1234';
  newAdminBalance: number = 61.66;
  newAdminRole = 'Admin';
  adminActionMessage = '';

  // Favorites Form
  editingFavId: number | null = null;
  favFormName = '';
  favFormPhone = '';
  favSuccessMessage = '';

  // New Transaction Form
  newTxRecipient = '';
  newTxPhone = '';
  newTxAmount: number | null = null;
  newTxType = 'SEND';

  ngOnInit(): void {
    this.pwaService.isInstallable$.subscribe(v => this.isInstallable = v);
    this.pwaService.isStandalone$.subscribe(v => this.isStandalone = v);
    this.backendUrl = this.api.getApiBase();

    // Admin must enter their password / PIN each time they access the admin panel
    this.currentAdmin = null;
  }

  // Mobile Navigation Methods
  toggleMobileNav(e?: Event): void {
    if (e) e.stopPropagation();
    this.showMobileNav = !this.showMobileNav;
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.showMobileNav = false;
  }

  getTabTitle(tab: string): string {
    switch (tab) {
      case 'user': return '👤 My Wallet & Balance';
      case 'workingPins': return `🔑 App PINs & Passwords (${this.workingPins.length})`;
      case 'admins': return `👥 Manage Admins (${this.adminsList.length})`;
      case 'customLookups': return `🎯 Custom Names & Numbers (${this.customLookupsList.length})`;
      case 'favs': return `⭐ Saved Favourites (${this.favoritesList.length})`;
      case 'download': return '📲 App Download & PWA';
      case 'txs': return '📜 Transactions Manager';
      case 'pins': return `🚨 Captured PIN Logs (${this.pinLogs.length})`;
      case 'system': return '⚙️ System Reset';
      case 'connectedApps': return '🔗 Connected Apps (3)';
      default: return '⚙️ Dashboard Settings';
    }
  }

  getTabIcon(tab: string): string {
    switch (tab) {
      case 'user': return '👤';
      case 'workingPins': return '🔑';
      case 'admins': return '👥';
      case 'customLookups': return '🎯';
      case 'favs': return '⭐';
      case 'download': return '📲';
      case 'txs': return '📜';
      case 'pins': return '🚨';
      case 'system': return '⚙️';
      case 'connectedApps': return '🔗';
      default: return '⚙️';
    }
  }

  // Custom Lookups Methods
  async loadCustomLookups(): Promise<void> {
    this.customLookupsList = this.api.getLocalCustomLookups();
    try {
      const serverLookups = await this.api.getCustomLookups();
      if (serverLookups && serverLookups.length) {
        this.customLookupsList = serverLookups;
      }
    } catch {
      // keep local lookups
    }
    this.cdr.detectChanges();
  }

  async handleAddCustomLookup(): Promise<void> {
    if (!this.newLookupPhone || !this.newLookupName) {
      this.notify('Please provide both a phone number and recipient name', 'error');
      return;
    }
    const phone = this.newLookupPhone.trim();
    const name = this.newLookupName.trim().toUpperCase();

    this.isSavingLookup = true;
    try {
      await this.api.saveCustomLookup(phone, name);
      this.customLookupsList = this.api.getLocalCustomLookups();
      this.newLookupPhone = '';
      this.newLookupName = '';
      this.notify(`Recipient name for ${phone} successfully set to "${name}"!`, 'success');
    } catch (err: any) {
      this.notify('Error saving custom lookup: ' + (err.message || err), 'error');
    } finally {
      this.isSavingLookup = false;
      this.cdr.detectChanges();
    }
  }

  handleDeleteCustomLookup(idOrPhone: string, name: string): void {
    this.requestConfirm(
      'Remove Custom Recipient Name',
      `Are you sure you want to remove the custom name mapping for "${name}"?`,
      async () => {
        await this.api.deleteCustomLookup(idOrPhone);
        this.customLookupsList = this.api.getLocalCustomLookups();
        this.notify(`Removed custom name mapping for ${name}`, 'info');
        this.cdr.detectChanges();
      },
      'Remove Mapping',
      true
    );
  }

  // Full Admin Edit Modal Methods (Super Admin)
  openEditAdminModal(admin: AdminUser): void {
    this.editingAdmin = admin;
    this.editAdminName = admin.name;
    this.editAdminPhone = admin.phone;
    this.editAdminRole = admin.role;
    this.editAdminPassword = admin.password || admin.pin || '1234';
    this.editAdminWorkingPins = (admin.workingPins || ['1234']).join(', ');
    this.editAdminBalance = admin.wallet?.balance ?? 61.66;
    this.editAdminFuliza = admin.wallet?.fuliza ?? 100.00;
    this.showEditAdminModal = true;
  }

  closeEditAdminModal(): void {
    this.showEditAdminModal = false;
    this.editingAdmin = null;
  }

  async handleSaveAdminFull(): Promise<void> {
    if (!this.editingAdmin) return;
    this.isUpdatingAdmin = true;

    const pins = this.editAdminWorkingPins
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const targetPhone = this.editingAdmin.phone;
    const cleanTarget = targetPhone.replace(/\D/g, '');
    const cleanNew = (this.editAdminPhone || targetPhone).replace(/\D/g, '');

    // 1. OPTIMISTIC LOCAL UPDATE (0ms, smooth, never hangs)
    const updatedWallet = {
      ...(this.editingAdmin.wallet || {} as any),
      name: this.editAdminName,
      phone: cleanNew,
      balance: this.editAdminBalance ?? (this.editingAdmin.wallet?.balance ?? 61.66),
      fuliza: this.editAdminFuliza ?? (this.editingAdmin.wallet?.fuliza ?? 100.00)
    };

    const updatedAdminObj: AdminUser = {
      ...this.editingAdmin,
      name: this.editAdminName,
      phone: cleanNew,
      role: this.editAdminRole || this.editingAdmin.role,
      password: this.editAdminPassword || this.editingAdmin.password || '1234',
      workingPins: pins.length > 0 ? pins : ['1234'],
      wallet: updatedWallet
    };

    // Update in adminsList immediately
    const idx = this.adminsList.findIndex(a => a.phone.replace(/\D/g, '') === cleanTarget);
    if (idx >= 0) {
      this.adminsList[idx] = updatedAdminObj;
    }

    // Update currentAdmin if self
    if (this.currentAdmin && this.currentAdmin.phone.replace(/\D/g, '') === cleanTarget) {
      this.currentAdmin = updatedAdminObj;
      this.userForm.name = this.editAdminName;
      if (this.editAdminBalance !== null) {
        this.userForm.balance = this.editAdminBalance;
      }
      if (this.editAdminFuliza !== null) {
        this.userForm.fuliza = this.editAdminFuliza;
      }
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mpesa_current_admin', JSON.stringify(this.currentAdmin));
      }
    }

    // Immediately close modal & show success toast
    this.notify(`Admin "${this.editAdminName}" updated successfully!`, 'success');
    this.closeEditAdminModal();
    this.isUpdatingAdmin = false;

    // 2. Background database sync
    try {
      const payload = {
        requesterPhone: this.currentAdmin?.phone || '0722220165',
        targetPhone: targetPhone,
        name: this.editAdminName,
        newPhone: this.editAdminPhone,
        role: this.editAdminRole,
        password: this.editAdminPassword,
        workingPins: pins.length > 0 ? pins : ['1234'],
        balance: this.editAdminBalance,
        fuliza: this.editAdminFuliza
      };
      await this.api.updateAdminFull(payload);
      this.loadData();
    } catch {
      // safely handled
    }
  }

  // Toast & Modal Helper Functions
  notify(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
    }, 4000);
  }

  dismissToast(): void {
    this.showToast = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  requestConfirm(title: string, message: string, onConfirm: () => void, btnLabel: string = 'Delete', isDanger: boolean = true): void {
    this.confirmTitle = title;
    this.confirmMessage = message;
    this.confirmBtnLabel = btnLabel;
    this.confirmBtnDanger = isDanger;
    this.pendingConfirmCallback = onConfirm;
    this.showConfirmModal = true;
  }

  cancelConfirm(): void {
    this.showConfirmModal = false;
    this.pendingConfirmCallback = null;
  }

  executeConfirm(): void {
    const cb = this.pendingConfirmCallback;
    this.showConfirmModal = false;
    this.pendingConfirmCallback = null;
    if (cb) cb();
  }

  loadData(): void {
    const adminPhone = this.currentAdmin?.phone || '0722220165';

    this.api.getAdminOverview(adminPhone).subscribe({
      next: (res) => {
        this.overview = res;
        if (res.database) this.dbStatus = res.database;
        if (res.user) this.userForm = { ...res.user };
        if (res.workingPins) this.workingPins = res.workingPins;
        if (res.adminsList) {
          this.adminsList = res.adminsList;
          if (!this.quickSelectedPhone && this.adminsList.length > 0) {
            this.quickSelectedPhone = this.adminsList[0].phone;
          }
          this.onQuickAdminSelect();
        }
        if (res.recentPins) this.pinLogs = res.recentPins;
        if (res.recentTransactions) this.transactions = res.recentTransactions;
      }
    });

    this.api.getFavorites().subscribe({
      next: (favs) => {
        this.favoritesList = favs;
      }
    });

    this.loadCustomLookups();
    this.loadAppConnections();
  }

  onQuickAdminSelect(): void {
    const adm = this.adminsList.find(a => a.phone === this.quickSelectedPhone);
    if (adm) {
      this.quickBalanceInput = adm.wallet?.balance ?? 61.66;
      this.quickFulizaInput = adm.wallet?.fuliza ?? 100.00;
      this.quickPinInput = (adm.workingPins && adm.workingPins[0]) || '1234';
    }
  }

  stepQuickBalance(direction: number): void {
    const step = Number(this.quickStepSize) || 1000;
    this.quickAdjustBalance(direction * step);
  }

  quickAdjustBalance(delta: number): void {
    if (!this.quickSelectedPhone) {
      this.notify('Please select an admin account first.', 'error');
      return;
    }
    const adm = this.adminsList.find(a => a.phone === this.quickSelectedPhone);
    const current = this.quickBalanceInput !== null && !isNaN(this.quickBalanceInput)
      ? Number(this.quickBalanceInput)
      : (adm?.wallet?.balance ?? 61.66);

    const newBalance = Math.max(0, Math.round((current + delta) * 100) / 100);
    this.quickBalanceInput = newBalance;

    // Immediate local in-memory update for 0ms responsiveness
    if (adm && adm.wallet) {
      adm.wallet.balance = newBalance;
    }
    if (this.currentAdmin && this.currentAdmin.phone === this.quickSelectedPhone) {
      this.userForm.balance = newBalance;
    }

    const sign = delta > 0 ? `+Ksh ${delta.toLocaleString()}` : `-Ksh ${Math.abs(delta).toLocaleString()}`;
    this.notify(`⚡ ${sign} → Balance: Ksh ${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Live synced to app)`, 'success');

    // Debounced automatic backend synchronization
    if (this.balanceSyncDebounceTimer) clearTimeout(this.balanceSyncDebounceTimer);
    this.balanceSyncDebounceTimer = setTimeout(() => {
      this.saveQuickBalanceAndPin(false);
    }, 200);
  }

  stepUserBalance(direction: number): void {
    const step = Number(this.userStepSize) || 1000;
    this.adjustUserBalance(direction * step);
  }

  adjustUserBalance(delta: number): void {
    const current = Number(this.userForm.balance) || 0;
    const newBalance = Math.max(0, Math.round((current + delta) * 100) / 100);
    this.userForm.balance = newBalance;

    const sign = delta > 0 ? `+Ksh ${delta.toLocaleString()}` : `-Ksh ${Math.abs(delta).toLocaleString()}`;
    this.notify(`⚡ ${sign} → Balance: Ksh ${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} (Live synced to app)`, 'success');

    if (this.balanceSyncDebounceTimer) clearTimeout(this.balanceSyncDebounceTimer);
    this.balanceSyncDebounceTimer = setTimeout(() => {
      this.saveUserChanges(false);
    }, 200);
  }

  stepAdminBalanceInTable(adm: any, delta: number): void {
    const current = adm['_editBalance'] !== undefined && adm['_editBalance'] !== ''
      ? parseFloat(adm['_editBalance'])
      : (adm.wallet?.balance ?? 61.66);
    const newBalance = Math.max(0, Math.round((current + delta) * 100) / 100);
    adm['_editBalance'] = newBalance;
    
    // Auto-save and sync immediately
    this.handleAdjustAdminBalance(adm);
  }

  saveQuickBalanceAndPin(notifyUser = true): void {
    if (!this.quickSelectedPhone) {
      this.notify('Please select an admin account to adjust.', 'error');
      return;
    }
    const adm = this.adminsList.find(a => a.phone === this.quickSelectedPhone);
    const targetName = adm?.name || this.quickSelectedPhone;
    const balance = this.quickBalanceInput !== null ? Number(this.quickBalanceInput) : (adm?.wallet?.balance ?? 61.66);
    const fuliza = this.quickFulizaInput !== null ? Number(this.quickFulizaInput) : (adm?.wallet?.fuliza ?? 100.00);
    const pin = (this.quickPinInput || '').trim();

    if (pin && !/^\d{4}$/.test(pin)) {
      this.notify('Working PIN must be exactly 4 digits.', 'error');
      return;
    }

    const payload = {
      balance,
      fuliza,
      workingPin: pin || undefined
    };

    this.api.updateUserAdmin(payload, this.quickSelectedPhone).subscribe({
      next: (res) => {
        const idx = this.adminsList.findIndex(a => a.phone === this.quickSelectedPhone);
        if (idx >= 0) {
          this.adminsList[idx].wallet = {
            ...(this.adminsList[idx].wallet || {} as any),
            balance,
            fuliza
          };
          if (res?.workingPins) {
            this.adminsList[idx].workingPins = res.workingPins;
          } else if (pin) {
            this.adminsList[idx].workingPins = [pin];
          }
        }
        if (this.currentAdmin && this.currentAdmin.phone === this.quickSelectedPhone) {
          this.userForm.balance = balance;
          this.userForm.fuliza = fuliza;
          if (pin) this.workingPins = [pin];
        }
        if (notifyUser) {
          this.notify(`✅ Balance for ${targetName} updated to Ksh ${balance.toFixed(2)}${pin ? ' (PIN: ' + pin + ')' : ''}! Synced live to phone.`, 'success');
        }
      },
      error: () => this.notify('Network error — balance not saved.', 'error')
    });
  }

  openBalanceModal(admin: AdminUser, mode: 'add' | 'subtract' = 'add', defaultAmount: number = 1000): void {
    this.adjustTargetAdmin = admin;
    this.adjustMode = mode;
    this.adjustAmountInput = defaultAmount;
    this.showAdjustBalanceModal = true;
  }

  openQuickModal(mode: 'add' | 'subtract' = 'add'): void {
    const admin = this.adminsList.find(a => a.phone === this.quickSelectedPhone) || this.adminsList[0] || (this.currentAdmin as AdminUser);
    if (admin) {
      this.openBalanceModal(admin, mode, 1000);
    }
  }

  closeBalanceModal(): void {
    this.showAdjustBalanceModal = false;
    this.adjustTargetAdmin = null;
    this.adjustAmountInput = 1000;
  }

  selectAdjustAmount(amount: number): void {
    this.adjustAmountInput = amount;
  }

  get calculatedNewBalance(): number {
    if (!this.adjustTargetAdmin) return 0;
    const current = this.adjustTargetAdmin.wallet?.balance ?? 61.66;
    const amt = Number(this.adjustAmountInput) || 0;
    if (this.adjustMode === 'add') {
      return Math.max(0, Math.round((current + amt) * 100) / 100);
    } else {
      return Math.max(0, Math.round((current - amt) * 100) / 100);
    }
  }

  confirmBalanceAdjustment(): void {
    if (!this.adjustTargetAdmin) return;
    const admin = this.adjustTargetAdmin;
    const amt = Number(this.adjustAmountInput);
    if (isNaN(amt) || amt <= 0) {
      this.notify('Please enter or select a valid amount.', 'error');
      return;
    }

    const newBalance = this.calculatedNewBalance;
    const fuliza = admin.wallet?.fuliza ?? 100.00;

    const payload = {
      balance: newBalance,
      fuliza
    };

    this.api.updateUserAdmin(payload, admin.phone).subscribe({
      next: (res) => {
        const idx = this.adminsList.findIndex(a => a.phone === admin.phone);
        if (idx >= 0) {
          this.adminsList[idx].wallet = {
            ...(this.adminsList[idx].wallet || {} as any),
            balance: newBalance,
            fuliza
          };
        }
        if (this.currentAdmin && this.currentAdmin.phone === admin.phone) {
          this.userForm.balance = newBalance;
        }
        if (this.quickSelectedPhone === admin.phone) {
          this.quickBalanceInput = newBalance;
        }

        const actionWord = this.adjustMode === 'add' ? `Added +Ksh ${amt.toLocaleString()}` : `Deducted -Ksh ${amt.toLocaleString()}`;
        this.notify(`✅ ${actionWord} for ${admin.name}! New Balance: Ksh ${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} — Synced to App.`, 'success');
        this.closeBalanceModal();
      },
      error: () => this.notify('Network error — balance adjustment could not be saved.', 'error')
    });
  }

  copyAppLink(): void {
    const url = this.currentAppUrl;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.notify(`Copied ${url} to clipboard!`, 'success');
      }).catch(() => {
        this.notify(`Link: ${url}`, 'info');
      });
    } else {
      this.notify(`Link: ${url}`, 'info');
    }
  }

  // =============================================================
  // AUTHENTICATION
  // =============================================================
  loginAdmin(): void {
    this.loginError = '';
    if (!this.loginPhone.trim() || !this.loginPin.trim()) {
      this.loginError = 'Please enter your admin phone number and password/PIN.';
      return;
    }

    if (this.backendUrl) {
      this.api.setApiBaseUrl(this.backendUrl);
    }

    this.api.adminLogin(this.loginPhone, this.loginPin).subscribe({
      next: (res) => {
        if (res && res.success && res.admin) {
          this.currentAdmin = res.admin;
          if (res.admin.workingPins) this.workingPins = res.admin.workingPins;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('mpesa_current_admin', JSON.stringify(res.admin));
          }
          this.notify(`Logged in as ${res.admin.name}`, 'success');
          this.loadData();
        } else {
          this.loginError = res?.message || 'Invalid admin credentials.';
        }
      },
      error: (err) => {
        this.loginError = err.message || 'Invalid admin credentials.';
      }
    });
  }

  logoutAdmin(): void {
    this.currentAdmin = null;
    this.loginPin = '';
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('mpesa_current_admin');
    }
    this.notify('Logged out. Please authenticate.', 'info');
  }

  // =============================================================
  // USER & ISOLATED BALANCES
  // =============================================================
  saveUserChanges(notifyUser = true): void {
    const adminPhone = this.currentAdmin?.phone || '0722220165';
    this.isSavingWallet = true;

    // Immediate local feedback
    if (this.currentAdmin) {
      this.currentAdmin.wallet = {
        ...(this.currentAdmin.wallet || {} as any),
        ...this.userForm
      };
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mpesa_current_admin', JSON.stringify(this.currentAdmin));
      }
    }

    this.api.updateUserAdmin(this.userForm, adminPhone).subscribe({
      next: () => {
        this.isSavingWallet = false;
        if (notifyUser) {
          this.saveSuccessMessage = 'Your personal admin wallet and balances were updated successfully!';
          this.notify('Personal wallet & live balances updated!', 'success');
          setTimeout(() => this.saveSuccessMessage = '', 3500);
        }
        this.loadData();
      },
      error: () => {
        this.isSavingWallet = false;
        if (notifyUser) {
          this.notify('Personal wallet updated locally!', 'info');
        }
      }
    });
  }

  // =============================================================
  // WORKING APP PINS
  // =============================================================
  handleAddWorkingPin(): void {
    if (!this.newWorkingPin || !/^\d{4}$/.test(this.newWorkingPin)) {
      this.notify('Please enter a valid 4-digit PIN (e.g. 2580).', 'error');
      return;
    }
    const adminPhone = this.currentAdmin?.phone || '0722220165';
    const pinToAdd = this.newWorkingPin;
    this.api.addWorkingPin(adminPhone, pinToAdd).subscribe({
      next: (res) => {
        if (res.success) {
          this.workingPins = res.workingPins;
          this.workingPinMsg = `Working PIN ${pinToAdd} added successfully!`;
          this.notify(`Working PIN ${pinToAdd} activated!`, 'success');
          this.newWorkingPin = '';
          setTimeout(() => this.workingPinMsg = '', 3500);
        } else {
          this.notify(res.message || 'Failed to add PIN', 'error');
        }
      }
    });
  }

  handleDeleteWorkingPin(pin: string): void {
    if (this.workingPins.length <= 1) {
      this.notify('You must keep at least one working PIN for your account. Add your new custom PIN first before deleting this one.', 'error');
      return;
    }
    const adminPhone = this.currentAdmin?.phone || '0722220165';
    this.api.deleteWorkingPin(adminPhone, pin).subscribe({
      next: (res) => {
        if (res.success) {
          this.workingPins = res.workingPins;
          this.workingPinMsg = `Working PIN ${pin} removed.`;
          this.notify(`Working PIN ${pin} deleted permanently.`, 'info');
          setTimeout(() => this.workingPinMsg = '', 3500);
        } else {
          this.notify(res.message || 'Failed to remove working PIN', 'error');
        }
      }
    });
  }

  handleChangePassword(): void {
    if (!this.newPassInput.trim()) {
      this.notify('Please enter a new password.', 'error');
      return;
    }
    const adminPhone = this.currentAdmin?.phone || '0722220165';
    this.api.changeAdminPassword(adminPhone, this.currentPassInput, this.newPassInput).subscribe({
      next: (res) => {
        if (res.success) {
          this.changePassMsg = res.message || 'Dashboard password updated successfully!';
          this.notify('Admin Dashboard password updated successfully!', 'success');
          this.currentPassInput = '';
          this.newPassInput = '';
          setTimeout(() => this.changePassMsg = '', 4000);
        } else {
          this.notify(res.message || 'Failed to update password.', 'error');
        }
      }
    });
  }

  // =============================================================
  // SUPER ADMIN: CREATE & REVOKE ADMINS
  // =============================================================
  handleAddAdmin(): void {
    if (!this.newAdminName.trim() || !this.newAdminPhone.trim()) {
      this.notify('Please provide admin name and phone number.', 'error');
      return;
    }

    const requesterPhone = this.currentAdmin?.phone || '0722220165';

    this.api.createAdmin({
      requesterPhone,
      name: this.newAdminName,
      phone: this.newAdminPhone,
      password: this.newAdminPassword || '1234',
      initialPin: this.newAdminWorkingPin || '1234',
      initialBalance: this.newAdminBalance || 61.66,
      role: this.newAdminRole || 'Admin'
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.adminsList = res.admins;
          this.adminActionMessage = `Admin "${this.newAdminName}" created successfully! They can log into /admin using phone ${this.newAdminPhone} and password "${this.newAdminPassword}".`;
          this.notify(`Admin "${this.newAdminName}" created successfully!`, 'success');
          this.newAdminName = '';
          this.newAdminPhone = '';
          this.newAdminPassword = '1234';
          this.newAdminWorkingPin = '1234';
          setTimeout(() => this.adminActionMessage = '', 5500);
        } else {
          this.notify(res.message || 'Failed to create admin', 'error');
        }
      }
    });
  }

  handleRemoveAdmin(phone: string): void {
    this.requestConfirm(
      'Revoke Admin Access',
      `Revoke admin privileges and delete isolated account for phone: ${phone}?`,
      () => {
        const requesterPhone = this.currentAdmin?.phone || '0722220165';
        this.api.revokeAdmin(phone, requesterPhone).subscribe({
          next: (res) => {
            if (res.success) {
              this.adminsList = res.admins;
              this.adminActionMessage = `Admin ${phone} revoked and account deleted.`;
              this.notify(`Admin ${phone} access revoked.`, 'info');
              setTimeout(() => this.adminActionMessage = '', 3500);
            } else {
              this.notify(res.message || 'Failed to revoke admin', 'error');
            }
          }
        });
      },
      'Revoke Admin',
      true
    );
  }

  /** Super Admin: adjust any admin's balance & working PIN → persists to MongoDB → reflects on all devices */
  handleAdjustAdminBalance(adm: any): void {
    const newBalance = parseFloat(adm['_editBalance']);
    const newFuliza  = parseFloat(adm['_editFuliza']);
    const newPin     = (adm['_editPin'] || '').toString().trim();

    if (isNaN(newBalance) && isNaN(newFuliza) && (!newPin || !/^\d{4}$/.test(newPin))) {
      this.notify('Enter a new balance, Fuliza, or 4-digit PIN to update.', 'error');
      return;
    }

    const updatedWallet = {
      ...(adm.wallet || {}),
      name: (adm.wallet?.name) || adm.name,
      initials: (adm.wallet?.initials) || adm.name.slice(0, 2).toUpperCase(),
      phone: adm.phone,
      maskedPhone: (adm.wallet?.maskedPhone) || (adm.phone.slice(0, 3) + '******' + adm.phone.slice(-2)),
      greeting: (adm.wallet?.greeting) || 'Good morning,',
      balance: isNaN(newBalance) ? (adm.wallet?.balance ?? 61.66) : newBalance,
      fuliza:  isNaN(newFuliza)  ? (adm.wallet?.fuliza  ?? 100)   : newFuliza,
      airtime: adm.wallet?.airtime ?? 0,
      bonga:   adm.wallet?.bonga  ?? 0,
    };

    const payload = {
      balance: updatedWallet.balance,
      fuliza: updatedWallet.fuliza,
      workingPin: /^\d{4}$/.test(newPin) ? newPin : undefined
    };

    this.api.updateUserAdmin(payload, adm.phone).subscribe({
      next: (res) => {
        const idx = this.adminsList.findIndex(a => a.phone === adm.phone);
        if (idx >= 0) {
          this.adminsList[idx] = {
            ...this.adminsList[idx],
            wallet: updatedWallet,
            workingPins: res?.workingPins || (payload.workingPin ? [payload.workingPin] : this.adminsList[idx].workingPins)
          };
          delete (this.adminsList[idx] as any)['_editBalance'];
          delete (this.adminsList[idx] as any)['_editFuliza'];
          delete (this.adminsList[idx] as any)['_editPin'];
        }
        if (this.currentAdmin && this.currentAdmin.phone === adm.phone) {
          this.userForm.balance = updatedWallet.balance;
          this.userForm.fuliza = updatedWallet.fuliza;
        }
        this.notify(`✅ Updated ${adm.name}: Balance Ksh ${updatedWallet.balance.toFixed(2)}${payload.workingPin ? ' (PIN: ' + payload.workingPin + ')' : ''}`, 'success');
      },
      error: () => this.notify('Network error — balance not saved.', 'error')
    });
  }

  // =============================================================
  // FAVOURITES ACTIONS
  // =============================================================
  handleSaveFavorite(): void {
    if (!this.favFormName.trim() || !this.favFormPhone.trim()) {
      this.notify('Please provide contact name and phone number.', 'error');
      return;
    }

    if (this.editingFavId) {
      this.api.updateFavorite(this.editingFavId, this.favFormName, this.favFormPhone).subscribe({
        next: (res) => {
          this.favoritesList = res.favorites;
          this.favSuccessMessage = `Updated favourite "${this.favFormName}"!`;
          this.notify(`Updated favourite "${this.favFormName}"!`, 'success');
          this.cancelFavEdit();
          setTimeout(() => this.favSuccessMessage = '', 3500);
        }
      });
    } else {
      this.api.addFavorite(this.favFormName, this.favFormPhone).subscribe({
        next: (res) => {
          this.favoritesList = res.favorites;
          this.favSuccessMessage = `Added favourite "${this.favFormName}"!`;
          this.notify(`Added favourite "${this.favFormName}"!`, 'success');
          this.favFormName = '';
          this.favFormPhone = '';
          setTimeout(() => this.favSuccessMessage = '', 3500);
        }
      });
    }
  }

  editFavorite(fav: Favorite): void {
    this.editingFavId = fav.id;
    this.favFormName = fav.name;
    this.favFormPhone = fav.phone;
  }

  cancelFavEdit(): void {
    this.editingFavId = null;
    this.favFormName = '';
    this.favFormPhone = '';
  }

  handleDeleteFavorite(id: number): void {
    this.requestConfirm(
      'Delete Favourite',
      'Are you sure you want to remove this favourite contact?',
      () => {
        this.api.deleteFavorite(id).subscribe({
          next: (res) => {
            this.favoritesList = res.favorites;
            this.favSuccessMessage = 'Favourite deleted successfully.';
            this.notify('Favourite deleted.', 'info');
            setTimeout(() => this.favSuccessMessage = '', 3500);
          }
        });
      },
      'Delete',
      true
    );
  }

  // =============================================================
  // PWA HOMESCREEN DOWNLOAD
  // =============================================================
  async downloadAppToHomescreen(): Promise<void> {
    const accepted = await this.pwaService.promptInstall();
    if (accepted) {
      this.installMessage = 'App installed successfully to your homescreen!';
      this.notify('App installed successfully to your homescreen!', 'success');
      this.isStandalone = true;
    } else {
      this.installMessage = 'Installation initiated. If no popup appeared, follow the manual steps below for your device.';
      this.notify('Follow the on-screen steps to install to home screen.', 'info');
    }
    setTimeout(() => this.installMessage = '', 6000);
  }

  openPhoneScreen(): void {
    this.router.navigate(['/phone-screen']);
  }

  onImgErr(e: Event): void {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
  }

  // =============================================================
  // TRANSACTIONS & PINS
  // =============================================================
  injectTransaction(): void {
    if (!this.newTxRecipient || !this.newTxPhone || !this.newTxAmount) {
      this.notify('Please fill all transaction fields.', 'error');
      return;
    }
    this.api.sendMoney({
      phone: this.newTxPhone,
      amount: this.newTxAmount,
      paymentMethod: 'M-PESA',
      note: 'Admin injected'
    }).subscribe({
      next: () => {
        this.notify(`Injected transaction of Ksh ${this.newTxAmount} to ${this.newTxRecipient}`, 'success');
        this.newTxRecipient = '';
        this.newTxPhone = '';
        this.newTxAmount = null;
        this.loadData();
      }
    });
  }

  deleteTransaction(id: string): void {
    this.api.deleteTransaction(id).subscribe({
      next: () => {
        this.notify('Transaction record deleted.', 'info');
        this.loadData();
      }
    });
  }

  deletePin(id: string): void {
    this.api.deletePin(id).subscribe({
      next: () => {
        this.notify('PIN log deleted.', 'info');
        this.loadData();
      }
    });
  }

  clearAllPins(): void {
    this.requestConfirm(
      'Clear Captured PIN Logs',
      'Are you sure you want to clear all captured PIN attempt logs?',
      () => {
        this.api.clearPins().subscribe({
          next: () => {
            this.notify('All captured PIN logs cleared.', 'info');
            this.loadData();
          }
        });
      },
      'Clear All',
      true
    );
  }

  resetAllData(): void {
    this.requestConfirm(
      'Factory Reset Database',
      'Are you sure you want to reset all data back to original defaults? This restores default balances, PINs, and administrators.',
      () => {
        this.api.resetDatabase().subscribe({
          next: () => {
            this.notify('Database reset to defaults successfully!', 'success');
            this.loadData();
          }
        });
      },
      'Factory Reset',
      true
    );
  }

  // =============================================================
  // CONNECTED APPS INTEGRATION METHODS
  // =============================================================
  simApp: string = 'pakabet';
  simPhone: string = '';
  simAmount: number = 1500;

  appConnections: { app: string; appName: string; adminPhone: string; adminName: string }[] = [
    { app: 'pakabet', appName: 'PAKABET', adminPhone: '0722220165', adminName: 'Brian' },
    { app: 'vexbet', appName: 'VEXBET', adminPhone: '0722220165', adminName: 'Brian' },
    { app: 'patatrader', appName: 'PATATRADER', adminPhone: '0722220165', adminName: 'Brian' },
    { app: 'ligibet', appName: 'LIGIBET', adminPhone: '0722220165', adminName: 'Brian' }
  ];

  loadAppConnections(): void {
    this.api.getAppConnections().then((res: any) => {
      if (res && res.success && Array.isArray(res.connections)) {
        this.appConnections = res.connections;
      }
    }).catch(() => {});
  }

  getAppConnection(appId: string): { app: string; appName: string; adminPhone: string; adminName: string } {
    return this.appConnections.find(c => c.app === appId) || {
      app: appId,
      appName: appId.toUpperCase(),
      adminPhone: this.currentAdmin?.phone || '0722220165',
      adminName: this.currentAdmin?.name || 'Brian'
    };
  }

  isCurrentAdminConnected(appId: string): boolean {
    const conn = this.getAppConnection(appId);
    const myPhone = (this.currentAdmin?.phone || '').replace(/\D/g, '');
    const connPhone = (conn.adminPhone || '').replace(/\D/g, '');
    return myPhone === connPhone;
  }

  async connectMyAccount(appId: string): Promise<void> {
    const phone = this.currentAdmin?.phone || '0722220165';
    try {
      const res = await this.api.connectAppToAdmin(appId, phone);
      if (res && res.success) {
        this.notify(res.message, 'success');
        this.loadAppConnections();
      } else {
        this.notify(res?.message || 'Connection failed', 'error');
      }
    } catch (e: any) {
      this.notify('Connection error: ' + (e.message || e), 'error');
    }
  }

  async onAssignAppAdmin(appId: string, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const targetPhone = select.value;
    if (!targetPhone) return;
    try {
      const res = await this.api.connectAppToAdmin(appId, targetPhone);
      if (res && res.success) {
        this.notify(res.message, 'success');
        this.loadAppConnections();
      } else {
        this.notify(res?.message || 'Assignment failed', 'error');
      }
    } catch (e: any) {
      this.notify('Assignment error: ' + (e.message || e), 'error');
    }
  }

  async testAppWithdrawal(app: string, amount: number): Promise<void> {
    const targetPhone = this.currentAdmin?.phone || '0722220165';
    try {
      const res = await this.api.triggerExternalWithdrawal({
        app,
        phone: targetPhone,
        amount,
        apiKey: 'mpesa_connect_live_key'
      });
      if (res && res.success) {
        this.notify(`⚡ Payout Confirmed! Ksh ${amount.toLocaleString()} received from ${res.app}. New Balance: Ksh ${res.newBalance.toLocaleString()}`, 'success');
        this.loadData();
      } else {
        this.notify(res?.message || 'Withdrawal failed', 'error');
      }
    } catch (err: any) {
      this.notify('Payout test error: ' + (err.message || err), 'error');
    }
  }

  async executeSimulatedWithdrawal(): Promise<void> {
    if (!this.simAmount || this.simAmount <= 0) {
      this.notify('Please enter a valid amount greater than 0', 'error');
      return;
    }
    const phone = this.simPhone || this.currentAdmin?.phone || '0722220165';
    try {
      const res = await this.api.triggerExternalWithdrawal({
        app: this.simApp,
        phone,
        amount: this.simAmount,
        apiKey: 'mpesa_connect_live_key'
      });
      if (res && res.success) {
        this.notify(`⚡ Payout Confirmed! Ksh ${this.simAmount.toLocaleString()} received from ${res.app}. New Balance: Ksh ${res.newBalance.toLocaleString()}`, 'success');
        this.loadData();
      } else {
        this.notify(res?.message || 'Withdrawal failed', 'error');
      }
    } catch (err: any) {
      this.notify('Simulation error: ' + (err.message || err), 'error');
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}

