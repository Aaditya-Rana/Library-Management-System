# System Configuration & Workflows

## 🎯 Overview

The library management system operates in **two distinct modes**:
1. **Online Mode**: User requests book delivery to home
2. **Offline Mode**: User visits library physically

This document defines who controls system settings and the exact workflows for both modes.

---

## ⚙️ System Configuration & Control

### Who Sets What?

#### 1. Super Admin Controls

**Global System Settings:**
- ✅ **Fine rates** (per day, maximum cap)
- ✅ **Delivery charges** (distance-based or flat rate)
- ✅ **Security deposit amounts** (by book category)
- ✅ **Membership fees** (standard, premium tiers)
- ✅ **Loan duration** (default days for different book types)
- ✅ **Renewal limits** (maximum renewals allowed)
- ✅ **Late fee grace period** (days before fines start)
- ✅ **Damage charge rates** (minor, moderate, major)
- ✅ **Payment gateway configuration** (API keys, merchant details)
- ✅ **Service area** (delivery radius, pincodes covered)
- ✅ **Book categories and their rules** (reference, fiction, textbook, etc.)

**Configuration Interface:**
```
┌─────────────────────────────────────────────┐
│  System Settings (Super Admin Only)         │
├─────────────────────────────────────────────┤
│  📚 Book & Loan Settings                    │
│  • Default loan period: [14] days           │
│  • Maximum renewals: [2] times              │
│  • Grace period: [1] days                   │
│                                             │
│  💰 Fine Configuration                      │
│  • Standard books: ₹[5] per day             │
│  • Premium books: ₹[10] per day             │
│  • Maximum fine cap: ₹[500]                 │
│                                             │
│  🚚 Delivery Settings                       │
│  • Delivery fee (flat): ₹[50]               │
│  • Return pickup fee: ₹[50]                 │
│  • Security deposit (standard): ₹[200]      │
│  • Security deposit (premium): ₹[500]       │
│                                             │
│  👥 Membership Settings                     │
│  • Premium membership: ₹[999] per year      │
│  • Premium benefits: Free delivery ☑        │
│                                             │
│  [Save Changes]                             │
└─────────────────────────────────────────────┘
```

---

#### 2. Admin Controls

**Library-Level Settings:**
- ✅ **Book categorization** (assign books to categories)
- ✅ **Book pricing** (set book value for damage/loss calculation)
- ✅ **Librarian permissions** (what each librarian can do)
- ✅ **Working hours** (library open/close times)
- ✅ **Delivery slots** (available time slots for delivery)
- ✅ **Holiday calendar** (when library is closed)
- ❌ Cannot modify fine rates or global settings (set by Super Admin)

**Configuration Interface:**
```
┌─────────────────────────────────────────────┐
│  Library Settings (Admin)                   │
├─────────────────────────────────────────────┤
│  📖 Book Management                         │
│  • Categorize books                         │
│  • Set book values                          │
│  • Mark books as delivery-eligible          │
│                                             │
│  🕐 Operating Hours                         │
│  • Monday-Friday: 9:00 AM - 6:00 PM         │
│  • Saturday: 9:00 AM - 2:00 PM              │
│  • Sunday: Closed                           │
│                                             │
│  🚚 Delivery Slots                          │
│  • Morning: 9 AM - 12 PM ☑                  │
│  • Afternoon: 12 PM - 3 PM ☑                │
│  • Evening: 3 PM - 6 PM ☑                   │
│                                             │
│  [Save Changes]                             │
└─────────────────────────────────────────────┘
```

---

#### 3. Librarian Controls

**Operational Settings:**
- ✅ **Process transactions** (issue, return books)
- ✅ **Apply or waive fines** (within limits set by admin)
- ✅ **Update book status** (available, damaged, lost)
- ✅ **Approve/reject user registrations**
- ❌ Cannot modify any pricing or fine rates
- ❌ Cannot change system configurations

**Fine Waiver Authority:**
```
Librarian can waive fines up to: ₹100 (configurable by Admin)
Above ₹100: Requires Admin approval
```

