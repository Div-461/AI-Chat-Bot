import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleSignInButton from "./GoogleSignInButton";

interface Props {
  className?: string;
}

export default function GoogleSignIn({ className = "" }: Props) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleSignInButton className={className} />
    </GoogleOAuthProvider>
  );
}
