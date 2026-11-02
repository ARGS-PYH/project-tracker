# PLTK v2 — Product and Application Foundation

**Product:** PLTK — Product Launch Tracker  
**Positioning:** A launch-first project execution platform for multiple organisations and teams.  
**Design direction:** Modern, minimal, professional; responsive; light and dark themes.  
**Status:** Architecture baseline for the `pltk-v2` branch. This document does not authorise changes to production data.

## 1. Product principles

1. Launch-first, not a generic task manager: make launch progress, readiness, owners, dates and blockers easy to understand.
2. Multi-tenant by design: every organisation's data is isolated from every other organisation.
3. Simple by default: expose essential workflows first; keep advanced controls contextual.
4. Clear accountability: every task and milestone has an owner, status and useful history.
5. Honest progress: distinguish task completion from launch readiness; never infer launch approval from a percentage alone.
6. Preserve existing value: migrate existing PLTK functionality and data deliberately; do not discard it during redesign.

## 2. Information architecture

### Account and organisation
- A user authenticates with an individual account.
- A user may belong to multiple organisations.
- Each organisation has its own members, teams, projects, settings and reports.
- Users switch organisations through a persistent organisation switcher.

### Primary navigation
- Overview
- Launches
- My Tasks
- Milestones
- Teams
- Reports
- Notifications
- Organisation Settings
- Members & Permissions
- My Account

### Launch workspace navigation
- Overview
- Board
- List
- Calendar
- Milestones
- Team
- Activity
- Files
- Reports
- Settings

The initial release should prioritise Overview, Launches, My Tasks, Teams and Settings. Calendar and advanced reporting can follow after the underlying task and date model is stable.

## 3. Core domain model

### User
- Identity is managed by Firebase Authentication.
- Profile data is separate from organisation membership.
- No password or reusable PIN is stored in Firestore.

### Organisation
- Has an owner, name, slug, status, preferences and timestamps.
- Organisation membership is the tenant boundary.
- A user can belong to more than one organisation.

### Membership
- Links a user to an organisation.
- Organisation roles: `owner`, `admin`, `member`, `guest`.
- Membership status: `invited`, `active`, `suspended`.
- Privileged role changes must be validated by trusted server-side code.

### Team
- Belongs to one organisation.
- Has a name, description and member references.
- Teams help organise people; they do not grant access outside the organisation.

### Launch / Project
- Belongs to exactly one organisation.
- Has a name, description, owner, status, start date, target launch date, participating teams and configurable launch stages.
- Project access is granted to organisation members according to role and project membership rules.

### Milestone
- Belongs to one launch.
- Has an owner, target date, status, deliverables and linked tasks.
- Milestone status is explicit; completion is not inferred only from a task percentage.

### Task
- Belongs to one launch and optionally one milestone.
- Has title, description, status, priority, assignees, start/due dates, subtasks, comments and attachments.
- Initial statuses: `backlog`, `todo`, `in_progress`, `in_review`, `blocked`, `done`.
- Initial priorities: `low`, `medium`, `high`, `urgent`.

### Activity, notification and files
- Activity records capture important project events with actor, action, target and timestamp.
- Notifications are scoped to recipients and organisation/project context.
- File binaries live in Firebase Storage; Firestore stores metadata and access context only.

## 4. Initial Firestore shape

The following is a logical model. Exact collection names, indexes and document fields must be validated during implementation.

```text
users/{uid}
  organisations/{orgId}/members/{uid}
  organisations/{orgId}/teams/{teamId}
  organisations/{orgId}/invitations/{invitationId}
  organisations/{orgId}/projects/{projectId}
    members/{uid}
    milestones/{milestoneId}
    tasks/{taskId}
    activity/{activityId}
    files/{fileId}

users/{uid}/notifications/{notificationId}
users/{uid}/personalTasks/{taskId}
```

All tenant-owned reads and writes must be protected by rules that verify authenticated identity, organisation membership and the requested action. Client-side route guards and hidden buttons are not security controls.

## 5. Roles and permissions

### Organisation roles
- **Owner:** full organisation control, including ownership and billing settings.
- **Admin:** manage members, teams, projects and organisation settings, except ownership transfer and other owner-only actions.
- **Member:** participate in permitted projects and teams.
- **Guest:** limited access to explicitly shared projects.

### Project roles
- **Project manager:** manage project configuration, milestones, tasks and project membership within organisation policy.
- **Contributor:** work on assigned or otherwise permitted tasks and collaborate.
- **Viewer:** read-only access to the project areas explicitly granted.

The permission matrix must be documented and enforced in trusted backend operations and Firestore/Storage rules. Organisation membership does not automatically mean access to every restricted project.