---

#### 4. User Controls

**Personal Settings:**
- ✅ **Profile information** (name, phone, address)
- ✅ **Delivery addresses** (add, edit, delete)
- ✅ **Notification preferences** (email, SMS)
- ✅ **Password change**
- ❌ Cannot modify any system settings
- ❌ Cannot change fine rates or charges

---

## 📋 Complete Workflows

### Mode 1: Online Book Issuing (Home Delivery)

#### Step-by-Step Flow

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 1. Browse & Search Book Catalog     │
│    • Search by title/author/ISBN    │
│    • Filter by genre/availability   │
│    • View book details              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 2. Select "Request Home Delivery"   │
│    • Check delivery availability    │
│    • View delivery fee              │
│    • View security deposit          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 3. Choose Delivery Details          │
│    • Select/add delivery address    │
│    • Choose delivery date & slot    │
│    • Add special instructions       │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 4. Review Order Summary              │
│    • Book: "The Great Gatsby"       │
│    • Delivery fee: ₹50              │
│    • Security deposit: ₹200         │
│    • Total: ₹250                    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 5. Make Payment                      │
│    • Choose payment method          │
│    • Pay via Razorpay/Stripe        │
│    • Receive payment confirmation   │
└──────┬───────────────────────────────┘
       │
       ▼ [Payment Success]
┌──────────────────────────────────────┐
│ 6. Request Created                   │
│    • Status: "Payment Confirmed"    │
│    • Request ID: #DEL12345          │
│    • Email/SMS confirmation sent    │
└──────────────────────────────────────┘
       │
       │
       ▼
┌─────────────┐
│  LIBRARIAN  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 7. Review Delivery Request           │
│    • View request details           │
│    • Check book availability        │
│    • Verify payment status          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 8. Approve Request                   │
│    • Locate book on shelf           │
│    • Scan book barcode              │
│    • Status: "Approved"             │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 9. Prepare Book for Delivery         │
│    • Inspect book condition         │
│    • Take photos (cover, pages)     │
│    • Apply protective covering      │
│    • Attach delivery label + QR     │
│    • Pack in delivery bag           │
│    • Status: "Ready for Delivery"   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 10. Assign to Delivery Personnel     │
│     • Select delivery person        │
│     • Optimize route                │
│     • Status: "Assigned"            │
└──────┬───────────────────────────────┘
       │
       │
       ▼
┌─────────────────────┐
│ DELIVERY PERSONNEL  │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 11. Receive Delivery Assignment      │
│     • View delivery manifest        │
│     • See optimized route           │
│     • Navigate to address           │
│     • Status: "Out for Delivery"    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 12. Deliver Book to User             │
│     • Call user on arrival          │
│     • Hand over book                │
│     • Scan QR code                  │
│     • Capture signature/photo       │
│     • Status: "Delivered"           │
└──────┬───────────────────────────────┘
       │
       │
       ▼
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 13. Receive Book                     │
│     • Book issued successfully      │
│     • Loan period: 14 days          │
│     • Due date: Jan 4, 2026         │
│     • Email/SMS confirmation        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 14. Read Book (Loan Period)          │
│     • Receive reminders (3 days)    │
│     • Option to renew online        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 15. Schedule Return Pickup           │
│     • Select pickup date & slot     │
│     • Pay return pickup fee (₹50)   │
│     • Confirmation sent             │
└──────┬───────────────────────────────┘
       │
       │
       ▼
┌─────────────────────┐
│ DELIVERY PERSONNEL  │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 16. Pickup Book from User            │
│     • Navigate to address           │
│     • Collect book                  │
│     • Inspect condition (photos)    │
│     • Scan QR code                  │
│     • Status: "In Transit - Return" │
└──────┬───────────────────────────────┘
       │
       │
       ▼
