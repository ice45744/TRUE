# S.T. ก้าวหน้า - ระบบดิจิทัลสภานักเรียน

## Overview
A Thai school student digital system for managing goodness activities, stamp collection, announcements, and issue reporting. Includes full Admin panel.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui, Thai language (Sarabun font)
- **Backend**: Express.js with in-memory storage
- **Auth**: localStorage-based client auth with role-based access (student/admin)
- **Routing**: wouter for client-side routing

## Features
1. **Authentication** - Login/Register with student ID and password
2. **Home Dashboard** - Welcome header (blue gradient), announcements preview, quick actions
3. **Activities Page** - Two tabs:
   - ความดี (Goodness): Check-in via QR, activity submission form
   - ธนาคารขยะ (Trash Bank): Stamp card (10 stamps), rewards catalog
4. **QR Code System** - Generate QR codes (html5-qrcode, qrcode.react), scan to earn merits/stamps, one-time-use per user
5. **Announcements** - List of school announcements (expandable cards)
6. **Report/Complaint** - Form with category select, details textarea, image link
7. **Profile** - Avatar, stats, settings links, logout
8. **Admin Panel** - Role-based admin system with:
   - Dashboard: Overview stats (students, pending activities, reports, announcements, total merits/stamps)
   - Manage Students: Search, view, delete students
   - Approve Activities: Filter by status, approve/reject activities
   - Manage Announcements: Create, view, delete announcements
   - Manage Reports: Filter by status, update status (pending → in_progress → resolved/rejected)

## Routes

### Student Routes
- `/auth` - Login/Register page
- `/` - Home dashboard (protected)
- `/activities` - Activities page (protected)
- `/announcements` - Announcements page (protected)
- `/report` - Report/complaint page (protected)
- `/profile` - Profile page (protected)
- `/qr-generator` - QR Code generator (protected)

### Admin Routes
- `/admin` - Admin dashboard (admin only)
- `/admin/users` - Manage students (admin only)
- `/admin/activities` - Approve activities (admin only)
- `/admin/announcements` - Manage announcements (admin only)
- `/admin/reports` - Manage reports (admin only)

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
- `POST /api/activities/:userId` - Create activity (auto-awards merits/stamps)
- `GET /api/reports/:userId` - Get user reports
- `POST /api/reports/:userId` - Create report
- `POST /api/qr/generate` - Generate QR token {type: "checkin"|"stamp"}
- `POST /api/qr/scan` - Scan QR token {token, userId}

### Admin APIs
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/activities` - List all activities
- `PATCH /api/admin/activities/:id` - Update activity status {status: "approved"|"rejected"}
- `GET /api/admin/reports` - List all reports
- `PATCH /api/admin/reports/:id` - Update report status {status: "in_progress"|"resolved"|"rejected"}

## Seed Data
- Admin: ลงทะเบียนใหม่แล้วกรอกรหัสสภานักเรียน "สภานักเรียนปี2569/1_2" จะได้ role admin อัตโนมัติ
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

## Key Packages
- html5-qrcode, qrcode.react (QR system)
- date-fns (date formatting with Thai locale)

## Vercel Deployment
- `vercel.json` configured for Express + static frontend deployment
- In-memory storage (data resets on server restart for demo)
