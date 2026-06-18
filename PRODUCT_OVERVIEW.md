
# Samarth Land Surveyors - Product Overview Document

---

## 1. Main Screens/Pages

### Login Screen
- **Purpose**: User authentication to access the system
- **Actions**: Enter email and password to log in, or request password reset
- **Output**: Access granted to the application dashboard if credentials are valid

### Dashboard
- **Purpose**: Provides high-level overview of business performance
- **Actions**: View key metrics (client count, site count, site visits, pending payments, etc.), navigate to other sections
- **Output**: Quick snapshot of current business status

### Clients & Sites
- **Purpose**: Manage client and site information
- **Actions**: Add, edit, delete clients; add, edit, delete sites (linked to clients); view client-site relationships
- **Output**: Organized client and site database

### Site Visits
- **Purpose**: Record and manage on-site survey work
- **Actions**: Add new site visit records (with work details, amount, payment info), view visit history, edit/delete visits, upload photos, generate visit PDFs
- **Output**: Complete record of all survey site visits

### Account Manager
- **Purpose**: Track financial transactions for account managers (coworkers)
- **Actions**: Add debit/credit transactions, view transaction history, filter by type/status, generate ledger PDFs, view pending payments
- **Output**: Accurate financial tracking for all account managers

### Settings
- **Purpose**: Configure company, user, and instrument information
- **Actions**: Manage user accounts, manage instrument details, update company information
- **Output**: Configured system settings

---

## 2. User Journey

### Complete Flow from Login to Logout:
1. **Login**: User enters credentials on login screen
2. **Dashboard**: User lands on dashboard, views key business metrics
3. **Navigate**: User navigates to Clients & Sites, Site Visits, or Account Manager as needed
4. **Perform Tasks**:
   - Add/edit clients and sites
   - Log site visits with work details, payments, and photos
   - Record financial transactions in Account Manager
   - Generate reports/PDFs for site visits and ledgers
5. **Logout**: User logs out from the system

---

## 3. Feature Workflow

### Client & Site Management
- **Input**: Client name, contact info; site name, location, instrument details
- **Actions**: Add/Edit/Delete clients and sites
- **Output**: Organized client-site database for reference

### Site Visit Recording
- **Input**: Visit date, client/site selection, instrument used, work details, amount, payment mode/status, notes, photos
- **Actions**: Create visit records, edit/delete visits, generate PDF reports
- **Output**: Complete audit trail of site survey work with payment history

### Account Manager Ledger
- **Input**: Transaction date, type (debit/credit), amount, reason, client/site references
- **Actions**: Record transactions, filter views, generate ledger PDFs
- **Output**: Accurate financial ledger for each account manager

### Report Generation
- **Input**: Site visit or ledger data
- **Actions**: Export to PDF for sharing and printing
- **Output**: Professional PDF reports for clients and internal use

---

## 4. User Roles

### Company Admin
- **Access**: All screens and features
- **Permissions**: Manage users/instruments, view all client/site/visit/transaction data, generate all reports

### Account Manager (Coworker)
- **Access**: Dashboard, Clients & Sites, Site Visits, Account Manager (their own ledger)
- **Permissions**: Add/edit site visits, view their own financial transactions, view clients/sites (read-only)

---

## 5. Survey Workflow (Land Survey Process)

### Complete Survey Lifecycle:

1. **Create Client & Site**: First, add a new client and their corresponding site in the Clients & Sites section
2. **Schedule/Record Site Visit**: Log the site visit with details like instrument used, work performed, amount charged
3. **Track Payments**: Record payment status (paid/pending) and mode (cash/UPI/cheque) in the site visit
4. **Record Transactions**: Add debit/credit entries in Account Manager to track financials for the account manager
5. **Generate Reports**: Export site visit or ledger PDFs for client sharing or internal records
6. **Archive/Delete**: When no longer needed, delete site visits/sites/clients (with cascading deletion of related records)

---

## 6. Screen Flow Diagram

```
Login
  ↓
Dashboard
  ↓
Clients & Sites ←→ Add/Edit Client/Site
  ↓
Site Visits ←→ Add/Edit Visit
  ↓
Account Manager ←→ Add/Edit Transaction
  ↓
Settings
  ↓
Logout
```

---

## 7. Module Summary

### Authentication Module
- Manages user login/logout and password resets
- Secures access to the application

### Client & Site Management Module
- Stores and organizes client and site information
- Maintains relationships between clients and their sites

### Site Visit Management Module
- Records on-site survey work details
- Tracks payments for survey services
- Supports photo uploads for documentation
- Generates site visit reports

### Account Manager Module
- Tracks financial transactions for each coworker
- Maintains ledgers with debit/credit entries
- Generates ledger reports
- Calculates pending payments and net balances

### User Management Module
- Manages user accounts (admin, coworkers)
- Configures user roles and permissions

### Settings Module
- Manages company information
- Configures instrument details
- Maintains system configuration

---

## 8. Executive Summary

### For a Client:
"Samarth Land Surveyors' management system helps organize all your survey projects efficiently. Every site visit is documented with clear work details, payment tracking, and professional reports. You can be confident that all your survey records are secure, organized, and accessible."

### For a Project Manager:
"This system centralizes all client, site, and site visit data in one place. You can track every project from start to finish, monitor payment statuses, and generate reports instantly. The account manager module ensures financials are always up-to-date, and cascading deletions keep data clean and consistent."

### For a Marketing Team:
"Samarth Land Surveyors uses a modern, professional management system that showcases their commitment to organization and transparency. With clear record-keeping, photo documentation, and professional PDF reports, they can provide exceptional service and build trust with clients."

---

## Top 10 Most Important Screens

1. Dashboard
2. Clients & Sites
3. Site Visits
4. Account Manager
5. Add Site Visit
6. Add Client
7. Add Site
8. Settings
9. Login
10. Logout

---

## Suggested Order for a Product Demo Video

1. Login Screen
2. Dashboard Overview
3. Clients & Sites Management
4. Site Visits List & Adding a New Visit
5. Account Manager Ledger
6. Report Generation (PDF Export)
7. Settings Section
8. Logout

---

## 60-Second Walkthrough Script

"Welcome to Samarth Land Surveyors' management system! Start on the Dashboard where you see all key business metrics at a glance. Navigate to Clients & Sites to manage your client database—add new clients and their survey sites. Then head to Site Visits to log every on-site survey, complete with work details, payment info, and photos. Use Account Manager to track all financial transactions for each coworker, with debit/credit entries and pending payment tracking. Generate professional PDFs for site visits and ledgers in one click. Finally, manage your team and instruments in Settings. Simple, efficient, and organized—perfect for your land surveying business!"

