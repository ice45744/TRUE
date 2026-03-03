# S.T. ก้าวหน้า - ระบบดิจิทัลสภานักเรียน

## Overview
A Thai school student digital system for managing goodness activities, stamp collection, announcements, and issue reporting.

## Architecture
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui, Thai language (Sarabun font)
- **Backend**: Express.js with in-memory storage
- **Auth**: localStorage-based client auth (no sessions needed for simplicity)
- **Routing**: wouter for client-side routing

## Features
1. **Authentication** - Login/Register with student ID and password
2. **Home Dashboard** - Welcome header (blue gradient), merit points, stamp count, announcements preview, quick actions
3. **Activities Page** - Two tabs:
   - ความดี (Goodness): Check-in via QR simulation, activity submission form
   - ธนาคารขยะ (Trash Bank): Stamp card (10 stamps), rewards catalog
4. **Announcements** - List of school announcements (expandable cards)
5. **Report/Complaint** - Form with category select, details textarea, image link
6. **Profile** - Avatar, stats, settings links, logout

## Routes
- `/auth` - Login/Register page
- `/` - Home dashboard (protected)
- `/activities` - Activities page (protected)
- `/announcements` - Announcements page (protected)
- `/report` - Report/complaint page (protected)
- `/profile` - Profile page (protected)

## API Endpoints
- `POST /api/auth/login` - Login with studentId + password
- `POST /api/auth/register` - Register new user
- `GET /api/users/:id` - Get user by ID
- `GET /api/announcements` - Get all announcements
- `POST /api/announcements` - Create announcement
- `GET /api/activities/:userId` - Get user activities
- `POST /api/activities/:userId` - Create activity (auto-awards merits/stamps)
- `GET /api/reports/:userId` - Get user reports
- `POST /api/reports/:userId` - Create report

## Seed Data
- Demo user 1: studentId="19823", password="1234", name="Kittipot Ice"
- Demo user 2: studentId="12345", password="1234", name="สมชาย ใจดี"
- 2 pre-seeded announcements

## Design
- Mobile-first layout, max-width 480px centered
- Background: #F0F4FA (light blue-gray)
- Primary: Blue gradient (#4F8EF7 to #2563EB)
- Font: Sarabun (Thai) + Inter
- Bottom tab navigation (5 tabs)

## Vercel Deployment
- `vercel.json` configured for Express + static frontend deployment
- In-memory storage (data resets on server restart for demo)