## 6. Application route map

Public:
- `/login`
- `/signup`
- `/invite/:token`

Authenticated:
- `/app` — organisation overview
- `/app/launches`
- `/app/launches/new`
- `/app/launches/:projectId`
- `/app/launches/:projectId/board`
- `/app/launches/:projectId/list`
- `/app/launches/:projectId/calendar`
- `/app/launches/:projectId/milestones`
- `/app/launches/:projectId/team`
- `/app/launches/:projectId/activity`
- `/app/launches/:projectId/files`
- `/app/launches/:projectId/reports`
- `/app/tasks`
- `/app/milestones`
- `/app/teams`
- `/app/reports`
- `/app/notifications`
- `/app/settings/*`

Route protection improves navigation and user experience; database and API authorisation remain mandatory.

## 7. Design system baseline

- Visual character: calm, precise, professional and low-clutter.
- Typography: Inter, with a consistent type scale.
- Layout: persistent desktop navigation; compact responsive navigation on small screens.
- Spacing: consistent 8px-based spacing scale.
- Surfaces: restrained borders, subtle elevation and consistent 10–14px control/card radii.
- Colour: neutral surfaces with a restrained green brand accent; semantic colours for success, warning, danger and information.
- Themes: light and dark themes share the same semantic tokens and component behaviour.
- Components: buttons, inputs, selects, dialogs, cards, badges, tables, tabs, avatars, empty states, skeletons, toasts and confirmation patterns.
- Accessibility: keyboard support, visible focus, semantic controls and WCAG-conscious contrast.

Avoid emoji as primary navigation or action icons. Use a consistent icon set.

## 8. Launch readiness

Launch readiness is a transparent checklist across configurable workstreams such as Product, Engineering, Quality, Marketing, Operations and Leadership.

Each check has:
- an accountable owner;
- a status such as `not_started`, `in_progress`, `ready` or `blocked`;
- evidence or linked deliverables where relevant;
- an optional approver and approval timestamp.

Any displayed score must explain its calculation and show unresolved blockers. A numeric score must never automatically approve or declare a launch safe.

## 9. Existing PLTK functionality to preserve or evolve

- Shared phase tasks → milestones and launch tasks.
- Private tasks → user-owned personal tasks.
- PIN team selection → authenticated accounts, organisation invitations and role-based access.
- Countdown → launch and milestone dates.
- Presence → reliable, privacy-conscious collaboration presence.
- Task comments → activity and collaboration history.
- Email assignment/completion notifications → configurable notification service.
- Progress statistics → dynamic task, milestone and launch reporting.
- Attachments → Firebase Storage with validated uploads and metadata.

## 10. Engineering approach

The existing React 18 + Vite + Firebase + Node/Express stack can be retained initially. Avoid a framework migration while the product model is changing.

Organise frontend code by feature/domain (authentication, organisations, dashboard, launches, tasks, milestones, teams, notifications and reports), with shared components, layouts, services, hooks, validation and styles separated from feature logic.

Move privileged operations behind trusted backend functions. Adopt TypeScript incrementally for domain models, validation boundaries and critical services rather than converting every existing file in one pass.

## 11. Migration and release safeguards

1. Keep `main` and the current production deployment unchanged while v2 is built on `pltk-v2`.
2. Inventory existing Firestore documents and current user/project flows before designing migration scripts.
3. Define explicit mappings from existing projects, members, phases, tasks, checked state, private tasks, comments and attachments to the new model.
4. Back up and validate source data before any production migration.
5. Test migration on a separate Firebase project or isolated test dataset first.
6. Do not delete or overwrite legacy data until counts, relationships, permissions and representative user journeys have been verified.
7. Switch production only after acceptance tests, security tests and rollback planning are complete.

The currently deployed Firestore rules are permissive and must be contained before confidential data is used. Do not wait for the final audit to address an actively exposed database. Any emergency production rule change must be tested against required legitimate workflows and coordinated with the deployment owner.

## 12. Definition of done

- Users can register, sign in and accept organisation invitations.
- A user can belong to multiple organisations and switch between them.
- Organisation data is isolated at database and storage layers.
- Owners/admins can manage teams and members within their authority.
- Teams can create launches, milestones and tasks.
- Tasks support status, priority, assignees, dates, comments and attachments.
- Users can see their own work across permitted projects.
- Launch readiness shows evidence, ownership and blockers.
- Updates remain consistent across sessions and concurrent users.
- The application works on desktop, tablet and mobile.
- Light and dark themes are complete and consistent.
- Automated tests cover core workflows and access-control boundaries.
- Production migration has a backup, validation report and rollback plan.
