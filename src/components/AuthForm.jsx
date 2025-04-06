import { useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithPopup,
  fetchSignInMethodsForEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { ensureUserDocument } from "../utils/firebase";
import {
  auth,
  googleProvider,
  createUserDocument,
  getUserDocument,
} from "../utils/firebase";

const AVATARS = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar5.png",
];

const EyeIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

export default function AuthForm({ onSuccess }) {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setMessage({ text: "", type: "" });
  };

  const validateForm = () => {
    if (!email || !password) {
      setMessage({ text: "All fields are required", type: "error" });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ text: "Please enter a valid email address", type: "error" });
      return false;
    }

    if (isSignup && password.length < 8) {
      setMessage({
        text: "Password must be at least 8 characters",
        type: "error",
      });
      return false;
    }

    return true;
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserDocument(result.user);
      router.push("/dashboard?firstTime=true");
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    setIsLoading(true);
    try {
      if (isSignup) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await ensureUserDocument(userCredential.user);
        router.push("/dashboard?firstTime=true");
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        await ensureUserDocument(userCredential.user);
        router.push("/dashboard");
      }
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error) => {
    const errorMap = {
      "auth/invalid-credential": "Invalid email or password",
      "auth/email-already-in-use": "Email already registered. Please log in.",
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
      "auth/invalid-email": "Please enter a valid email address",
      "auth/weak-password": "Password must be at least 8 characters",
      "auth/network-request-failed": "Network error. Check your connection",
      "auth/operation-not-allowed": "Email/password accounts not enabled",
      default: "An error occurred. Please try again.",
    };

    return errorMap[error.code] || errorMap["default"];
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    return Math.min(strength, 5);
  };

  const passwordStrength = isSignup ? getPasswordStrength() : 0;
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ];

  const toggleAuthMode = () => {
    resetForm();
    setIsSignup(!isSignup);
  };

  return (
    <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setIsSignup(true)}
          className={`flex-1 py-4 font-bold ${
            isSignup ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          disabled={isLoading}
        >
          Sign Up
        </button>
        <button
          onClick={() => setIsSignup(false)}
          className={`flex-1 py-4 font-bold ${
            !isSignup ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
          }`}
          disabled={isLoading}
        >
          Log In
        </button>
      </div>

      <div className="p-6 sm:p-8">
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-900 text-green-300"
                : "bg-red-900 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300"
              >
                Password
              </label>
              {isSignup && password && (
                <span className="text-xs text-gray-400">
                  Strength: {passwordStrength}/5
                </span>
              )}
            </div>

            <div className="relative">
              <input
                id="password"
                type={passwordVisible ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                disabled={isLoading}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                onClick={() => setPasswordVisible(!passwordVisible)}
                disabled={isLoading}
              >
                {passwordVisible ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {isSignup && (
              <div className="mt-1 flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < passwordStrength
                        ? passwordStrength <= 2
                          ? "bg-red-500"
                          : passwordStrength <= 4
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {!isSignup && (
            <div className="text-right">
              <button
                className="text-sm text-blue-400 hover:text-blue-300"
                onClick={() => router.push("/reset-password")}
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            onClick={handleEmailAuth}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-bold ${
              isLoading
                ? "bg-blue-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white flex items-center justify-center`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isSignup ? "Creating Account..." : "Logging In..."}
              </>
            ) : isSignup ? (
              "Create Account"
            ) : (
              "Log In"
            )}
          </button>
        </div>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 border border-gray-600 rounded-lg font-medium text-white bg-gray-700 hover:bg-gray-600"
        >
          <svg
            className="w-5 h-5 mr-2"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M23.7663 12.2764C23.7663 11.4607 23.7001 10.6406 23.559 9.83807H12.2402V14.4591H18.722C18.453 15.9494 17.5888 17.2678 16.3233 18.1056V21.1039H20.1903C22.4611 19.0139 23.7663 15.9274 23.7663 12.2764Z"
              fill="#4285F4"
            />
            <path
              d="M12.2401 24.0008C15.4766 24.0008 18.2059 22.9382 20.1945 21.1039L16.3276 18.1055C15.2517 18.8375 13.8627 19.252 12.2445 19.252C9.11388 19.252 6.45946 17.1399 5.50705 14.3003H1.5166V17.3912C3.55371 21.4434 7.7029 24.0008 12.2401 24.0008Z"
              fill="#34A853"
            />
            <path
              d="M5.50277 14.3003C4.99987 12.8099 4.99987 11.1961 5.50277 9.70575V6.61481H1.51674C-0.185266 10.0056 -0.185266 14.0004 1.51674 17.3912L5.50277 14.3003Z"
              fill="#FBBC04"
            />
            <path
              d="M12.2401 4.74966C13.9509 4.7232 15.6044 5.36697 16.8434 6.54867L20.2695 3.12262C18.1001 1.0855 15.2208 -0.034466 12.2401 0.000808666C7.7029 0.000808666 3.55371 2.55822 1.5166 6.61481L5.50264 9.70575C6.45064 6.86173 9.10947 4.74966 12.2401 4.74966Z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={toggleAuthMode}
            className="text-blue-400 hover:text-blue-300 font-medium"
            disabled={isLoading}
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
