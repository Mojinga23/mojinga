# Mobile Wallet Interface Demo (PWA)

A mobile Progressive Web App (PWA) that demonstrates a dark wallet interface and its associated screen flow.

Built with an **Angular 22 standalone frontend**, local in-memory demo state, and **PWA configuration** for downloading directly from Chrome on mobile devices.

---

## 📱 Mobile Screen Flow

1. **Splash Screen (Image 1)**
   - Authentic dark theme with centered `Safaricom | m-pesa` brand logo.
   - Android mobile status bar matching exact time and icons.
   - Smooth auto-transition (or tap) to the M-PESA PIN keypad.

2. **M-PESA PIN Entry Screen (Pre-Home Authentication)**
   - Authentic 4-digit PIN keypad screen with masked dots.
   - Greeting: *"Welcome back, Regarn"* with verified RO avatar badge.
   - Biometric fingerprint button, numeric keypad (1-9, 0, backspace).
   - Local-only keypad interaction. PIN entries are never retained.

3. **Main Interface Dashboard (Image 2)**
   - Top bar: Verified RO avatar badge, *"Good morning, Regarn 👋"*, notification bell with active red badge, search button.
   - Balance Carousel:
     - **M-PESA Balance**: *"Ksh 61.66"* with eye-slash toggle (hide/show balance).
     - **Available Fuliza**: *"Ksh 100.00"*.
     - **[ View Statements ]** button opening real statement history.
     - Peeking *"Airtime Ksh. 0"* card with carousel indicators.
   - **Quick Actions (8 items)**:
     - `Send Money` (navigates to Send Money flow)
     - `Lipa na M-PESA`
     - `Withdraw Money`
     - `Pochi Wallet`
     - `Buy Bundles`
     - `Airtime Top Up`
     - `Tunukiwa Bundles`
     - `Home Internet`
   - **Frequents Accordion**:
     - Filter pills: `Apps` (active green), `Send`, `Pay`, `Bundles`.
     - `M-Pesa Visa Card(Glob...` item card.
   - **Floating Customer Care Avatar**: Circular support agent avatar on the right.
   - **Explore & Discover Deals 🔥**: Orange banner (*"Watch Ads, An... Simple Questions &..."*).
   - **Floating "Scan to pay" Button**: Dark pill with green/red QR icon at bottom right.

4. **Send Money Screen (Image 3)**
   - Header with `<` back arrow and *"Send Money"* title.
   - Tabs: `Mobile number` (active green) vs `Pochi la Biashara` (dark grey).
   - **Favourites**: `(+) Add` button and quick contact shortcuts.
   - **Enter Phone Number**: Input field with contact book and QR scanner icons.
   - **Enter Amount**: Input field with `Ksh` suffix and dynamic balance/fuliza helper.
   - **Select Payment Method**:
     - `M-PESA` (selected with green border and checkmark badge, showing live balance).
     - `Shiriki Pay` (with green 'S' avatar).
   - **Continue Button**: Activates when valid phone and amount are entered.
   - **PIN Confirmation Modal**: Prompts for 4-digit PIN verification.
   - **Functional Transaction Processing**:
     - Deducts balance (or applies Fuliza if balance is insufficient).
     - Generates authentic M-PESA transaction ID (e.g. `TI5C8UM9DV`).
     - Displays full **Success Receipt** and simulated **M-PESA SMS Notification**.
   - **Do More Grid**: `Send to Many`, `Request Money`, `International Transfers`.

5. **Admin Control Panel (`/admin`)**
   - Accessible at `http://localhost:4200/admin` or by clicking the user avatar in the header.
   - **User & Balance Editor**: Change user name, avatar initials, phone, M-PESA balance, Fuliza limit, and airtime.
   - **PIN status**: Displays no stored PINs; the demo never captures them.
   - **Transaction Manager**: View or reset this browser tab's demo transactions.
   - **System Reset**: 1-click restore to original defaults.

---

## Netlify frontend deployment

Netlify builds the Angular application from `frontend` using Node.js 24 and publishes `frontend/dist/frontend/browser`. The repository's `netlify.toml` configures these settings. The build command explicitly launches Node.js 24.15.0 through `npm exec` so CLI-driven deployments use a compatible runtime even when their parent process still uses Node.js 20. Within that runtime, it runs `npm ci --include=dev` using the committed frontend lockfile before running the production build, ensuring Angular CLI and the compiler are available even when the deployment runner skips dependency installation or omits development dependencies.

The frontend's `public/_redirects` file is copied into the published output so routes such as `/home`, `/send-money`, and `/admin` work when opened directly or refreshed. The HTML entry point and service worker are configured to revalidate so browsers can pick up new deployments.

Build errors fail the deployment rather than falling back to checked-in build output. Netlify generates the production output from the current source on each deployment.

This deploys the frontend only. The existing frontend still uses the separately hosted API at `https://api.threeapp.site` unless overridden in the application. API availability and its CORS configuration must support the Netlify site origin for backend features to work.

## 🚀 How to Run

### Start the Application
In the project root directory:
```bash
npm start
```
The Angular dev server will start at:
👉 **`http://localhost:4200`**

Open `http://localhost:4200` in Google Chrome:
- On mobile devices, it displays 100% full-screen native mobile.
- On desktop, it displays an authentic phone frame mockup with a toggle to test in full screen.

### 2. Download / Install as PWA in Chrome
1. Open `http://localhost:3000` on Chrome (on your mobile phone or desktop).
2. Chrome will show the **"Install M-PESA"** banner at the top.
3. Tap **Install** (or Chrome menu `⋮` -> **"Install app"** / **"Add to Home screen"**).
4. The app will be downloaded to your phone's home screen with the M-PESA app icon and launch as a standalone native app without browser URL bars!

---

## 🗄️ Local Demo Data

The interface runs without a server or database. Balances, favourites, and receipts are stored only while the page remains open and reset when it reloads.

---

## 🌐 Domain & Environment Configuration

This clone is configured for **`threeapp.site`**:
- **Frontend App**: `https://threeapp.site` / `https://www.threeapp.site`
- **Backend API**: `https://api.threeapp.site` (with automatic fallback to localhost during development)
- **CORS Support**: `threeapp.site`, `api.threeapp.site`, connected applications, and configurable origins via `ALLOWED_ORIGINS` / `FRONTEND_URL`.

### Environment Setup (`.env`)
Copy `.env.example` to `.env`:
```bash
PORT=3000
MONGODB_URI=your_mongodb_connection_uri_here
APP_DOMAIN=threeapp.site
API_DOMAIN=api.threeapp.site
FRONTEND_URL=https://threeapp.site
ALLOWED_ORIGINS=https://threeapp.site,https://www.threeapp.site,https://api.threeapp.site
NODE_ENV=production
```

---

## 🧪 Automated Tests

Run the Angular test suite with:
```bash
npm test
```

