# TSL — Hair Production Tracking System

React + Tailwind frontend | Google Apps Script API | Google Sheets database

---

## Quick Start

### 1. Configure environment
Copy `.env` and fill in your values:
```
REACT_APP_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
REACT_APP_SPREADSHEET_ID=YOUR_SPREADSHEET_ID
```

### 2. Deploy the Apps Script backend
1. Open your Google Sheet → **Extensions → Apps Script**
2. Rename project to `TSL_API`
3. Paste the contents of `apps-script/Code.gs` into the editor
4. Go to **Project Settings** → paste `apps-script/appsscript.json` into the manifest
5. In Script Properties, add: `SPREADSHEET_ID` = your Sheet ID
6. Click **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the Web App URL → paste into `.env` as `REACT_APP_SCRIPT_URL`
8. Set up two time-driven triggers manually:
   - `flushAlertEmails` → every 30 minutes
   - `runDailyChecks` → daily at 12:00

### 3. Run locally
```bash
npm install
npm start
```

### 4. Deploy to Vercel
```bash
git init && git add . && git commit -m "Initial TSL build"
# Push to GitHub, then import repo in vercel.com
# Add environment variable: REACT_APP_SCRIPT_URL
```

---

## Project Structure

```
tsl/
├── apps-script/
│   ├── Code.gs              # Full backend API
│   └── appsscript.json      # Apps Script manifest
├── public/
│   └── index.html
├── src/
│   ├── App.jsx              # Router + shell
│   ├── index.js / index.css
│   ├── components/
│   │   ├── layout/          # Sidebar, TopBar, PageLayout
│   │   ├── modules/         # ProdForm, ProdTable, InventoryTable
│   │   └── ui/              # Button, Input, Select, Card, Table,
│   │                        # Badge, Modal, Toast, Spinner
│   ├── hooks/
│   │   ├── useAdminAuth.js  # Login, lockout, session token
│   │   └── useOnlineStatus.js # Offline banner, queue flush
│   ├── lib/
│   │   ├── api.js           # All Apps Script calls + offline queue
│   │   ├── constants.js     # WHY_OPTIONS, TEAMS, SHEETS, etc.
│   │   └── utils.js         # Dates, CSV export, label print, cx()
│   └── pages/
│       ├── Home.jsx         # KPI table + activity widgets
│       ├── ReXI.jsx         # Prod + Inventory
│       ├── Lab.jsx          # Prod + Inventory
│       ├── Ventilation.jsx  # Prod + Inventory
│       ├── TailorMS.jsx     # Prod + Tailor Inv + MS Inventory
│       ├── Stylist.jsx      # Prod + Inventory
│       ├── FinalProd.jsx    # Prod + Inventory
│       ├── Analytics.jsx    # Filters + Hair ID trace + CSV export
│       ├── Admin.jsx        # All config tabs + Audit Trail
│       └── SetupWizard.jsx  # 10-step first-run setup
├── .env                     # REACT_APP_SCRIPT_URL (never commit)
├── .gitignore
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vercel.json
```

---

## Google Sheets — Required Tabs

Create these 16 tabs exactly as named (case-sensitive):

| Tab | Purpose |
|-----|---------|
| ReXI_Prod | Raw hair entries |
| Lab_Prod | Lab processing entries |
| Ventilation_Prod | Ventilation entries |
| TailorMS_Prod | Tailor + Machine Sewer shared prod |
| Stylist_Prod | Stylist entries |
| Final_Prod | Dispatch entries |
| ReXI_Inventory | Auto-calculated |
| Lab_Inventory | Auto-calculated |
| Ventilation_Inventory | Auto-calculated |
| Tailor_Inventory | Auto-calculated |
| MachineSewer_Inventory | Auto-calculated |
| Stylist_Inventory | Auto-calculated |
| Final_Inventory | Auto-calculated |
| Audit_Trail | Immutable admin log |
| Config_Admin | All system config |
| HairID_Registry | All generated Hair IDs |

---

## Key Behaviours

| Feature | How it works |
|---------|-------------|
| Hair ID generation | On TailorMS Submitted → Apps Script generates `INITIALS-NNNN`, checks registry for uniqueness (LockService), prints label silently |
| Label printing | `window.print()` targeting `#label-print-area`. Thermal printer must be system default |
| Offline queue | localStorage queue, auto-flushes on reconnect with exponential backoff |
| Draft recovery | Forms auto-save to localStorage; on reload, prompts to restore |
| Admin auth | Password checked server-side; session token valid 8 hours; 3 failed attempts = 5 min lockout |
| Mismatch flags | Lab IN vs ReXI OUT, Ventilation IN vs Lab OUT — fires immediately + queued email |
| Stylist balance | Must equal zero; checked on every write + daily at 12:00 |
| Email alerts | Batched every 30 minutes via time-driven trigger (100/day quota safe) |
| Analytics export | Client-side CSV with timestamp in filename |

---

## First Run

On first load TSL redirects to `/setup` (10-step wizard).
After completion, `tsl_setup_done` is set in localStorage and the app loads normally.
All wizard settings are editable from the Admin Dashboard at any time.
