# PLTK Render task-assignment email setup

PLTK sends assignment mail from the trusted Express service on Render. Do not put SMTP credentials in Vite variables or commit them to GitHub.

## Render web-service environment

In the Render service that runs `npm start` / `node server.js`, add:

| Variable | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | `pltk-e38ef` |
| `FIREBASE_API_KEY` | The Web API key shown in Firebase Project settings for PLTK E3EF |
| `GMAIL_USER` | The mailbox that sends PLTK notifications |
| `GMAIL_APP_PASSWORD` | An app password for that mailbox (not its normal login password) |

The Firebase Web API key is used to ask Firebase Authentication to verify the user's ID token. It is a client identifier, not a service-account credential. Never place a Firebase service-account private key or Gmail app password in the browser build.

The sender mailbox must have two-step verification enabled and an app password available. If Gmail SMTP is not permitted for the mailbox, replace the Nodemailer transport with an approved transactional email provider before launch.

After setting the environment variables, redeploy the Render service.

## Vite client build environment

In the local project `.env` file (or the build environment used for Firebase Hosting), set:

```dotenv
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Replace the placeholder with the actual Render service URL. Do not include `/api/notify/assign`; the frontend adds that path itself.

Then rebuild and deploy Hosting:

```bash
npm run build
firebase deploy --only hosting --project pltk-e38ef
```

## What happens

- Task creation with an assignee sends one notification.
- Reassigning a task to a different member sends one new notification.
- Editing task details without changing the assignee does not send another email.
- The Render endpoint verifies the Firebase ID token, checks that the sender can contribute to the launch, reads the assignee's email from the organisation membership record, and confirms that the task is assigned to that member.
- A task-level notification ID prevents duplicate delivery for the same assignment event.
- If email configuration or delivery fails, the task remains saved and PLTK displays the notification failure in the workspace.

Test with two verified team accounts before using customer workspaces. Also check the receiving mailbox's spam folder during the initial sender-reputation period.
