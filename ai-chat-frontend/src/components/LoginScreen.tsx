import GoogleSignInButton from "./GoogleSignInButton";
import "../css/LoginScreen.css";

export default function LoginScreen() {
  return (
    <div className="login-screen min-h-screen flex items-center justify-center">
      <div
        className="login-card flex flex-col items-center gap-6 p-10 rounded-2xl"
      >
        {/* Logo */}
        <div
          className="login-logo flex items-center justify-center"
        >
          <span className="login-logo-mark">✦</span>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="login-title">
            AI Chat Bot
          </h1>
          <p className="login-copy">
            Sign in to save your chat history
            <br />and continue where you left off.
          </p>
        </div>

        <GoogleSignInButton className="login-google-button flex items-center justify-center" />

        <p className="login-note">
          Your data stays in your browser.
          <br />We never store your conversations on a server.
        </p>
      </div>
    </div>
  );
}
