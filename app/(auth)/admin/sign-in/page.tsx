import LoginPage from "@/components/shared/LoginPage";

export default function AdminSigninPage() {
  return (
    <LoginPage
      audience="internal"
      heading="Administrator Sign In"
      description="Sign in to access the administration panel"
      callbackURL="/admin/dashboard"
    />
  );
}
