import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "./AuthContext";

interface Props {
  className?: string;
}

function GoogleIcon() {
  return (
    <svg
      className="google-signin-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285f4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.29h6.47c-.28 1.5-1.13 2.77-2.4 3.62v2.95h3.89c2.27-2.09 3.53-5.17 3.53-8.59Z"
      />
      <path
        fill="#34a853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.89-2.95c-1.08.72-2.46 1.14-4.06 1.14-3.12 0-5.76-2.11-6.7-4.94H1.28v3.04A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#fbbc05"
        d="M5.3 14.34A7.21 7.21 0 0 1 4.92 12c0-.81.14-1.6.38-2.34V6.62H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4.02-3.04Z"
      />
      <path
        fill="#ea4335"
        d="M12 4.72c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.14 15.24 0 12 0A12 12 0 0 0 1.28 6.62L5.3 9.66C6.24 6.83 8.88 4.72 12 4.72Z"
      />
    </svg>
  );
}

export default function GoogleSignInButton({ className = "" }: Props) {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useGoogleLogin({
    scope: "openid profile email",
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);

      try {
        const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load Google profile");
        }

        const profile = await response.json();

        loginWithGoogle({
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        });
      } catch (error) {
        console.error("Google login failed", error);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setIsLoading(false);
      console.error("Google login failed");
    },
  });

  return (
    <button
      type="button"
      onClick={() => {
        setIsLoading(true);
        signIn();
      }}
      disabled={isLoading}
      className={className}
    >
      <GoogleIcon />
      <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
    </button>
  );
}
