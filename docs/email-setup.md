# LuneCraft SMTP email setup

The server sends invitation, Better Auth verification, and Admin access removal messages through the centralized Nodemailer transport in `lib/email.ts`. Gmail SMTP is configured as the temporary provider. Email credentials are server-only.

## Gmail setup

1. Create a dedicated Gmail account for LuneCraft system mail.
2. Enable Google 2-Step Verification on that account.
3. Create an App Password in the Google Account security settings. Use that App Password as `SMTP_PASS` without display spaces; do not use the account's normal password.
4. Set the following variables in the local server environment:

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

   `EMAIL_FROM` must match the authenticated Gmail sender (`SMTP_USER`). No custom domain is required.
5. In Vercel, set the same SMTP variables for the correct environments. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_BASE_URL` to the deployed app's HTTPS origin, such as `https://your-project.vercel.app`; do not use localhost in production.
6. Redeploy after changing Vercel environment variables.
7. Sign in as Super Admin and use **Admin Users → Test SMTP**. This calls Nodemailer's SMTP `verify()`; it does not send an email. To verify actual delivery, invite a test address that you control and inspect that mailbox.

`SMTP_PASS` and `SMTP_USER` must never use a `NEXT_PUBLIC_` prefix or be committed. Do not send credentials in chat. The application stores SMTP response and message ID server-side; admin UI/API responses omit raw SMTP responses. SMTP acceptance is not proof that the recipient inbox received the message.

## Database rollout

The staff lifecycle schema changes have migrations under `prisma/migrations/`, including invitation email metadata and `admin_access_removals`. Review the SQL and apply it to a development/test database before deploying code that reads these fields. Do not reset the production database. These migrations and seed changes have not been run as part of the staff lifecycle implementation.
