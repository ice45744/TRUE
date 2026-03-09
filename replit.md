# S.T. ก้าวหน้า - ระบบดิจิทัลสภานักเรียน

## Overview
A Thai school student digital system for managing goodness activities, stamp collection, announcements, and issue reporting. Includes full Admin panel.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui, Thai language (Sarabun font)
- **Backend**: Express.js with in-memory storage (MemStorage)
- **Auth**: localStorage-based client auth + backend session (no Firebase)
- **Routing**: wouter for client-side routing
- **Data Persistence**: In-memory only (data resets on server restart)

## Features
1. **Authentication** - Login/Register with student ID and password
2. **Home Dashboard** - Welcome header (blue gradient), announcements preview, quick actions
3. **Activities Page** - Two tabs:
   - ความดี (Goodness): Check-in via QR, activity submission form
   - ธนาคารขยะ (Trash Bank): Stamp card (10 stamps), rewards catalog
4. **QR Code System** (Admin only):
   - **QR เช็คชื่อ (Checkin)**: Permanent QR, works 06:00-08:00 only, one scan per student per day, +1 merit point
   - **QR ธนาคารขยะ (Stamp)**: Single-use QR, expires in 1/2/5 minutes, +1 trash point
   - **Stamp conversion**: Every 10 points (merit or trash) = 1 stamp (auto-calculated)
5. **Announcements** - List of school announcements (expandable cards)
6. **Report/Complaint** - Form with category select, details textarea, image link
7. **Profile** - Avatar, 3 stats (merits, trashPoints, stamps), settings links, logout
8. **Admin Panel** - Role-based admin system with:
   - Dashboard: Overview stats, logout button
   - Manage Students: Search, view, delete students (shows merits, trashPoints, stamps)
   - Approve Activities: Filter by status, approve/reject activities
   - Manage Announcements: Create, view, delete announcements
   - Manage Reports: Filter by status, update status
   - QR Code Generator: Create checkin (permanent) and stamp (timed) QR codes

## Routes

### Student Routes
- `/auth` - Login/Register page
- `/` - Home dashboard (protected)
- `/activities` - Activities page (protected)
- `/announcements` - Announcements page (protected)
- `/report` - Report/complaint page (protected)
- `/profile` - Profile page (protected)

### Admin Routes
- `/admin` - Admin dashboard (admin only)
- `/admin/users` - Manage students (admin only)
- `/admin/activities` - Approve activities (admin only)
- `/admin/announcements` - Manage announcements (admin only)
- `/admin/reports` - Manage reports (admin only)
- `/admin/qr` - QR Code generator (admin only)

## API Endpoints

### Auth & Users
- `POST /api/auth/login` - Login with studentId + password
- `POST /api/auth/register` - Register new user
- `GET /api/users/:id` - Get user by ID

### Student APIs
- `GET /api/announcements` - Get all announcements
- `POST /api/announcements` - Create announcement
- `DELETE /api/announcements/:id` - Delete announcement
- `GET /api/activities/:userId` - Get user activities
- `POST /api/activities/:userId` - Create activity (auto-awards merits/trashPoints)
- `GET /api/reports/:userId` - Get user reports
- `POST /api/reports/:userId` - Create report
- `POST /api/qr/scan` - Scan QR token {token, userId} — enforces time (6-8AM for checkin), daily limit, single-use (stamp)

### Admin APIs (protected by requireAdmin middleware)
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/activities` - List all activities
- `PATCH /api/admin/activities/:id` - Update activity status
- `GET /api/admin/reports` - List all reports
- `PATCH /api/admin/reports/:id` - Update report status
- `POST /api/qr/generate` - Generate QR token {type, expiryMinutes}
- `GET /api/qr/checkin` - Get existing permanent checkin QR

## Data Model
- **User**: id, studentId, name, password, schoolCode, role, merits, trashPoints, stamps
- **QrToken**: token, type (checkin|stamp), createdAt, expiresAt (null=permanent), usedBy (Set)
- Checkin QR uses daily keys (userId_date) for per-day tracking
- Stamp QR tracks individual userId, limited to 1 use total

## Seed Data
- Admin: Register with schoolCode "สภานักเรียนปี2569/1_2" → auto admin role
- Student 1: studentId="19823", password="1234", name="Kittipot Ice"
- Student 2: studentId="12345", password="1234", name="สมชาย ใจดี"
- Student 3: studentId="11111", password="1234", name="สมหญิง รักเรียน"
- 2 pre-seeded announcements, 2 activities, 1 report

## Design
- Mobile-first layout, max-width 480px centered
- Background: #F0F4FA (light blue-gray)
- Primary: Blue gradient (#4F8EF7 to #2563EB)
- Font: Sarabun (Thai) + Inter
- Bottom tab navigation (5 tabs for students, 5 tabs for admin)
- Admin can use both student and admin pages

## Animations & Micro-interactions
- CSS keyframe animations: fadeInUp, fadeIn, scaleIn, slideDown, bounceIn, float, shimmer, popIn, wiggle, navSlideUp
- Animation classes: animate-fade-in-up, animate-fade-in, animate-scale-in, animate-slide-down, animate-bounce-in, animate-float, animate-pop-in, animate-wiggle, animate-nav-slide
- Stagger classes: stagger-1 through stagger-6 (50ms increments)
- Interactive classes: card-interactive (scale-down on active), gradient-shimmer, tab-indicator (smooth sliding tabs)
- Bottom nav: Icon scale + translate on active state, nav-dot expanding indicator
- Frosted glass nav: bg-white/95 backdrop-blur-md
- prefers-reduced-motion: All animations disabled for accessibility
- Loading spinners: Consistent white border-spinner pattern across all buttons

## Key Packages
- html5-qrcode, qrcode.react (QR system)
- date-fns (date formatting with Thai locale)

## Vercel Deployment
- `vercel.json` configured for Express + static frontend deployment
- In-memory storage (data resets on server restart)
- Build command: `npm run build` creates production bundle in `dist/`
- Run command: `node ./dist/index.cjs`

## Recent Changes (Turn 9)
- **Removed Firebase completely** from both frontend and backend
- Deleted files: `client/src/lib/firebase.ts`, `client/src/lib/firebaseUtils.ts`, `client/src/hooks/useFirestore.ts`
- `server/storage.ts`: Removed all Firebase Admin SDK initialization, imports, and sync code
- App now uses pure in-memory MemStorage backend
- Data persists only during runtime; resets on server restart
- All authentication via backend API (no Firebase Auth)
