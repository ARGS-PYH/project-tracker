# PLTK v2 — Implementation status

This document records what is actually implemented in the `pltk-v2` branch versus what remains. It is intentionally more conservative than the complete product blueprint.

## Working foundation

- Public PLTK landing page with sign-in and sign-up calls to action.
- Responsive authenticated workspace shell and organisation switcher.
- Firebase Authentication email/password registration, sign-in, email verification and password reset.
- Initial organisation creation and user organisation index.
- Organisation-level launches collection and launch creation.
- Launch workspace with live task and milestone listeners.
- Task creation, editing, priority, due date, milestone link and status updates.
- Task list, draggable Kanban board, due-date timeline and monthly calendar views.
- Task subtasks with completion tracking.
- Task dependencies with circular-chain validation and completion guards.
- Task deletion with comment cleanup for project managers and organisation administrators.
- Task comments with author-scoped deletion, project-scoped read access and up to four image attachments (JPG, PNG, WEBP or GIF; 5 MB each).
- Project file upload/download with role-based Storage access and size/type limits.
- Milestone creation, editing, lifecycle status updates and progress derived from linked task records.
- Evidence-backed launch readiness checklist saved on the launch record.
- Append-only project activity records for core delivery actions.
- Live organisation-wide My Tasks, Milestones and Reports pages.
- Notifications inbox for records already present in the user's notification collection.
- Organisation name editing for owners and administrators.
- Organisation member invitation creation, 7-day expiry, verified-email acceptance, revoke, role changes and removal with project/team access cleanup.
- Organisation team creation with member selection.
- Light/dark theme tokens and responsive page layouts.
- Firestore/Storage rule baseline that denies unspecified access and scopes reads/writes by organisation/project membership.

## Known scope gaps

- The legacy project/task model is not migrated.
- Existing users, PINs and historical project data are not imported.
- Richer calendar interactions and dependency reporting remain incomplete.
- Milestone approval workflows remain incomplete.
- Richer activity history and filtering remain incomplete.
- Activity is written by authenticated project contributors and is append-only; it has not yet been independently audited.
- Notifications are read from the user's notification collection, but event generation, delivery preferences and email/push delivery remain incomplete.
- Organisation teams can be assigned to launches; team-specific task filters remain incomplete.
- Launch names, descriptions and target dates are editable by project managers and organisation administrators.
- Invitation links are shareable manually; automated invitation email delivery remains incomplete.
- Existing Express endpoints have not yet been redesigned for organisation-scoped, authenticated actions.
- Firestore and Storage rules have not yet been verified with automated emulator tests; the new task comments, activity and file paths still need emulator coverage.
- Dependency vulnerabilities reported by `npm ci` have not yet been triaged.

## Verification

The GitHub Actions workflow `.github/workflows/pltk-v2.yml` runs `npm ci` and `npm run build` on pushes to `pltk-v2`. A successful build confirms the frontend compiles; it does not verify Firebase rules, authentication configuration, runtime behaviour, migration safety or production readiness.

## Deployment boundary

The v2 branch is not deployed to the live Firebase Hosting site. Keep `main` and the live legacy application unchanged until v2 is fully tested and a migration/rollback plan is approved.
