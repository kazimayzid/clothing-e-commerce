# Admin RBAC and invitations

## Email delivery

Admin invitations and Better Auth verification emails use the centralized Nodemailer SMTP transport through `lib/email.ts`. Follow [email-setup.md](email-setup.md) to create a Gmail App Password and configure the server environment before sending invitations:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-sender@gmail.com
SMTP_PASS=your-google-app-password
EMAIL_FROM=LuneCraft <your-sender@gmail.com>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

SMTP credentials are server-only and `EMAIL_FROM` must match the authenticated sender. Production invitation links require the public HTTPS application URL. Invitation history records the SMTP/Resend provider, message ID, SMTP response, attempt state, and last safe error. SMTP acceptance does not confirm inbox delivery. Public signup keeps Better Auth's configured email verification behavior. Existing accounts invited to staff must already have verified email; a new account can use the emailed invitation link as proof of mailbox access during acceptance.

## Database rollout

The migration history preserves existing Resend invitation IDs/statuses and adds removal notification audit records. The lifecycle code should be exercised first against a development/test database. Review and apply pending migrations through your normal database release process before deploying the app changes. The seed remains an upsert-based operation; do not run it or any migration against production as part of local QA.
