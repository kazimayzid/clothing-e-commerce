
import AuthSwitchLink from "@/components/shared/AuthSwitchLink";
import LoginPage from "@/components/shared/LoginPage";

export default function UserLoginPage() {
  return (
    <LoginPage audience="customer" callbackURL="/account">
      <AuthSwitchLink
        message="Don't have an account?"
        linkText="Create an account"
        href="/sign-up"
      />
    </LoginPage>
  );
}
