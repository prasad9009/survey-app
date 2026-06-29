# Samarth SurveyOS — Full Codebase Analysis & 16-Day LinkedIn Showcase Plan

---

## ═══════════════════════════════════════
## PART 1 — EVIDENCE-BASED PROJECT ANALYSIS
## ═══════════════════════════════════════

---

## PROJECT OVERVIEW

### 1. Project Name
**Samarth SurveyOS** *(internal app id in `render.yaml`: `samarth-surveyos-api`; PWA name in `vite.config.ts`: `Samarth SurveyOS`; short name: `SurveyOS`)*

### 2. Project Description
A full-stack, multi-user Land Survey Management System built with the MERN stack. It centralises client and site records, field visit documentation, financial ledgers, instrument tracking, invoice generation, and company settings into a single Progressive Web App that works on any device — online or offline.

### 3. Main Business Problem Solved
Land survey firms like **Samarth Land Surveyors** (Bhoinagar Shahapur, Ichalkaranji — 416 121) previously managed clients, site visits, payments, and coworker ledgers manually or across disconnected tools. SurveyOS replaces all of that with one organised, role-gated system that generates professional PDFs on the spot and tracks every rupee.

### 4. Target Users
| Role | Found in code |
|---|---|
| **super_admin** | `User.js` — full access, manages instruments & admins |
| **admin** | `User.js` — instrument-scoped access; creates visits, sees own ledger |
| Account Managers (coworkers) | `AccountManager.js` — financial ledger entities linked to an admin |

### 5. Key Objectives (from PRODUCT_OVERVIEW.md + code)
- One-screen view of all financial KPIs (revenue, received, pending)
- Complete audit trail from client creation → site → visit → invoice → payment
- Professional PDF export for every document type (invoice, report, ledger)
- Offline-capable PWA installable on Android, iOS, and desktop
- Instrument-scoped multi-user access with cascading data isolation

---

## TECHNICAL STACK

### Frontend (`frontend/package.json` + `vite.config.ts`)
| Technology | Version | Evidence |
|---|---|---|
| **React 19** | ^19.2.6 | `package.json` |
| **Vite 7** | ^7.3.3 | `package.json` |
| **TypeScript** | tsconfig files | `.tsx` / `.ts` throughout |
| **TailwindCSS v4** | ^4.2.4 | `package.json`, `@tailwindcss/vite` |
| **React Router v7** | ^7.15.0 | `package.json` |
| **TanStack React Query v5** | ^5.100.13 | `package.json` |
| **React Query Persist Client** | ^5.100.13 | `QueryProvider.tsx` — 7-day localStorage cache |
| **Axios** | ^1.7.9 | `services/http` |
| **jsPDF + jspdf-autotable** | ^4.2.1 / ^5.0.7 | `exportInvoicePdf.ts` etc. |
| **Lucide React** | ^1.14.0 | icon library, seen in `Dashboard.tsx` |
| **Sonner** | ^1.7.1 | toast notifications |
| **vite-plugin-pwa** | ^1.3.0 | `vite.config.ts` — full Workbox config |

### Backend (`backend/package.json` + `server.js`)
| Technology | Version | Evidence |
|---|---|---|
| **Node.js 20+** | `.nvmrc` | engine constraint |
| **Express 4** | ^4.21.0 | `server.js` |
| **Mongoose 8** | ^8.8.0 | all models |
| **bcryptjs** | ^2.4.3 | `authService.js` — 12-round bcrypt |
| **jsonwebtoken** | ^9.0.2 | `utils/token.js` — JWT Bearer tokens |
| **Multer** | ^1.4.5-lts.1 | `routes/index.js` — multipart file upload |
| **sharp** | ^0.34.5 | `uploadService.js` — image optimisation pipeline |
| **Cloudinary SDK v2** | ^2.5.1 | `uploadService.js`, `config/cloudinary.js` |
| **Nodemailer** | ^8.0.7 | `mailService.js` — Brevo SMTP |
| **Zod** | ^3.23.8 | `validations/schemas.js` |
| **Helmet** | ^8.0.0 | `server.js` — HTTP security headers |
| **express-rate-limit** | ^7.4.1 | `middleware/rateLimit.js` |
| **compression** | ^1.8.1 | `server.js` — gzip response compression |

### Database
- **MongoDB Atlas** (production) via Mongoose
- **12 collections** (see Database Analysis section)

### Authentication
- JWT Bearer tokens (HS256) — `utils/token.js`
- bcryptjs 12-round password hashing
- 6-digit time-limited OTP for password reset (10 min TTL, 1 min resend cooldown)
- `crypto.timingSafeEqual` for OTP comparison (timing-attack resistance)
- Role-based access: `super_admin` | `admin`
- Instrument-scoped data isolation per admin

### State Management
- **TanStack React Query v5** — server state, background refetch
- **React Context** — `AuthContext`, `SelectedYearContext`, `RefreshContext`
- **localStorage persist** — 7-day query cache for offline viewing (`QueryProvider.tsx`)

### PWA Implementation (`vite.config.ts`)
- **vite-plugin-pwa** with Workbox v4
- `registerType: 'autoUpdate'` with `skipWaiting: true`
- **Cache strategies**: CacheFirst (assets), NetworkFirst (pages, 3s timeout)
- Offline fallback to `/index.html`
- 192×192 and 512×512 maskable icons
- Install prompt: Chrome (deferred prompt) + iOS (Add to Home Screen hint)
- `OfflineBanner.tsx` — real-time offline detection via `useSyncExternalStore`
- Session snapshot saved to localStorage for offline auth (`authSessionCache.ts`)

### Storage Services
- **Cloudinary** — site visit photos, company logo, invoice signature, invoice stamp, user bank signature, avatar
- **Local memory** (Multer) — temporary buffer before Cloudinary upload

### Email Services
- **Brevo (Sendinblue) SMTP** — password reset OTP emails (`mailService.js`, `nodemailer`)

### PDF / Report Generation (`frontend/src/`)
| File | PDF Type |
|---|---|
| `exportInvoicePdf.ts` | Individual invoice (A4 portrait, watermark, dual bank columns, stamp) |
| `exportInvoicePdf.ts` → `exportCombinedSiteInvoicePdf` | Combined invoice for all visits of a site |
| `exportVisitRecordPdf.ts` | Daily Survey Report (A4 landscape, photo pages, bilingual signature lines) |
| `exportSiteVisitsPdf.ts` | Site Visits list report (A4 portrait, all visits tabular) |
| `exportTransactionsPdf.ts` | Account Manager ledger PDF |
| `exportSiteReportPdf.ts` | Client site report PDF |

### Deployment Platforms
- **Frontend**: Vercel (`vercel.json`, `frontend/.env.example`)
- **Backend**: Render (`render.yaml` — `samarth-surveyos-api`, Node Starter plan, `--max-old-space-size=384`)

### Third-Party Integrations
| Service | Purpose | Evidence |
|---|---|---|
| Cloudinary | Image CDN + storage | `uploadService.js`, `config/cloudinary.js` |
| Brevo SMTP | Transactional email | `mailService.js`, `backend/.env.example` |
| MongoDB Atlas | Cloud database | `backend/.env.example`, `MONGO_URI` |
| Vercel | Frontend hosting | `vercel.json` |
| Render | Backend hosting | `render.yaml` |

---

## MODULE ANALYSIS

