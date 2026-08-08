# System Documentation: Super Admin Module Specification
**Project:** Survey OS (Samarth Land Surveyors App)  
**Document Version:** v1.0.0  
**Status:** Approved for Training  

---

## Executive Summary

The **Super Admin Module** is the core administrative interface of the Survey OS application. It provides global management over team accounts, physical survey instruments, organizational branding, data integrity backups, and security profiles.

---

## Module Specifications

### 1. Team Management (`/super-admin/admins`)
* **Technical Route:** `AdminManagement.tsx`
* **API Endpoints:** `GET /api/admins`, `POST /api/admins`, `PUT /api/admins/:id`
* **Purpose:** User Access Control (UAC) & Role-Based Access Control (RBAC).
* **Key Functionalities:**
  * **User Provisioning:** Create admin accounts with Full Name, Email, Mobile Number, and initial password.
  * **Instrument Scope Assignment:** Bind specific hardware devices (e.g. Total Station) to an admin. Admins will only see site data linked to their assigned instruments.
  * **Access Revocation:** Instant activation/deactivation of admin accounts.

---

### 2. Instrument Management (`/super-admin/instruments`)
* **Technical Route:** `InstrumentManagement.tsx`
* **API Endpoints:** `GET /api/instruments`, `POST /api/instruments`, `PUT /api/instruments/:id`
* **Purpose:** Physical Equipment Inventory & Lifecycle Management.
* **Key Functionalities:**
  * **Asset Registration:** Register hardware assets with Category (Total Station, DGPS, Auto Level), Name, Serial Number, and Notes.
  * **Lifecycle Status Tracking:** Maintain status indicators:
    * `operational` — Device in active field use.
    * `maintenance` — Device under repair/calibration.
    * `retired` — Decommissioned device.

---

### 3. Company Settings (`/super-admin/company`)
* **Technical Route:** `CompanySettings.tsx`
* **API Endpoints:** `GET /api/settings/company`, `PUT /api/settings/company`
* **Purpose:** Organization Branding & Invoicing Metadata Configuration.
* **Key Functionalities:**
  * **Company Profile:** Legal entity name, GSTIN, owner details, contact phone, and official address.
  * **Asset Uploads:** Upload and manage company logo, digital signature of authorized signee, and official stamp.
  * **Invoice Defaults:** Custom terms, conditions, and payment footer notes rendered on generated PDFs.

---

### 4. Database Backup & Export (`/super-admin/backup`)
* **Technical Route:** `BackupExport.tsx`
* **API Endpoints:** `POST /api/settings/company/backup`, `GET /api/settings/company/backup-export`
* **Purpose:** Data Preservation, Disaster Recovery & Compliance Archiving.
* **Key Functionalities:**
  * **Snapshot Trigger:** Perform an immediate database backup trigger on server.
  * **Data Export:** Download structured JSON export (`backup_export_YYYY-MM-DD.json`) containing all clients, sites, visits, and ledger transactions.

---

### 5. Profile & Security Settings (`/settings`)
* **Technical Route:** `Settings.tsx`
* **API Endpoints:** `GET /api/auth/me`, `PUT /api/auth/profile`, `PUT /api/auth/password`
* **Purpose:** Super Admin Account Credentials & Security.
* **Key Functionalities:**
  * Edit profile metadata (Name, Email, Mobile).
  * Password update/reset with encryption (bcrypt).
  * UI preferences (Theme/Dark mode).

---

## Recommended Standard Operating Procedures (SOP)

| Trigger Event | Action Page | Action Required |
| :--- | :--- | :--- |
| **New Staff Onboarding** | `Team Management` | Create account ➔ Set phone/password ➔ Assign instrument. |
| **Hardware Procurement** | `Instrument Management` | Add device details & serial number. |
| **Monthly Compliance** | `Database Backup` | Click "Export JSON" and save to secure cloud storage. |
| **GST / Address Update** | `Company Settings` | Update company profile & re-save invoice header details. |
