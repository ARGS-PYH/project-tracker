# PLTK — Product Launch Tracker

PLTK is a launch-first collaboration platform for organisations coordinating the teams, tasks and milestones involved in bringing products to market.

## V2 development

The current v2 implementation is being developed on the `pltk-v2` branch. The existing `main` branch and live Firebase deployment are being kept separate until v2 passes functional, migration and security verification.

### Implemented on `pltk-v2`

- Redesigned public PLTK landing page and application shell.
- Firebase email/password sign-in and registration, email verification and password reset.
- Organisation creation and organisation switching.
- Organisation member invitations using expiring links, verified-email acceptance and member records.
- Organisation member role changes and removal with project, team and navigation-index cleanup.
- Organisation team creation and member assignment.
- Launch creation and organisation launch listing.
- Launch workspace with task creation, editing, priorities, due dates, milestone linking and status updates.
- Task list, draggable Kanban board, due-date timeline and monthly calendar views.
- Subtasks with completion tracking and role-controlled task deletion.
- Task discussions using project-scoped comments.
- Project file uploads and downloads with a 10 MB limit and role-scoped Storage access.
- Evidence notes and completion checks in the launch-readiness checklist.
- Append-only project activity records for task, milestone, comment, file and readiness updates.
- Live organisation-wide My Tasks, Milestones and Reports pages.
- Notifications inbox for records already written to the user's notification collection.
- Organisation name settings for owners and administrators.
- Milestone creation, editing, status updates and task-linked milestone progress.
- Assign organisation teams to each launch.
- Responsive layouts and light/dark design tokens.
- Tenant-scoped Firestore and Firebase Storage rule baselines.
- GitHub Actions production build check.

### Still to implement

- Richer calendar interactions and dependency reporting.
- Richer task history and activity filtering.
- Milestone approvals and multi-step completion workflows.
- Automated notification generation, delivery preferences and email/push delivery.
- Backend email delivery for organisation invitations and notifications.
- Team-specific task filters and workload management.
- Launch settings and lifecycle approvals.
- Legacy PLTK project/member/task migration tooling.
- Automated Firestore and Storage rules tests using the Firebase Emulator.
- Dependency and full application security audit.

## Product structure

**User → Organisation → Teams → Launches → Milestones → Tasks**

Each organisation is an independent tenant. Standard organisation members can collaborate across that organisation. Project-level guest access is reserved for the upcoming project-sharing workflow.

Product and engineering decisions are recorded in [docs/PLTK-V2-FOUNDATION.md](docs/PLTK-V2-FOUNDATION.md).

## Technology

- React 18 and Vite
- React Router
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Node.js and Express for trusted backend services

## Local development

1. Clone and switch to the v2 branch:

   ```bash
   git clone https://github.com/ARGS-PYH/project-tracker.git
   cd project-tracker
   git checkout pltk-v2
   ```

2. Install packages:

   ```bash
   npm ci
   ```

3. Configure Firebase client values with Vite environment variables in your local `.env` file. Do not put private service-account credentials, SMTP passwords or other server secrets in Vite variables.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173/` for the public page or `http://localhost:5173/app` for the application.

6. Build:

   ```bash
   npm run build
   ```

## Firebase setup

Enable the Email/Password sign-in provider in Firebase Authentication and configure authorised domains and email verification. The invitation acceptance flow requires the invited account to have a verified email address matching the invitation.

The v2 rule files are:

- `firestore.rules`
- `storage.rules`

They are committed to this branch but are **not deployed automatically by the Vite build**. The rule baselines must be tested with the Firebase Emulator and reviewed against all required workflows before deployment.

## Production safety

The current live application uses the legacy data model. Do not deploy the v2 Firestore rules to the production Firebase project while the legacy PIN-based application is still in use; those rules are not compatible with the legacy model.

Before any production migration:

- Back up current Firestore data and Storage files.
- Map legacy workspaces, members, PIN records, task groups, task state, private tasks, comments and image attachments into the new organisation-first model.
- Test migration on an isolated Firebase project.
- Verify data counts, relationships, ownership and access boundaries.
- Prepare and rehearse a rollback.
- Deploy v2 only after the new app and rules have passed acceptance and security tests.

Never use production records as test fixtures.
