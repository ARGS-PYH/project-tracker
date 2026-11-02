# PLTK v2 — Implementation status

This document records what is actually implemented in the `pltk-v2` branch versus what remains. It is intentionally more conservative than the complete product blueprint.

## Working foundation

- Public PLTK landing page with sign-in and sign-up calls to action.
- Responsive authenticated workspace shell and organisation switcher.
- Firebase Authentication email/password registration, sign-in, email verification and password reset.
- Initial organisation creation and user organisation index.
- Organisation-level launches collection and launch creation.
- Launch workspace with live task and milestone listeners.
- Task creation, priority, due date, milestone link and status updates.
- Milestone creation and progress derived from linked task records.
- Organisation member invitation creation, 7-day expiry, verified-email acceptance, revoke and member list.
- Organisation team creation with member selection.
- Light/dark theme tokens and responsive page layouts.
- Firestore/Storage rule baseline that denies unspecified access and scopes reads/writes by organisation/project membership.

## Known scope gaps

- The legacy project/task model is not migrated.
- Existing users, PINs and historical project data are not imported.
- Guests cannot yet browse assigned project lists; the project-level sharing experience must be completed before enabling guest invitations.
- Teams are organisational groupings, but launch/team assignment and team-specific task filters are not yet implemented.
- Task editing, board drag/drop, subtasks, comments, attachments, calendars and dependency management remain incomplete.
- Milestone editing, milestone approval and launch readiness checks remain incomplete.
- The activity log, notification centre, email delivery and reports remain incomplete.
- Existing Express endpoints have not yet been redesigned for organisation-scoped, authenticated actions.
- Firestore and Storage rules have not yet been verified with automated emulator tests.
- Dependency vulnerabilities reported by `npm ci` have not yet been triaged.

## Verification

The GitHub Actions workflow `.github/workflows/pltk-v2.yml` runs `npm ci` and `npm run build` on pushes to `pltk-v2`. A successful build confirms the frontend compiles; it does not verify Firebase rules, authentication configuration, runtime behaviour, migration safety or production readiness.

## Deployment boundary

The v2 branch is not deployed to the live Firebase Hosting site. Keep `main` and the live legacy application unchanged until v2 is fully tested and a migration/rollback plan is approved.