### 1. Authentication Module
**Purpose**: Secure access control with multi-role JWT auth and email OTP password reset.

**Main Features**:
- Login by email OR mobile number (phone suffix regex matching) — `authService.js:108–131`
- JWT token sign/verify — `utils/token.js`
- Forgot password → 6-digit OTP → verify OTP → reset password (3-step flow)
- `crypto.timingSafeEqual` OTP comparison
- Rate limiting: 5 reset requests / 15 min per IP; 30 OTP verify attempts / 15 min
- `lastLoginAt` timestamp tracking
- Offline session snapshot (localStorage) for unauthenticated reconnect

**Screens**: Login, Forgot Password, Verify OTP, Reset Password (`pages/`)
**API**: `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/verify-reset-otp`, `POST /auth/reset-password`, `GET /auth/me`, `POST /auth/change-password`
**Collections**: `users`

---

### 2. Dashboard Module
**Purpose**: High-level business KPI overview scoped to the active instrument/year.

**Main Features**:
- 4 stat cards: Total Revenue, Received Amount, Pending Amount, Total Sites
- MongoDB `$facet` aggregate for revenue/received/pending in one query
- Recent 10 site visits table (clickable)
- Top-8 pending clients list (by amount descending)
- Year selector (`SelectedYearContext`) — filters all data by financial year
- Background refresh indicator
- Quick Actions: Add Site, Add Site Visit, View Clients

**API**: `GET /dashboard?year=`
**Collections**: `site_visits`, `clients`, `sites`

---

### 3. Clients & Sites Module
**Purpose**: Manage the full client database with linked survey sites.