┌─────────────┐
│  LIBRARIAN  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 17. Receive Returned Book            │
│     • Scan barcode                  │
│     • Inspect condition             │
│     • Compare with delivery photos  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 18. Process Return                   │
│     • Calculate late fees (if any)  │
│     • Assess damage charges         │
│     • Update book status: Available │
│     • Status: "Returned"            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 19. Process Refund                   │
│     • Security deposit: ₹200        │
│     • Late fee: ₹0                  │
│     • Damage charge: ₹0             │
│     • Refund amount: ₹200           │
│     • Auto-refund to user           │
└──────┬───────────────────────────────┘
       │
       ▼
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 20. Receive Refund & Receipt         │
│     • Refund processed              │
│     • Email/SMS receipt             │
│     • Transaction complete          │
└──────────────────────────────────────┘
```

---

### Mode 2: Offline Book Issuing (In-Library)

#### Step-by-Step Flow

```
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 1. Visit Library Physically          │
│    • Bring library card/ID          │
│    • Browse physical shelves OR     │
│    • Search catalog at library      │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 2. Select Book(s) to Borrow          │
│    • Pick book from shelf           │
│    • Bring to circulation desk      │
└──────┬───────────────────────────────┘
       │
       │
       ▼
┌─────────────┐
│  LIBRARIAN  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 3. Verify User Eligibility           │
│    • Scan user library card         │
│    • Check user status (active?)    │
│    • Check pending fines            │
│    • Check borrowing limit          │
└──────┬───────────────────────────────┘
       │
       ▼ [Eligible?]
       │
       ├─── NO ──────────────────────────┐
       │                                 │
       │                                 ▼
       │                    ┌────────────────────────┐
       │                    │ 4a. Handle Ineligible  │
       │                    │     • Pay pending fines│
       │                    │     • Resolve issues   │
       │                    └────────┬───────────────┘
       │                             │
       │◄────────────────────────────┘
       │
       ▼ YES
┌──────────────────────────────────────┐
│ 4b. Scan Book                        │
│     • Scan book barcode             │
│     • Verify book is available      │
│     • Check book condition          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 5. Calculate Charges (if any)        │
│     • Membership fee (if new/renew) │
│     • Security deposit (if required)│
│     • No delivery fee (offline)     │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 6. User Makes Payment                │
│     • Pay at counter (cash/card)    │
│     • OR pay online (QR code)       │
│     • Librarian confirms payment    │
└──────┬───────────────────────────────┘
       │
       ▼ [Payment Confirmed]
┌──────────────────────────────────────┐
│ 7. Librarian Approves & Issues Book  │
│     • Mark payment as received      │
│     • Issue book to user            │
│     • Set due date (14 days)        │
│     • Print/email receipt           │
│     • Status: "Issued"              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 8. Update System                     │
│     • Book status: "Issued"         │
│     • User's borrowed count: +1     │
│     • Transaction recorded          │
│     • Send confirmation email/SMS   │
└──────┬───────────────────────────────┘
       │
       │
       ▼
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 9. Take Book Home                    │
│    • Receipt with due date          │
│    • Loan period: 14 days           │
│    • Due date: Jan 4, 2026          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 10. Read Book (Loan Period)          │
│     • Receive email/SMS reminders   │
│     • Can renew online OR in-person │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 11. Return to Library                │
│     • Bring book to circulation desk│
└──────┬───────────────────────────────┘
       │
       │
       ▼
┌─────────────┐
│  LIBRARIAN  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 12. Scan Returned Book               │
│     • Scan book barcode             │
│     • System calculates return date │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 13. Inspect Book Condition           │
│     • Check for damage              │
│     • Compare with issue condition  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 14. Calculate Charges                │
│     • Late fee: ₹5 × days overdue   │
│     • Damage charge (if any)        │
│     • Total due: ₹X                 │
└──────┬───────────────────────────────┘
       │
       ▼ [Any charges?]
       │
       ├─── YES ─────────────────────────┐
       │                                 │
       │                                 ▼
       │                    ┌────────────────────────┐
       │                    │ 15a. User Pays Charges │
       │                    │     • Pay at counter   │
       │                    │     • OR pay online    │
       │                    └────────┬───────────────┘
       │                             │
       │◄────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 15b. Complete Return                 │
