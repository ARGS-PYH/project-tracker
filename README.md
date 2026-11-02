# PLTK — Product Launch Tracker

PLTK is a collaborative product launch management platform for organisations and the teams involved in bringing products to market.

The product is being restructured on the `pltk-v2` branch around an organisation-first model:

**User → Organisation → Teams → Launches → Milestones → Tasks**

## Current development state

- The existing application remains available through the legacy routes while v2 is developed.
- The new v2 workspace is mounted at `/app`.
- V2 foundation: Firebase email/password authentication, email verification, organisation creation, organisation switching, launch creation and a responsive dashboard shell.
- The v2 Firestore rules use organisation membership and project membership checks. The v2 Storage rules restrict access to organisation/project paths.
- The product and architecture decisions are documented in [docs/PLTK-V2-FOUNDATION.md](docs/PLTK-V2-FOUNDATION.md).

V2 is under active development. The task board, milestone workflows, team invitations, activity timeline, readiness checks and reports are not complete yet.

## Technology

- React 18 and Vite
- React Router
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Node.js and Express for trusted backend services

## Local development

1. Clone the repository and check out the v2 branch:

   ```bash
   git clone https://github.com/ARGS-PYH/project-tracker.git
   cd project-tracker
   git checkout pltk-v2
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Configure the Firebase client settings with Vite environment variables in a local `.env` file. Do not commit private service-account credentials, SMTP passwords or other server secrets.

4. Start the Vite development server:

   ```bash
   npm run dev
   ```

5. Open the v2 workspace at `/app`.

6. Create a production build:

   ```bash
   npm run build
   ```

## Firebase setup for v2

Enable the Email/Password provider in Firebase Authentication and configure the authorised domains and email verification settings.

The v2 rule files are:

- `firestore.rules`
- `storage.rules`

They are versioned in this branch but are **not deployed automatically** by the application build. Test them against the intended workflows and a non-production Firebase project before deploying.

## Production safety

Keep `main` and the existing production application unchanged while v2 is being developed. Before migrating existing projects, members, tasks, comments or attachments:

- Back up the current Firestore data.
- Map legacy records to the organisation-first model.
- Test the migration on an isolated dataset.
- Verify counts, ownership and access rules.
- Prepare a rollback plan.

Never use production data as a test fixture.
