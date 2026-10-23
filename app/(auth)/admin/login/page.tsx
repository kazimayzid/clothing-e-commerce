import LoginPage from "@/components/shared/LoginPage";

export default function AdminLoginPage() {
  return (
    <LoginPage
      heading="Administrator Sign In"
      description="Sign in to access the administration panel"
      callbackURL="/admin"
    />
  );
}