│      • Mark as returned             │
│      • Update book status: Available│
│      • User's borrowed count: -1    │
│      • Print/email receipt          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 16. Refund Security Deposit (if any) │
│     • Deduct any charges            │
│     • Refund balance to user        │
│     • Cash refund OR online         │
└──────┬───────────────────────────────┘
       │
       │
       ▼
┌─────────────┐
│    USER     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 17. Transaction Complete             │
│     • Receipt received              │
│     • Book returned successfully    │
└──────────────────────────────────────┘
```

---

## 💰 Payment Scenarios Comparison

### Online Mode (Home Delivery)

| Charge Type | Amount | When Paid | Refundable? |
|-------------|--------|-----------|-------------|
| **Delivery Fee** | ₹50 | Before delivery | No (service fee) |
| **Security Deposit** | ₹200 | Before delivery | Yes (on return) |
| **Return Pickup Fee** | ₹50 | Before pickup OR at booking | No (service fee) |
| **Late Fee** | ₹5/day | Deducted from deposit | N/A |
| **Damage Charge** | Varies | Deducted from deposit | N/A |

**Total Upfront Payment:** ₹250 (Delivery ₹50 + Deposit ₹200)

**Example Scenarios:**

**Scenario 1: On-time return, no damage**
```
Paid: ₹250
Refunded: ₹200 (full deposit)
Net cost: ₹50 (delivery fee only)
```

**Scenario 2: 3 days late, no damage**
```
Paid: ₹250
Late fee: ₹15 (₹5 × 3 days)
Refunded: ₹185 (₹200 - ₹15)
Net cost: ₹65 (delivery ₹50 + late fee ₹15)
```

**Scenario 3: On-time, minor damage**
```
Paid: ₹250
Damage charge: ₹50
Refunded: ₹150 (₹200 - ₹50)
Net cost: ₹100 (delivery ₹50 + damage ₹50)
```

---

### Offline Mode (In-Library)

| Charge Type | Amount | When Paid | Refundable? |
|-------------|--------|-----------|-------------|
| **Membership Fee** | ₹0 (or annual) | At registration | No |
| **Security Deposit** | ₹0 (optional) | At issue (if required) | Yes (on return) |
| **Late Fee** | ₹5/day | At return | No |
| **Damage Charge** | Varies | At return | No |

**Total Upfront Payment:** ₹0 (typically)

**Example Scenarios:**

**Scenario 1: On-time return, no damage**
```
Paid: ₹0
Net cost: ₹0 (free service)
```

**Scenario 2: 3 days late, no damage**
```
Paid at return: ₹15 (₹5 × 3 days)
Net cost: ₹15
```

**Scenario 3: On-time, minor damage**
```
Paid at return: ₹50 (damage charge)
Net cost: ₹50
```

---

## 🔄 Key Differences Between Modes

| Aspect | Online Mode | Offline Mode |
|--------|-------------|--------------|
| **Book Selection** | Browse online catalog | Physical browsing or library catalog |
| **Payment Timing** | Upfront (before delivery) | After approval (at counter) |
| **Security Deposit** | Always required | Optional (admin decides) |
| **Delivery Fee** | Yes (₹50 + ₹50 return) | No |
| **Approval Process** | Librarian reviews request | Immediate at counter |
| **Book Handover** | Delivered to home | Collected at library |
| **Return Process** | Pickup scheduled | Return to library |
| **Convenience** | High (no travel) | Medium (must visit) |
| **Cost** | Higher (delivery fees) | Lower (no delivery) |
| **Speed** | 1-3 days | Immediate |

---

## 🎯 Recommended Configuration (Starting Point)

### Fine Rates (Set by Super Admin)
```yaml
standard_books:
  fine_per_day: ₹5
  max_fine_cap: ₹500
  grace_period: 1 day

premium_books:
  fine_per_day: ₹10
  max_fine_cap: ₹500
  grace_period: 0 days

