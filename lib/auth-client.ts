
import { createAuthClient } from "better-auth/react";

// Login and invitation flows validate the signed-in account before navigating.
// Keep Better Auth's redirect plugin from navigating as soon as a callbackURL
// is returned, before those application checks have completed.
export const authClient = createAuthClient({
  disableDefaultFetchPlugins: true,
});
