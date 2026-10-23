
import AuthSwitchLink from "@/components/shared/AuthSwitchLink";
import LoginPage from "@/components/shared/LoginPage";

export default function UserLoginPage() {
  return (
    <LoginPage callbackURL="/">
      <AuthSwitchLink
        message="Don't have an account?"
        linkText="Create an account"
        href="/sign-up"
      />
    </LoginPage>
  );
}