**Main Features**:
- Client CRUD (name, phone, email, address, notes, tags)
- Site CRUD per client (name, locationLabel, address, status: active/on_hold/completed)
- GeoJSON coordinates field on Site (`geo.type: Point`)
- `lastVisitAt` auto-updated on every visit create/delete
- Cascading delete: deleting a client → all sites → all visits → all photos → all invoices
- Instrument-scoped filtering (each admin sees only their instrument's data)
- Search/filter/pagination support

**Screens**: `ClientsSites.tsx` (95 KB — largest frontend file)
**API**: `GET/POST /clients`, `PATCH/DELETE /clients/:id`, `GET /clients/:id/report`, `GET/POST /sites`, `PATCH/DELETE /sites/:id`
**Collections**: `clients`, `sites`

---

### 4. Site Visits Module
**Purpose**: Core operational record — every field survey visit is logged here.

**Main Features**:
- Sequential visit codes (format: `SV-4001`, `SV-4002`…) via `Counter` collection
- Per-site 1-based `visitNo` (auto-resolved by date ordering)
- Billing modes: **multi-line** (`billingLines[]` — qty×rate or flat amount) and **legacy single-line**
- Payment statuses: `pending`, `partial`, `paid`, `waived`
- Payment modes: cash / UPI / cheque (free text)
- Photo upload: up to 12 photos per visit, optimised by sharp (max 2200px, JPEG 78%, PNG 82%)
- Drawing reference fields: `dwgRefBy`, `dwgNo`, engineer name, contact person
- `includeDrawingDetails` flag — controls PDF sections
- Credit allocation engine: FIFO credit-to-visit matching on save/delete
- Visit PDF: A4 landscape Daily Survey Report with embedded photos

**Screens**: `SiteDetails.tsx`, `AddSiteVisit.tsx`, `EditSiteVisitModal.tsx`
**API**: `GET/POST /visits`, `POST /visits/with-photos`, `GET /visits/:id`, `PUT /visits/:id`, `DELETE /visits/:id`, `POST /visits/:id/photos`
**Collections**: `site_visits`, `survey_files`, `counters`

---

### 5. Account Manager (Ledger) Module
**Purpose**: Financial ledger tracking debit/credit transactions per coworker.

**Main Features**:
- Each `AccountManager` has a `slug` (URL-safe identifier), linked to an `adminId`
- Transactions: `debit` (expenses) | `credit` (payments) with `occurredOn` date
- Ledger summary: `totalDebit`, `totalCredit`, `netBalance`, `pendingTotal`, `globalPendingTotal`
- Client-site credit allocation: a credit transaction automatically reduces pending on matching site visits (FIFO)
- Cross-admin visibility: admins on the same instrument can read each other's ledgers
- Super-admin can scope view with `?adminId=` query param
- Ledger PDF export with yearly summary, transaction table, debit/credit totals
- Client dropdown for credit transactions — lists clients/sites visible to the manager

**Screens**: `AccountManager.tsx` (80 KB), `AccountManagerSelect.tsx`
**API**: `GET /account-managers`, `GET /account-managers/:slug/accounts`, `GET /account-managers/:slug/client-sites`, `GET/POST /transactions/:slug`, `DELETE /transactions/item/:id`
**Collections**: `account_managers`, `transactions`

---

### 6. Invoice Module
**Purpose**: Generate professional PDF invoices per visit or combined for all visits of a site.

**Main Features**:
- Individual invoice per site visit with billing lines, subtotal, other charges, discount, received deduction, grand total
- **Combined invoice** (`exportCombinedSiteInvoicePdf`) — one invoice covering all visits of a site
- Invoice number auto-derived from visit code (`SV-4006` → `INV-4006`)
- Payment status badge (green "Paid" / red "Unpaid") on PDF header
- **Dual-column bank details panel** (left admin + right admin — coworkers on same instrument)
- Company authorised stamp + bank signature images from Cloudinary
- Logo watermark on every page (0.06 opacity)
- Company header fetched from API, cached 5 min (`max-age=300`)

**Screens**: `Invoice.tsx`, `IndividualInvoiceModal.tsx`
**API**: `GET /settings/invoice-bank-columns`, `GET /settings/invoice-company-header`
**Collections**: `invoices`, `users` (bank details), `companies`

---

### 7. Reports Module
**Purpose**: Filtered view of visit records for reporting purposes.

**Main Features**:
- Filter by: report type, client, site, date range, machine type, search query, status
- Export to PDF (Site Visits Report PDF — tabular, paginated)
- Instrument/year scoping

**Screens**: `Reports.tsx`
**API**: `GET /reports/rows`
**Collections**: `site_visits`

---

### 8. Settings Module
**Purpose**: Company configuration, user profile, instrument management, and admin management.

**Main Features**:
- Company settings: name, legalName, ownerName, contactPhone, email, officeAddress, GST number
- Company branding: logo upload (Cloudinary)
- Invoice defaults: signature upload, stamp upload, footer note, theme
- Storage quota display (25 GB default) — live usage from `SurveyFile` aggregate
- **Data backup snapshot** (`GET /settings/company/backup-export`) — JSON download of company stats
- User profile: fullName, phone, preferences (theme: light/dark/system, language)
- User bank details (account name, number, IFSC, bank, branch, UPI/phone) — used in invoice PDF
- Bank signature upload (Cloudinary) — appears on invoice PDF
- **Admin management** (super_admin only): create admin, activate/deactivate, assign instruments
- Instrument management (super_admin only): create instruments with category, serial number, AMC

**Screens**: `Settings.tsx`
**API**: `GET/PATCH /settings/company`, `GET/PATCH /settings/me`, `POST /settings/me/bank-signature`, `POST /settings/company/logo`, `POST /settings/company/invoice-signature`, `POST /settings/company/invoice-stamp`, `POST/GET /settings/company/backup*`, `GET/POST /admins`, `PATCH /admins/:id/active`, `POST /admins/:id/instruments`, `GET/POST /instruments`
**Collections**: `companies`, `users`, `instruments`, `instrument_assignments`

---

### 9. Instrument Management Module
**Purpose**: Track physical survey instruments and their assignments to admins.

**Main Features**:
- Instrument fields: name, category, serialNumber, status (`operational`/`maintenance`/`retired`), notes, AMC
- AMC (Annual Maintenance Contract): vendor, validUntil, planName — tracked in `AmcRecord`
- Instrument assignment: `InstrumentAssignment` collection with `assignedAt`/`revokedAt`/`isActive`
- Coworkers list per instrument: union of `InstrumentAssignment` + `AccountManager.instrumentId`
- Data isolation: all `clients`, `sites`, `site_visits`, `transactions` are scoped by `instrumentId`

**API**: `GET /instruments`, `GET /instruments/coworkers`, `POST /instruments`, `POST /admins/:id/instruments`
**Collections**: `instruments`, `instrument_assignments`, `amc_records`

---

### 10. File / Storage Module
**Purpose**: Centralised file registry with Cloudinary CDN storage.

**Main Features**:
- `SurveyFile` model: supports providers `cloudinary`, `s3`, `r2`, `local`
- Entity types: `site_visit`, `invoice_attachment`, `invoice_signature`, `invoice_stamp`, `user_avatar`, `user_bank_signature`, `company_branding`, `other`
- image optimisation before upload: max 2200px, MozJPEG 78%, PNG palette 82%
- SHA-256 checksum field on files
- Cascading Cloudinary cleanup on visit/site/client delete (chunked in 100s)
- Storage quota tracking: 25 GB default per company, live usage via aggregate

**Collections**: `files` (SurveyFile)

---

### 11. Super Admin / Company Admin Module
**Purpose**: Platform-level governance for the company (one super_admin per company).

**Main Features**:
- Create admin users with pre-assigned instruments
- Activate/deactivate admin accounts
- Reassign instruments (replaces InstrumentAssignment records, updates AccountManager.instrumentId)
- View all admins with their instrument assignments
- Update company-wide settings and branding
- Download JSON backup snapshot of company data stats

**API**: `GET/POST /admins`, `PATCH /admins/:id/active`, `POST /admins/:id/instruments`
**Collections**: `users`, `instrument_assignments`, `account_managers`

---

### 12. PWA & Offline Module
**Purpose**: Make the app installable and partially functional without internet.

**Main Features**:
- Full Workbox service worker via `vite-plugin-pwa`
- CacheFirst for JS/CSS/icons; NetworkFirst (3s timeout) for HTML pages
- 7-day localStorage query cache (`PersistQueryClientProvider`)
- Offline session snapshot — user stays logged in if network drops
- `OfflineBanner` — real-time no-internet indicator
- `useOnlineStatus` — `useSyncExternalStore` wrapping `navigator.onLine`
- `useOnlineReconnect` — triggers cache refresh on reconnect
- Install prompt: Chrome `beforeinstallprompt` + iOS "Add to Home Screen" hint
- PWA `PwaUpdateToast` — notifies user when a new version is ready
- Portrait orientation locked, standalone display mode, black theme

---

## DATABASE ANALYSIS

### 12 Collections (from `/backend/models/`)

| Collection | Model File | Purpose |
|---|---|---|
| `companies` | `Company.js` | Multi-tenant root entity |
| `users` | `User.js` | Auth users — super_admin / admin |
| `clients` | `Client.js` | Survey clients |
| `sites` | `Site.js` | Survey sites per client |
| `site_visits` | `SiteVisit.js` | Field visit records |
| `account_managers` | `AccountManager.js` | Coworker financial entities |
| `transactions` | `Transaction.js` | Debit/credit ledger entries |
| `invoices` | `Invoice.js` | Formal invoices |
| `instruments` | `Instrument.js` | Survey instruments |
| `instrument_assignments` | `InstrumentAssignment.js` | Admin-instrument mapping |
| `amc_records` | `AmcRecord.js` | Annual maintenance contracts |
| `files` | `SurveyFile.js` | File registry (Cloudinary) |
| `counters` | `Counter.js` | Auto-increment sequences (visit codes) |
| `subscriptions` | `Subscription.js` | Company subscription/plan status |

### Key Fields — SiteVisit (most complex schema)
```
companyId, adminId, instrumentId, clientId, siteId
visitCode (SV-4001…), visitNo (1-based per site)
visitDate, siteAddress, sitePhone, engineerName
dwgRefBy, dwgNo, contactPerson, workDescription
machineLabel, includeDrawingDetails
billingLines[] { particular, quantity, rate, amount }
billingParticular, billingQuantity, billingRate, billingOtherCharges
amount (Decimal128), paidAmount (Decimal128)
paymentMode, paymentStatus (pending/partial/paid/waived)
notes, photoFileIds[], photoUrls[]
accountManagerId, invoiceId
```

### Multi-Tenant Structure
Every document carries `companyId` as the tenant key. All queries are filtered by `companyId` first, then by `instrumentId` (admin scope). This means:
- A company has one or many instruments
- Each instrument is assigned to one or many admins
- Each admin owns their clients/sites/visits/transactions under their instrument
- Admins on the **same instrument** can see each other's data (peer access)

### Instrument Mapping Logic
`InstrumentAssignment` is the pivot between `User` and `Instrument`. On login, `getAllowedInstrumentObjectIds()` resolves the admin's allowed instruments. The `activeInstrumentId` is stored in `tokenStorage` on the client. All service queries use `sharedInstrumentOperationalScope(req)` to build the correct MongoDB filter.

### Credit Allocation Logic (`visitCreditAllocation.js`)
When a `credit` transaction is saved for a site:
1. All site visits for that site are loaded FIFO (oldest first)
2. The credit amount is applied to the `owedAmount` of each visit sequentially
3. `paidAmount` and `paymentStatus` are updated atomically
4. On delete/recompute: all `paidAmount` fields are reset, then all credits replayed

---

## FEATURE ANALYSIS (evidence-based)

| Feature | Evidence Location |
|---|---|
| ✅ Cloudinary photo uploads (up to 12 per visit) | `uploadService.js`, `routes/index.js:244–286` |
| ✅ Image optimisation (sharp — MozJPEG, palette PNG) | `uploadService.js:197–234` |
| ✅ Individual invoice PDF (A4, watermark, bank columns, stamp) | `exportInvoicePdf.ts` |
| ✅ Combined site invoice PDF (all visits in one invoice) | `exportInvoicePdf.ts:600–701` |
| ✅ Daily Survey Report PDF (landscape, A4, photo pages) | `exportVisitRecordPdf.ts` |
| ✅ Site Visits list report PDF | `exportSiteVisitsPdf.ts` |
| ✅ Account Manager ledger PDF | `exportTransactionsPdf.ts` |
| ✅ Client site report PDF | `exportSiteReportPdf.ts` |
| ✅ Amount in words (INR) on visit PDF | `exportVisitRecordPdf.ts:254` — `amountToWordsInr()` |
| ✅ PWA install support (Chrome + iOS) | `InstallPrompt.jsx` |
| ✅ Offline support (service worker + query cache) | `vite.config.ts`, `QueryProvider.tsx` |
| ✅ Offline banner | `OfflineBanner.tsx` |
| ✅ Background cache refresh indicator | `BackgroundRefreshIndicator.tsx` |
| ✅ PWA update toast | `PwaUpdateToast.tsx` |
| ✅ Role-based access (super_admin / admin) | `User.js`, `requireRole.js`, `authService.js` |
| ✅ Instrument-scoped data isolation | `scope.js`, all services |
| ✅ FIFO credit-to-visit allocation | `visitCreditAllocation.js` |
| ✅ Sequential visit codes (SV-4001…) | `visitService.js:17–22`, `Counter.js` |
| ✅ Per-site visit numbering (1-based) | `visitService.js:37–53` |
| ✅ Multi-line billing (qty×rate + flat amounts) | `visitService.js:68–143`, `SiteVisit.js:28–36` |
| ✅ Payment modes: cash/UPI/cheque | `SiteVisit.js`, form fields |
| ✅ Payment statuses: pending/partial/paid/waived | `SiteVisit.js:45–49` |
| ✅ OTP email password reset | `authService.js:327–426`, `mailService.js` |
| ✅ Timing-safe OTP comparison | `authService.js:28–37` |
| ✅ Rate limiting (auth + API + OTP endpoints) | `middleware/rateLimit.js` |
| ✅ Helmet security headers | `server.js:46` |
| ✅ gzip compression | `server.js:45` |
| ✅ Zod schema validation | `validations/schemas.js`, `middleware/validate.js` |
| ✅ Cascading delete (client → sites → visits → photos → invoices) | `clientService.js`, `visitService.js:501–576` |
| ✅ Company data backup (JSON export) | `settingsService.js:329–364`, route `GET /settings/company/backup-export` |
| ✅ Storage quota tracking (25 GB) | `Company.js:37`, `settingsService.js:44–79` |
| ✅ Dual-column bank PDF panel | `settingsService.js:207–241`, `exportInvoicePdf.ts:272–366` |
| ✅ Company GST number on invoices | `Company.js:18`, `settingsService.js:165` |
| ✅ Dashboard year filter | `SelectedYearContext.tsx`, `dashboardService.js` |
| ✅ Financial year scoping | `utils/yearQuery.js` |
| ✅ Pending by client (dashboard card) | `dashboardService.js:88–104` |
| ✅ Search/filter on site visits | `visitService.js`, `Reports.tsx` |
| ✅ Pagination (visits, clients) | `utils/pagination.js`, `parsePagination()` |
| ✅ Drawing reference (DWG Ref By / DWG No) | `SiteVisit.js:19–22` |
| ✅ Instrument AMC tracking | `Instrument.js:19–23`, `AmcRecord.js` |
| ✅ User bank signature upload | `settingsService.js:243–265` |
| ✅ Company logo + invoice stamp upload | `settingsService.js:277–327` |
| ✅ Mobile bottom navigation bar | `Dashboard.tsx:134–141` |
| ✅ Responsive sidebar (desktop) + drawer (mobile) | `Dashboard.tsx:152–314` |
| ✅ Login by phone number (suffix match) | `authService.js:108–131` |
| ✅ Cross-admin shared instrument data | `accountManagerService.js:34–52` |
| ✅ Subscription / plan model | `Subscription.js` |
| ✅ User preferences (theme, language) | `User.js:43–46` |

---

## DEVELOPMENT CHALLENGES

### 1. FIFO Credit Allocation Engine *(most complex business logic)*
**File**: `visitCreditAllocation.js`
**Challenge**: When an account manager records a payment (credit) for a client's site, that payment must automatically reduce the pending balance across multiple past visits — oldest first. On delete or recompute, all `paidAmount` fields are reset and every credit is replayed. This required careful Decimal128 arithmetic, FIFO ordering, and partial payment handling (`partial` status at fractional boundaries).

### 2. Instrument-Scoped Multi-Tenant Access
**Files**: `utils/scope.js`, `utils/instrumentAccess.js`, `utils/instrumentPeers.js`
**Challenge**: Each admin belongs to a company but is assigned to one or more instruments. Data must be partitioned by `(companyId, instrumentId)`. Admins on the **same** instrument are peers and can see each other's clients/ledgers but not other instruments' data. Super admins bypass this with optional `adminId` scoping. This scope-resolution runs on every API request.

### 3. Multi-Line Billing Normalisation
**File**: `visitService.js:68–143` (`normalizeBillingInput`)
**Challenge**: The billing input can arrive as modern multi-line rows (`billingLines[]` with qty×rate or flat amounts), legacy single-line (`billingQuantity × billingRate`), or a direct amount. The normaliser reconciles all three, computes the correct total, serialises a joined description, and stores the canonical representation for PDF rendering.

### 4. Photo Upload Atomicity
**File**: `visitService.js:448–477` (`createVisitWithPhotos`)
**Challenge**: Photos must be uploaded to Cloudinary before the DB row is created. If any upload fails, already-uploaded images must be purged from Cloudinary to avoid orphaned assets. The implementation stages uploads, then creates the visit, and rolls back (Cloudinary delete) on any error.

### 5. Multi-Format PDF Generation
**Files**: `exportInvoicePdf.ts`, `exportVisitRecordPdf.ts`, `exportSiteVisitsPdf.ts`, `exportTransactionsPdf.ts`
**Challenge**: Five different PDF types, each with different layouts (A4 portrait, A4 landscape), logo watermarks, dynamic bank columns per instrument, embedded Cloudinary photos, amount-in-words conversion, and stamp image overlays — all generated client-side with jsPDF + jspdf-autotable.

### 6. PWA Offline-First Session
**Files**: `context/AuthContext.tsx`, `utils/authSessionCache.ts`, `hooks/useOnlineStatus.ts`
**Challenge**: If the device is offline at load time, the app must serve the cached session (user, instruments, managers) from localStorage instead of calling `/api/auth/me`. On reconnect, it must refresh server state and invalidate stale query data without forcing logout.

### 7. Sequential Visit Codes (Race Condition Safe)
**File**: `visitService.js:17–22`, `Counter.js`
**Challenge**: Visit codes (`SV-4001`, `SV-4002`…) must be unique and sequential across concurrent requests. Implemented using MongoDB's `findByIdAndUpdate` with `$inc` (upsert) on a `Counter` document — an atomic operation that prevents duplicate codes even under concurrent writes.

### 8. Security Hardening
- `crypto.timingSafeEqual` for OTP — prevents timing oracle attacks
- Rate limiting: 5 forgot-password / 15 min; 30 OTP verify / 15 min; 50 auth / 15 min; 2000 API / 15 min
- Helmet HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- JWT secret validation at startup (exits if weak in production)
- `passwordHash` field excluded from all queries by default (`select: false`)
- CORS: allows only registered Vercel preview URLs + configured origins

---

## LINKEDIN CONTENT EXTRACTION

### Best Screenshots / Screens to Share
1. **Dashboard** — stat cards (Total Revenue, Received, Pending, Total Sites) + Recent Visits table
2. **Site Visit form** — multi-line billing, photo upload, payment status
3. **Invoice PDF** — professional A4 with logo, dual bank columns, stamp, status badge
4. **Daily Survey Report PDF** — landscape layout with signature lines and photo pages
5. **Account Manager ledger** — debit/credit rows, pending amount, net balance
6. **Settings — Company** — branding, GST, logo, invoice stamp management
7. **PWA install prompt** — app icon, home screen install
8. **Clients & Sites** — client card with linked sites and visit counts
9. **Add Site Visit** — multi-line billing rows with qty × rate fields

### Most Impressive Modules
1. Invoice generation system (individual + combined)
2. FIFO credit allocation engine
3. PWA offline + session persistence
4. Instrument-scoped multi-tenant access

### Most Technical Achievements
- Atomic sequential visit code generation using MongoDB counters
- Client-side PDF engine with watermarks, photos, and dual bank columns
- Image optimisation pipeline (sharp MozJPEG) before Cloudinary upload
- Timing-safe OTP comparison with rate limiting
- 7-day offline query cache with session snapshot persistence

---

## ═══════════════════════════════════════
## PART 2 — 16-DAY LINKEDIN SHOWCASE PLAN
## ═══════════════════════════════════════

---

## EXECUTIVE PROJECT SUMMARY

> I built **Samarth SurveyOS** — a full-stack Progressive Web App that digitises every aspect of a land survey firm's operations. Built with React 19, Node.js, MongoDB, and deployed on Vercel + Render, it replaces paper logs and spreadsheets with a structured, role-gated system that tracks clients, survey sites, field visits, payments, financial ledgers, and generates professional PDFs — all from any device, even offline.

---

## 16-DAY LINKEDIN CONTENT SCHEDULE

---

### 📅 DAY 1 — Project Reveal & Big Picture

**Topic**: Announcing Samarth SurveyOS — My MERN Full-Stack Project

**Post Draft**:
> 🚀 Excited to share a project I've been building — **Samarth SurveyOS**, a Land Survey Management System for Samarth Land Surveyors.
>
> It's a full-stack Progressive Web App that replaces manual record-keeping with a structured digital system covering:
> ✅ Client & site management
> ✅ Field visit tracking with photo uploads
> ✅ Financial ledgers with debit/credit
> ✅ Professional PDF invoice generation
> ✅ Works offline as an installed app
>
> Built with: React 19 · Node.js · Express · MongoDB · Cloudinary · Vercel + Render
>
> Over the next two weeks, I'll be sharing deep dives into every module, technical challenge, and engineering decision. Follow along! 👇
>
> **What's the most complex part of a business management system you've built? Drop it below!**

**Screenshot**: Dashboard with stat cards visible
**Hashtags**: `#MERN #ReactJS #NodeJS #MongoDB #FullStackDevelopment #WebDevelopment #SurveyManagement #OpenToWork #SoftwareDevelopment`

---

### 📅 DAY 2 — Tech Stack Deep Dive

**Topic**: The Technology Choices Behind SurveyOS

**Post Draft**:
> ⚙️ Every architecture decision in Samarth SurveyOS was intentional. Here's what I chose and why:
>
> **Frontend**
> • React 19 + Vite 7 — fastest HMR dev experience
> • TailwindCSS v4 — utility-first, zero CSS file overhead
> • TanStack React Query v5 — server state + 7-day localStorage cache for offline
> • React Router v7 — client-side routing
>
> **Backend**
> • Node.js + Express 4 — fast REST API
> • Mongoose 8 — ODM with Decimal128 for money fields
> • Zod — runtime schema validation on every route
> • Helmet + express-rate-limit — layered security
>
> **Infrastructure**
> • MongoDB Atlas — multi-tenant cloud DB
> • Cloudinary — image CDN + storage (photos, logos, signatures, stamps)
> • Brevo SMTP — transactional email (OTP password reset)
> • Vercel (frontend) + Render (backend) — free tier, production-ready
>
> **Why Decimal128 for money?**
> Floating point arithmetic (0.1 + 0.2 ≠ 0.3) is dangerous for financial fields. MongoDB's Decimal128 type provides exact decimal arithmetic — critical for billing and payment tracking.
>
> **What's your go-to tech stack for business apps?**

**Screenshot**: Backend package.json + vite.config.ts side by side (or architecture diagram)
**Hashtags**: `#TechStack #MERN #TailwindCSS #ReactQuery #MongoDB #Cloudinary #FullStackDeveloper #SoftwareArchitecture`

---

### 📅 DAY 3 — Database Design & Multi-Tenancy

**Topic**: Designing 12 MongoDB Collections for a Multi-Tenant System

**Post Draft**:
> 🗄️ One of the most important decisions in SurveyOS: how to design the database.
>
> **12 Collections, one pattern — every document carries `companyId` as the tenant key.**
>
> The collections:
> `companies` · `users` · `clients` · `sites` · `site_visits`
> `account_managers` · `transactions` · `invoices` · `instruments`
> `instrument_assignments` · `amc_records` · `files` · `counters`
>
> **The multi-tenancy model:**
> Company → has many Instruments → each assigned to Admins → each Admin owns their Clients/Sites/Visits
>
> Admins on the **same instrument** share data (peer access). Different instruments = fully isolated datasets.
>
> **Indexes I added:**
> ```js
> siteVisitSchema.index({ companyId: 1, adminId: 1, instrumentId: 1, visitDate: -1 })
> siteVisitSchema.index({ siteId: 1, visitDate: -1 })
> clientSchema.index({ companyId: 1, adminId: 1, instrumentId: 1, name: 1 })
> ```
>
> Compound indexes on the most frequent query shapes cut response time dramatically on large datasets.
>
> **Have you built multi-tenant apps? How did you handle data isolation?**

**Screenshot**: MongoDB collection diagram / schema view
**Hashtags**: `#MongoDB #DatabaseDesign #MultiTenancy #SoftwareEngineering #BackendDevelopment #DataModeling`

---

### 📅 DAY 4 — Authentication & Security

**Topic**: Building Secure Auth — JWT + OTP + Rate Limiting + Timing-Safe Comparisons

**Post Draft**:
> 🔐 Security isn't an afterthought in SurveyOS — it's in every layer. Here's what I implemented:
>
> **Authentication Flow**
> • Login by email **OR** mobile number (phone suffix regex matching)
> • JWT Bearer tokens with HS256
> • 12-round bcrypt password hashing
>
> **Password Reset (3-step OTP flow)**
> 1. Forgot password → Brevo SMTP sends a 6-digit OTP
> 2. User verifies OTP → server marks `resetOtpVerified: true`
> 3. User sets new password → server clears OTP fields
>
> **Security hardening:**
> • `crypto.timingSafeEqual()` for OTP comparison — prevents timing oracle attacks
> • Rate limiting: 5 reset requests / 15 min (forgot-password), 30 OTP verifies / 15 min
> • Helmet HTTP headers — CSP, HSTS, X-Frame-Options
> • `passwordHash` field uses `select: false` — never returned in queries
> • JWT secret checked at startup; process exits if weak in production
>
> **The `timingSafeEqual` detail**: a string comparison that short-circuits on mismatch leaks timing information. An attacker can guess OTP digits one-by-one. Constant-time comparison closes that door entirely.
>
> **Which security layer do developers skip most often? Comment below!**

**Screenshot**: Auth flow diagram or forgot-password screen
**Hashtags**: `#WebSecurity #Authentication #JWT #NodeJS #SecureCoding #CyberSecurity #BackendDevelopment`

---

### 📅 DAY 5 — Dashboard Module

**Topic**: Building a Real-Time Business Dashboard with MongoDB Aggregation

**Post Draft**:
> 📊 The SurveyOS Dashboard gives the business owner one screen to understand their financial health.
>
> **What it shows:**
> • Total Revenue (this financial year)
> • Received Amount
> • Pending Amount
> • Total Sites & Clients
> • Recent 10 site visits (clickable)
> • Top 8 clients with pending balances
>
> **The clever part — one MongoDB `$facet` aggregate does all the heavy lifting:**
> ```js
> SiteVisit.aggregate([
>   { $match: { companyId, ...instrumentScope, visitDate: yearRange } },
>   { $addFields: { amountNum: { $toDouble: '$amount' }, receivedNum: receivedAmountExpr() } },
>   { $facet: {
>       totals: [{ $group: { _id: null, totalRevenue: { $sum: '$amountNum' }, received: { $sum: '$receivedNum' } } }],
>       byClient: [{ $group: { _id: '$clientId', revenue: { $sum: '$amountNum' }, received: { $sum: '$receivedNum' } } }, { $match: { pending: { $gt: 0 } } }, { $sort: { pending: -1 } }, { $limit: 50 }]
>   }}
> ])
> ```
>
> One query returns totals AND the top pending clients simultaneously.
>
> **Year filter**: select any financial year from a dropdown — all cards, tables, and PDFs update accordingly.
>
> **What dashboard metric would you add first to a survey business?**

**Screenshot**: Dashboard with stat cards + recent visits + pending clients list
**Hashtags**: `#Dashboard #MongoDB #Aggregation #ReactJS #FullStackDevelopment #BusinessIntelligence #DataVisualization`

---

### 📅 DAY 6 — Client & Site Management

**Topic**: CRUD With Cascading Deletes — Managing Clients & Sites in SurveyOS

**Post Draft**:
> 👥 The Clients & Sites module is the backbone of SurveyOS. Every survey starts here.
>
> **Client fields**: name, phone, email, address, notes, tags (array)
> **Site fields**: name, locationLabel, address, status (active/on_hold/completed), GeoJSON coordinates, `lastVisitAt`
>
> **The `lastVisitAt` pattern:**
> Every time a visit is created, edited, or deleted, the parent site's `lastVisitAt` is auto-updated. This gives a real-time "last activity" indicator per site without querying the visits collection separately.
>
> **Cascading delete:**
> When a client is deleted → all their sites are deleted → all site visits are deleted → all photos are removed from Cloudinary → all linked invoices and transactions are removed.
>
> This cascade is implemented transactionally to avoid orphaned data in any collection.
>
> **Instrument scoping:**
> Each client/site is tagged with `companyId + adminId + instrumentId`. An admin can only see records scoped to their active instrument. A super-admin can see all.
>
> **What's your approach to cascading deletes in MongoDB? Comment below!**

**Screenshot**: Clients & Sites page showing client list with site expansion
**Hashtags**: `#MERN #MongoDB #CRUDOperations #DatabaseDesign #FullStackDevelopment #BackendDevelopment`

---

### 📅 DAY 7 — Site Visits Module (Core Feature)

**Topic**: The Heart of SurveyOS — Recording Every Field Survey

**Post Draft**:
> 📍 Site Visits is the most feature-rich module in SurveyOS. Every field survey is logged here.
>
> **Each visit captures:**
> • Visit code (SV-4001, SV-4002…) — auto-generated, atomic, unique
> • Visit number (1-based per site, auto-ordered by date)
> • Work description, instrument used, machine label
> • Engineer name, contact person, drawing reference (DWG No / DWG Ref By)
> • Multi-line billing (qty × rate rows OR flat amounts)
> • Payment mode (cash/UPI/cheque) + status (pending/partial/paid/waived)
> • Up to 12 photos
> • Notes
>
> **The Sequential Visit Code System:**
> ```js
> async function nextVisitCode(companyId) {
>   const c = await Counter.findByIdAndUpdate(
>     `visit:${companyId}`, { $inc: { seq: 1 } },
>     { upsert: true, new: true }
>   )
>   return `SV-${4000 + c.seq}` // SV-4001, SV-4002…
> }
> ```
> MongoDB's `findByIdAndUpdate` with `$inc` is atomic — no race conditions, even under concurrent requests.
>
> **How do you handle auto-increment IDs in MongoDB?**

**Screenshot**: Add Site Visit form with billing lines, photo upload, and payment fields
**Hashtags**: `#MongoDB #ReactJS #NodeJS #SurveyManagement #FullStackDevelopment #BackendDevelopment #SoftwareEngineering`

---

### 📅 DAY 8 — Multi-Line Billing & Payment System

**Topic**: Engineering a Flexible Billing System for Land Survey Work

**Post Draft**:
> 💰 Land survey billing is complex. A single site visit might charge for:
> • Boundary survey (100 points × ₹150/point)
> • Drawing charges (flat ₹2,000)
> • Travel charges (flat ₹500)
>
> SurveyOS supports all of this with a multi-line billing engine:
>
> ```js
> billingLines: [
>   { particular: "Boundary Survey", quantity: 100, rate: 150 }, // → 15,000
>   { particular: "Drawing Charges", amount: 2000 },              // flat
>   { particular: "Travel",          amount: 500 },               // flat
> ]
> // Total: 17,500 + otherCharges
> ```
>
> **Payment tracking:**
> • `amount` — total billed (Decimal128)
> • `paidAmount` — actual received (set when credit is allocated)
> • `paymentStatus` — `pending` / `partial` / `paid` / `waived`
>
> **The `paidAmount` field** is automatically updated by the FIFO credit allocation engine when the account manager records a payment — the user doesn't need to manually mark each visit as paid.
>
> **What's the most complex billing logic you've implemented?**

**Screenshot**: Site visit form with billing lines expanded / Invoice PDF showing line items
**Hashtags**: `#FinancialSoftware #Billing #MongoDB #NodeJS #FullStackDevelopment #SoftwareEngineering`

---

### 📅 DAY 9 — Photo Upload Pipeline

**Topic**: Building a Production-Grade Photo Upload System (Multer → Sharp → Cloudinary)

**Post Draft**:
> 📸 SurveyOS supports up to 12 photos per site visit. Here's the full pipeline:
>
> **Step 1: Multer** — receives files in memory buffer (no disk writes)
> **Step 2: Sharp** — optimise before upload:
> ```js
> sharp(buffer).rotate().resize({ width: 2200, height: 2200, fit: 'inside' })
>   .jpeg({ quality: 78, mozjpeg: true })  // for JPEG
>   .png({ compressionLevel: 9, palette: true }) // for PNG
> ```
> **Step 3: Cloudinary** — upload optimised buffer via streaming upload
> **Step 4: SurveyFile** — register URL, public_id, size, entity link in MongoDB
> **Step 5: SiteVisit** — append to `photoUrls[]` and `photoFileIds[]`
>
> **Atomicity**: Photos are uploaded before the visit DB row is created. If upload fails, all staged uploads are purged from Cloudinary. No orphaned assets.
>
> **On delete**: visit photos + invoice PDFs are purged from Cloudinary in chunks of 100 to respect API limits.
>
> **25 GB storage quota** per company — live usage tracked via MongoDB aggregate.
>
> **How do you handle file upload rollback in your projects?**

**Screenshot**: Site visit with photos displayed / photo upload UI
**Hashtags**: `#Cloudinary #FileUpload #NodeJS #ImageOptimization #Sharp #FullStackDevelopment #MongoDB`

---

### 📅 DAY 10 — PDF Generation System

**Topic**: 5 Types of Client-Side PDFs — Built with jsPDF + autoTable

**Post Draft**:
> 📄 SurveyOS generates 5 different PDF types — all client-side (no server rendering):
>
> **1. Daily Survey Report** (A4 landscape)
> — Visit details, engineer contacts, drawing reference, amount in words, 3 signature lines, embedded site photos
>
> **2. Individual Invoice** (A4 portrait)
> — Logo watermark, billing line table, subtotal/discount/received/total breakdown, dual bank columns, authorised stamp
>
> **3. Combined Site Invoice** (A4 portrait)
> — One invoice covering all visits of a site — rows = individual visits
>
> **4. Site Visits Report** (A4 portrait)
> — Tabular list of all visits with payment status
>
> **5. Account Manager Ledger** (A4 portrait)
> — Transaction list with debit/credit totals, net balance, pending amount
>
> **The dual bank column panel:**
> Admins who are coworkers on the same instrument each appear in a separate column — left and right — on the invoice. Their bank details + signature images are fetched from the API and injected into the PDF.
>
> **Amount in words**: ₹17,500 → "Seventeen Thousand Five Hundred Rupees Only" — custom `amountToWordsInr()` utility.
>
> **Have you generated PDFs client-side? What library did you use?**

**Screenshot**: Invoice PDF and Daily Survey Report PDF side by side
**Hashtags**: `#PDF #jsPDF #ReactJS #FullStackDevelopment #DocumentGeneration #SoftwareEngineering`

---

### 📅 DAY 11 — Account Manager (Ledger) Module

**Topic**: Building a Financial Ledger for Survey Coworkers

**Post Draft**:
> 📒 Every account manager (coworker) in SurveyOS gets their own financial ledger.
>
> **What the ledger tracks:**
> • Debit entries — expenses paid out to the manager
> • Credit entries — payments received from clients (for specific site/client)
> • `netBalance` = total credit − total debit
> • `pendingTotal` = unpaid amount across all visible site visits
> • `globalPendingTotal` = company-wide unpaid across all instruments
>
> **The smart part — credit allocation:**
> When a manager records a ₹20,000 credit for "Site ABC":
> 1. System loads all visits for Site ABC, sorted by date (oldest first)
> 2. Applies ₹20,000 across visits sequentially
> 3. Each visit's `paidAmount` and `paymentStatus` update automatically
> 4. Dashboard and invoice PDFs reflect the new balances instantly
>
> **Cross-admin visibility:**
> Admins on the same instrument can read each other's ledgers (read-only). The `adminsShareInstrumentAssignment()` check verifies shared instrument before granting access.
>
> **Year filter** — all summaries, rows, and PDFs scope to the selected financial year.
>
> **How do you model financial ledgers in your apps?**

**Screenshot**: Account Manager ledger page with debit/credit rows and summary panel
**Hashtags**: `#FinancialSoftware #LedgerSystem #MongoDB #NodeJS #ReactJS #FullStackDevelopment`

---

### 📅 DAY 12 — FIFO Credit Allocation Engine

**Topic**: The Most Complex Logic in SurveyOS — Automatic Payment Distribution

**Post Draft**:
> 🧮 The hardest engineering problem in SurveyOS: **automatic FIFO credit-to-visit allocation**.
>
> **The problem:**
> A client pays ₹50,000. They have 4 pending site visits: ₹15K, ₹18K, ₹12K, ₹8K.
> How does the system distribute ₹50K across them — automatically, correctly, and reversibly?
>
> **My solution:**
> ```js
> // Sorted oldest visit first (FIFO)
> for (const visit of visits) {
>   if (remaining <= 0) break
>   const owed = owedAmount(visit) // amount - paidAmount
>   const apply = Math.min(remaining, owed)
>   const newPaid = prevPaid + apply
>
>   // Full or partial?
>   if (newPaid >= total - 0.005) {
>     newStatus = 'paid'; paidToStore = total
>   } else {
>     newStatus = 'partial'; paidToStore = newPaid
>   }
>   remaining -= apply
> }
> ```
>
> **On delete/recompute:**
> All `paidAmount` fields are cleared → all credit transactions are replayed FIFO → balances are recalculated from scratch.
>
> This ensures the ledger always reflects reality, even after retroactive edits.
>
> **What's the most complex business logic you've had to implement?**

**Screenshot**: Account Manager with credit transaction form / payment status changes
**Hashtags**: `#BusinessLogic #SoftwareEngineering #MongoDB #FinancialSoftware #AlgorithmDesign #NodeJS`

---

### 📅 DAY 13 — PWA & Offline Support

**Topic**: Making SurveyOS Work Offline — PWA + Service Worker + Query Cache

**Post Draft**:
> 📱 Field surveyors often work in areas with no network. SurveyOS is built for that.
>
> **PWA Setup (vite-plugin-pwa + Workbox):**
> • Auto-update service worker (`registerType: 'autoUpdate'`, `skipWaiting: true`)
> • **CacheFirst** for JS/CSS/icons (30-day cache)
> • **NetworkFirst** (3s timeout) for HTML pages — falls back to cache on timeout
> • Navigate fallback to `index.html` for SPA routing
>
> **Offline Data (TanStack React Query):**
> ```js
> // 7-day persistent cache in localStorage
> PersistQueryClientProvider → createSyncStoragePersister({ storage: localStorage })
> ```
> All successfully loaded data is available offline from cache.
>
> **Offline Auth:**
> On app load, if the device is offline, the session (user, instruments, managers) is loaded from a localStorage snapshot — no network call needed.
>
> **UI Indicators:**
> • `OfflineBanner` — "No Internet Available" pill at top
> • `BackgroundRefreshIndicator` — spinning indicator during background fetches
> • `PwaUpdateToast` — "New version available" notification
>
> **Install support:**
> • Chrome: `beforeinstallprompt` deferred event + custom install dialog
> • iOS: native "Add to Home Screen" hint with tap-Share instruction
>
> **Have you shipped a PWA to real users? What was the biggest challenge?**

**Screenshot**: PWA install prompt + offline banner
**Hashtags**: `#PWA #ServiceWorker #OfflineFirst #ReactJS #WebDevelopment #ProgressiveWebApp #Workbox`

---

### 📅 DAY 14 — Settings & Company Branding

**Topic**: Building the Admin Control Panel — Settings, Branding & Backup

**Post Draft**:
> ⚙️ The Settings module is where the super admin controls the entire system. Here's what it covers:
>
> **Company Settings**
> • Name, legal name, owner, phone, email, office address
> • GST number (appears on all invoice PDFs)
> • Logo upload → Cloudinary → shown on invoice header
>
> **Invoice Branding**
> • Signature image upload (appears in PDF "Authorised Signatory" section)
> • Stamp image upload (overlaid on signature area in PDF)
> • Footer note and invoice theme
>
> **User Profile & Bank Details**
> Each admin can save their bank account details (account name, number, IFSC, branch, UPI phone). These automatically populate the left/right columns of the invoice PDF bank panel.
>
> **Storage Dashboard**
> • Live storage usage (aggregated from `files` collection)
> • 25 GB quota per company
> • File count
>
> **Data Backup**
> `GET /settings/company/backup-export` → JSON download with company stats, client/site/file counts, storage used/quota.
>
> **Admin Management** (super_admin only)
> • Create admins, assign instruments, activate/deactivate accounts
>
> **What settings features do you always build into your admin panels?**

**Screenshot**: Settings page with company info / invoice branding / admin management
**Hashtags**: `#AdminPanel #FullStackDevelopment #ReactJS #NodeJS #SoftwareEngineering #MongoDB`

---

### 📅 DAY 15 — Instrument Management & Scoping

**Topic**: How Instrument Scoping Powers SurveyOS's Multi-User Architecture

**Post Draft**:
> 🔭 Survey firms use multiple instruments (Total Station, GPS, Drone, etc.). SurveyOS tracks each one and uses them as the data isolation boundary.
>
> **Instrument model:**
> ```js
> { name, category, serialNumber, status: 'operational'|'maintenance'|'retired',
>   currentAmc: { vendor, validUntil, planName } }
> ```
>
> **AMC Tracking**: Each instrument's Annual Maintenance Contract is stored in `AmcRecord` — vendor, start/end date, amount, invoice file. The `currentAmc` is denormalised onto the instrument for quick read.
>
> **The scoping system:**
> Every API request resolves `effectiveInstrumentId` from the active instrument:
> ```js
> // scope.js
> sharedInstrumentOperationalScope(req) →
>   { adminId: { $in: peerAdminIds }, instrumentId: effectiveInstrumentId }
> ```
> This single scope object is injected into every DB query across clients, sites, visits, and transactions.
>
> **Instrument assignment:**
> Super admin assigns instruments to admins via `InstrumentAssignment` records. Revoking an assignment removes the admin's access to all scoped data instantly.
>
> **Why instrument-scoping instead of just role-based?**
> Two admins might work in the same company but on completely different projects. Instrument scoping gives per-project data isolation without creating separate companies.
>
> **How do you handle fine-grained access control in your multi-user apps?**

**Screenshot**: Settings → Instruments section with AMC details
**Hashtags**: `#AccessControl #SoftwareArchitecture #MongoDB #NodeJS #FullStackDevelopment #MultiTenancy`

---

### 📅 DAY 16 — Lessons Learned & What I'd Do Differently

**Topic**: 10 Things I Learned Building SurveyOS

**Post Draft**:
> 🎓 After building Samarth SurveyOS end-to-end, here are my biggest takeaways:
>
> **Technical lessons:**
>
> 1. **Decimal128 for money** — floating point errors in financial fields are real. Always use a decimal type.
>
> 2. **Atomic counters in MongoDB** — `findByIdAndUpdate + $inc + upsert` is the right way to generate sequential IDs.
>
> 3. **Always validate inputs with Zod** — runtime schema validation catches malformed requests before they reach the DB.
>
> 4. **`select: false` on sensitive fields** — `passwordHash` must never leak in any response. Explicit selection on every field that shouldn't be returned by default.
>
> 5. **Timing-safe comparisons for secrets** — `crypto.timingSafeEqual` is not optional for OTP/token comparisons.
>
> 6. **Client-side PDF generation is powerful** — jsPDF + autoTable can produce professional documents without a server, but photo embedding is slow (each image is a fetch + FileReader).
>
> 7. **Cascade deletes need a plan** — define the cascade rules before you start. Retroactive cascading is painful.
>
> 8. **PWA offline is mostly about data freshness** — the hard part isn't the service worker, it's deciding what to cache and when to invalidate.
>
> 9. **Rate limiting is a must** — even internal tools get probed. Forgot-password endpoints especially.
>
> 10. **Instrument scoping > simple RBAC** — for domain-specific apps, model your isolation boundary on a business concept (instrument, project, team), not just role.
>
> **What's the biggest lesson your last project taught you?**

**Screenshot**: Full app collage — dashboard, invoice PDF, mobile PWA, settings
**Hashtags**: `#LessonsLearned #SoftwareEngineering #MERN #FullStackDevelopment #WebDevelopment #CareerGrowth #100DaysOfCode`

---

## CONTENT CALENDAR SUMMARY

| Day | Topic | Hook | CTA |
|---|---|---|---|
| 1 | Project Reveal | Big picture reveal | "Follow along for 16 days" |
| 2 | Tech Stack | Why each technology was chosen | "What's your go-to stack?" |
| 3 | Database Design | 12 collections + multi-tenancy | "How do you handle data isolation?" |
| 4 | Auth & Security | JWT + OTP + timingSafeEqual | "Which security layer do devs skip?" |
| 5 | Dashboard | $facet aggregate magic | "What metric would you add first?" |
| 6 | Clients & Sites | Cascading deletes + lastVisitAt | "Your approach to cascading deletes?" |
| 7 | Site Visits | Atomic sequential codes | "How do you handle auto-increment?" |
| 8 | Billing System | Multi-line billing + Decimal128 | "Most complex billing logic?" |
| 9 | Photo Upload | Multer → Sharp → Cloudinary atomicity | "How do you handle upload rollback?" |
| 10 | PDF Generation | 5 PDF types, client-side | "Your PDF library of choice?" |
| 11 | Ledger Module | Financial ledger design | "How do you model ledgers?" |
| 12 | FIFO Credits | Hardest business logic | "Most complex logic you've built?" |
| 13 | PWA & Offline | Service worker + session cache | "Biggest PWA challenge?" |
| 14 | Settings Panel | Branding + backup + admin mgmt | "Must-have settings features?" |
| 15 | Instrument Scoping | Fine-grained access control | "Fine-grained access control approach?" |
| 16 | Lessons Learned | 10 lessons from real project | "Biggest lesson from your last project?" |

---

## HASHTAG BANK

### Primary (use every post)
`#MERN #FullStackDevelopment #ReactJS #NodeJS #MongoDB`

### Rotating (mix 3–4 per post)
`#WebDevelopment #SoftwareEngineering #BackendDevelopment #FrontendDevelopment #JavaScript #TypeScript #TailwindCSS #Cloudinary #PWA #DatabaseDesign #SoftwareArchitecture #OpenToWork #100DaysOfCode #TechCommunity #BuildInPublic #CareerGrowth`

### Niche
`#SurveyManagement #LandSurveying #DigitalTransformation #BusinessSoftware #InvoiceGeneration #ProgressiveWebApp`

---

## POSTING TIPS

1. **Post time**: 8–9 AM or 12–1 PM IST on weekdays for maximum reach
2. **First comment**: Post hashtags in the first comment, not the caption — improves algorithm ranking
3. **Images**: Always attach a screenshot or code snippet — posts with images get 2× more impressions
4. **Reply to every comment** in the first hour — boosts post distribution
5. **Tag relevant people**: If you used a library/tool, tag its creator or official page
6. **Day 1 performance**: If Day 1 gets 50+ reactions, boost Day 2 with a "Day 1 recap" line at the top
7. **Story arc**: Start broad (Day 1 reveal) → go deep (Days 2–15 technical) → conclude with wisdom (Day 16)
8. **Cross-post**: Share the series to dev.to, Hashnode, or Medium for additional reach

---

*Analysis based on full codebase reading of: 14 model files, 14 service files, 14 frontend pages/components, 5 PDF export files, vite.config.ts, server.js, routes/index.js (502 lines), and supporting utilities. No assumptions made.*
