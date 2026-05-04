# Judging Platform Development Roadmap

## Overview

Build a controlled judging platform for a mini project competition with one admin, multiple judges, strict team assignment visibility, and sequential review flow with no edit or undo after submission.

---

## 1. Scope and Rules

### Roles
- **Admin**
  - Create and manage judges
  - Create and manage teams
  - Assign 10 teams to a pair of judges
  - Reveal assignments when ready
  - View results

- **Judges**
  - Can only access their assigned slot after reveal
  - Review teams one by one in order
  - Submit ratings once per team
  - Cannot edit, undo, or skip backward

### Core Constraints
- Assignments are hidden until revealed
- Each slot contains exactly 2 judges and 10 teams
- Judges see only one team review form at a time
- Once submitted, a review is locked permanently
- No backtracking or editing is allowed

---

## 2. Recommended Stack

### Fast and practical option
- **Frontend:** Next.js + Tailwind CSS
- **Backend:** Next.js API routes or Express.js
- **Database:** Firestore or Supabase
- **Auth:** Firebase Auth or Supabase Auth

### Why this stack
- Quick to build
- Easy role-based access control
- Good for dashboards and forms
- Simple deployment

---

## 3. Data Model

### Users
Stores admin and judge accounts.

```json
{
  "id": "uuid",
  "name": "Judge Name",
  "email": "judge@example.com",
  "role": "admin | judge",
  "created_at": "timestamp"
}
```

### Teams
Stores all participating teams.

```json
{
  "id": "uuid",
  "team_name": "Team Alpha",
  "project_title": "Smart Attendance System",
  "description": "Short project summary",
  "slot_number": 1,
  "created_at": "timestamp"
}
```

### Assignments
Each assignment maps 2 judges to 10 teams.

```json
{
  "id": "uuid",
  "judge_ids": ["judge1_uuid", "judge2_uuid"],
  "team_ids": ["team1_uuid", "team2_uuid", "team3_uuid"],
  "revealed": false,
  "started": false,
  "current_index": 0,
  "created_at": "timestamp"
}
```

### Reviews
Stores one final review per team per judge.

```json
{
  "id": "uuid",
  "assignment_id": "uuid",
  "judge_id": "uuid",
  "team_id": "uuid",
  "scores": {
    "novelty": 5,
    "creativity": 4,
    "execution": 5,
    "presentation": 4,
    "feasibility": 5
  },
  "submitted_at": "timestamp"
}
```

---

## 4. Workflow

### Admin workflow
1. Create judge accounts
2. Create teams
3. Form assignment groups
4. Attach 2 judges to 10 teams
5. Keep assignments hidden
6. Reveal when judging starts

### Judge workflow
1. Log in
2. See assignment only after reveal
3. Click **Start Review**
4. Review current team
5. Submit scores
6. Automatically move to next team
7. Finish after 10 teams

---

## 5. Review Form Design

### Suggested criteria
Each criterion can be rated from 1 to 5 stars.

- Novelty
- Creativity
- Execution
- Presentation
- Feasibility

### Form behavior
- Show one team at a time
- Save on submit
- Disable editing after save
- Auto-load next team
- Hide future teams

---

## 6. Development Phases

### Phase 0 — Planning
**Goal:** finalize rules and scoring structure

Tasks:
- Decide criteria list
- Fix 10 teams per slot
- Fix 2 judges per slot
- Decide whether judges review independently or jointly
- Finalize role permissions

Deliverable:
- Final requirements document

---

### Phase 1 — Project Setup
**Goal:** initialize the app

Tasks:
- Set up repository
- Install frontend and backend dependencies
- Configure Tailwind CSS
- Configure authentication
- Configure database connection

Deliverable:
- Running app shell with login page

---

### Phase 2 — Database and Access Control
**Goal:** build the data foundation

Tasks:
- Create user, team, assignment, and review collections/tables
- Add role-based access checks
- Restrict judges from viewing unrevealed assignments
- Restrict edits after submission

Deliverable:
- Secure data layer

---

### Phase 3 — Admin Panel
**Goal:** enable admin operations

Tasks:
- Add judge form
- Add team form
- Build assignment creator
- Assign 2 judges to 10 teams
- Reveal assignments button
- View assignments and submitted reviews

Deliverable:
- Functional admin dashboard

---

### Phase 4 — Judge Review Flow
**Goal:** create the judging experience

Tasks:
- Judge dashboard
- Start review button
- One-team-at-a-time review screen
- Star rating inputs
- Submit and lock response
- Auto-advance to next team
- Completion state

Deliverable:
- Full sequential review flow

---

### Phase 5 — Hardening
**Goal:** prevent misuse and edge-case failures

Tasks:
- Validate every action on the backend
- Block duplicate submissions
- Block edits and back navigation
- Handle refresh/reload safely
- Add confirmation before final submit
- Add loading and error states

Deliverable:
- Stable and reliable judging platform

---

### Phase 6 — Polish
**Goal:** improve usability

Tasks:
- Progress indicator like 3/10
- Completion screen
- Export results
- Summary view for admin
- Better mobile responsiveness

Deliverable:
- Clean production-ready UX

---

## 7. Suggested API Endpoints

### Admin
- `POST /api/judges`
- `POST /api/teams`
- `POST /api/assignments`
- `PATCH /api/assignments/:id/reveal`
- `GET /api/admin/results`

### Judges
- `GET /api/judge/assignment`
- `GET /api/judge/current-team`
- `POST /api/reviews`
- `GET /api/judge/progress`

---

## 8. State Flow

```text
NOT_REVEALED
   ↓
REVEALED
   ↓
STARTED
   ↓
IN_PROGRESS
   ↓
COMPLETED
```

The backend must enforce this flow so the frontend cannot bypass it.

---

## 9. Security Rules

- Judges can read only their own assignment
- Judges can write only their own review for the current team
- Judges cannot update an existing review
- Admin has full control
- Assignment data stays hidden until reveal

---

## 10. Suggested Folder Structure

```text
/app
  /admin
  /judge
  /login
/lib
  auth.js
  db.js
  constants.js
/api
  /assignments
  /reviews
  /teams
  /judges
/components
  /forms
  /dashboard
  /rating
```

---

## 11. Realistic Timeline

### Day 1
- Project setup
- Authentication
- Basic database schema

### Day 2
- Admin panel
- Teams and judges management
- Assignment creation

### Day 3
- Judge review flow
- One-by-one team review
- Submission locking

### Day 4
- Validation and security
- Error handling
- Edge case fixes

### Day 5
- Polish and testing
- Export and summary features

---

## 12. MVP Goal

The minimum usable version should support:
- Admin creating judges and teams
- Admin assigning 2 judges to 10 teams
- Admin revealing the assignment
- Judges reviewing one team at a time
- Locked submission with no edits or undo
- Progress tracking until completion

---

## 13. Final Note

This is best built as a **state-driven system**, not just a form app. The important part is enforcing the sequence and locking rules on the backend, not only in the UI.