reference_books:
  fine_per_day: ₹20
  max_fine_cap: ₹1000
  grace_period: 0 days
```

### Delivery Charges (Set by Super Admin)
```yaml
delivery_fee: ₹50 (flat rate)
return_pickup_fee: ₹50
round_trip_bundle: ₹80 (save ₹20)

security_deposits:
  standard_books: ₹200
  premium_books: ₹500
  reference_books: ₹1000
```

### Loan Periods (Set by Super Admin)
```yaml
standard_books: 14 days
premium_books: 14 days
reference_books: 7 days
magazines: 3 days

max_renewals: 2
renewal_extension: 14 days
```

### Damage Charges (Set by Super Admin)
```yaml
minor_damage: ₹50
moderate_damage: ₹200
major_damage: 50% of book value
lost_book: 100% of book value + ₹100 processing fee
```

---

## 📱 User Interface Examples

### Online Mode: Payment Summary Screen
```
┌─────────────────────────────────────────────┐
│  Order Summary                              │
├─────────────────────────────────────────────┤
│  Book: "The Great Gatsby"                   │
│  Author: F. Scott Fitzgerald                │
│  Loan Period: 14 days                       │
│  Due Date: Jan 4, 2026                      │
│                                             │
│  Delivery Address:                          │
│  123 Main Street, Apt 4B                    │
│  Mumbai, Maharashtra - 400001               │
│                                             │
│  Delivery Slot: Dec 23, Morning (9-12 PM)   │
├─────────────────────────────────────────────┤
│  Charges:                                   │
│  Delivery Fee              ₹50              │
│  Security Deposit          ₹200             │
│  ─────────────────────────────              │
│  Total                     ₹250             │
│                                             │
│  ℹ️ Security deposit will be refunded after │
│     book return (minus any late fees)       │
├─────────────────────────────────────────────┤
│  [Pay ₹250]                                 │
└─────────────────────────────────────────────┘
```

### Offline Mode: Librarian Issue Screen
```
┌─────────────────────────────────────────────┐
│  Issue Book (Offline)                       │
├─────────────────────────────────────────────┤
│  User: John Doe (#LIB12345)                 │
│  Status: ✅ Active                          │
│  Pending Fines: ₹0                          │
│  Books Borrowed: 2/5                        │
│                                             │
│  Book: "The Great Gatsby"                   │
│  ISBN: 978-0-7432-7356-5                    │
│  Category: Fiction (Standard)               │
│  Condition: Good                            │
│                                             │
│  Loan Period: 14 days                       │
│  Due Date: Jan 4, 2026                      │
│  Late Fee: ₹5 per day                       │
├─────────────────────────────────────────────┤
│  Charges:                                   │
│  Membership Fee            ₹0 (Active)      │
│  Security Deposit          ₹0 (Not required)│
│  ─────────────────────────────              │
│  Total                     ₹0               │
├─────────────────────────────────────────────┤
│  Payment Status: ✅ No payment required     │
│                                             │
│  [Issue Book]  [Cancel]                     │
└─────────────────────────────────────────────┘
```

---

## ✅ Summary

### Configuration Control
- **Super Admin**: Sets all rates, fees, and global policies
- **Admin**: Manages library-specific settings and book categorization
- **Librarian**: Executes transactions, can waive small fines
- **User**: No configuration control

### Two Modes
1. **Online (Home Delivery)**:
   - User pays upfront (delivery + deposit)
   - Librarian approves request after payment
   - Book delivered to home
   - Pickup scheduled for return
   - Higher cost, higher convenience

2. **Offline (In-Library)**:
   - User visits library
   - Librarian checks eligibility
   - User pays (if any charges)
   - Librarian approves and issues immediately
   - User takes book home
   - Returns to library
   - Lower cost, requires travel

### Payment Flow
- **Online**: Payment → Librarian Approval → Delivery
- **Offline**: Librarian Approval → Payment → Immediate Issue

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-21  
**Status:** Complete Workflow Definition - Ready for Implementation
