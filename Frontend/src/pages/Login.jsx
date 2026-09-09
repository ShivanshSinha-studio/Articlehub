import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, User, UserRoundPen } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../authContext";
import { GOOGLE_CLIENT_ID } from "../constants";
import { googleAuth, login, register } from "../utility/api";
import { setDocumentMeta } from "../utility/seo";

const MotionSection = motion.section;

export default function Login({ mode = "login" }) {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const { setUser, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", requestedRole: "user", authorRequestMessage: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef(null);
  const googleFormRef = useRef(form);
  const googleInitializedRef = useRef(false);

  useEffect(() => {
    googleFormRef.current = form;
  }, [form]);

  useEffect(() => {
    setDocumentMeta({
      title: isRegister ? "Create Account | Article Hub" : "Login | Article Hub",
      description: "Access your Article Hub reading, publishing, and editorial workspace.",
    });
  }, [isRegister]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return undefined;

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !googleButtonRef.current) return;
      if (googleInitializedRef.current) return;

      googleInitializedRef.current = true;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          setLoading(true);
          setError("");
          setNotice("");
          try {
            const currentForm = googleFormRef.current;
            const user = await googleAuth({
              credential,
              requestedRole: isRegister ? currentForm.requestedRole : "user",
              authorRequestMessage: isRegister ? currentForm.authorRequestMessage : "",
            });
            setUser(user);
            await refreshUser();
            navigate("/dashboard");
          } catch (err) {
            setError(err.response?.data?.message || "Google sign-in failed.");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: Math.min(420, googleButtonRef.current.offsetWidth || 420),
        text: isRegister ? "signup_with" : "signin_with",
        shape: "rectangular",
      });
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [isRegister, navigate, refreshUser, setUser]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (isRegister) {
        const data = await register(form);
        setNotice(
          data.verificationUrl
            ? `${data.message} Dev verification link: ${data.verificationUrl}`
            : data.message
        );
        setForm({ name: "", email: form.email, password: "", requestedRole: "user", authorRequestMessage: "" });
      } else {
        const user = await login({ email: form.email, password: form.password });
        setUser(user);
        await refreshUser();
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page px-4 py-8 sm:px-6 lg:px-8">
      <MotionSection
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-shell mx-auto grid w-full max-w-6xl overflow-hidden lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="auth-visual-panel p-6 text-white sm:p-8 lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/articlehub-logo.svg" alt="" className="brand-logo h-11 w-11 border border-white/15 shadow-2xl shadow-black/25" aria-hidden="true" />
              <span className="text-lg font-black">ARTICLE HUB</span>
            </div>
            <span className="hidden items-center gap-2 border border-white/15 bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-teal-100 backdrop-blur sm:inline-flex">
              <ShieldCheck size={14} />
              Secure access
            </span>
          </div>

          <div className="relative z-10 mt-16 max-w-xl lg:mt-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Editorial access</p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              {isRegister ? "Create your reading and publishing identity." : "Return to your Article Hub workspace."}
            </h1>
            <p className="mt-5 max-w-md text-sm font-semibold leading-7 text-stone-200">
              {isRegister
                ? "Save articles, follow ideas, and request author access when you are ready to publish."
                : "Continue reading, save important stories, and manage your editorial tools from one place."}
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                ["Reader", "Library"],
                ["Author", "Studio"],
                ["Admin", "Review"],
              ].map(([label, value]) => (
                <div key={label} className="auth-visual-stat">
                  <div>{value}</div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-form-panel p-5 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">{isRegister ? "Create account" : "Welcome back"}</p>
              <h2 className="theme-text mt-2 text-3xl font-black tracking-tight sm:text-4xl">{isRegister ? "Join Article Hub" : "Login to your desk"}</h2>
              <p className="theme-muted mt-3 max-w-2xl text-sm leading-6">
                {isRegister ? "Choose reader access or request author access. Author accounts activate only after admin approval." : "Use your email and password to continue securely."}
              </p>
            </div>
            <Link to={isRegister ? "/login" : "/register"} className="auth-mode-link">
              {isRegister ? "Login" : "Register"} <ArrowRight size={15} />
            </Link>
          </div>

          {error && (
            <div className="auth-alert mt-6 flex items-center gap-3 border-red-200 bg-red-50 text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {notice && <div className="auth-alert mt-6 border-emerald-200 bg-emerald-50 text-emerald-700">{notice}</div>}

          <div className="mt-8 space-y-4">
            {isRegister && (
              <>
                <Field icon={UserRoundPen} label="Account type">
                  <select
                    value={form.requestedRole}
                    onChange={(event) => setForm({ ...form, requestedRole: event.target.value })}
                    className="auth-input appearance-none"
                  >
                    <option value="user">Reader</option>
                    <option value="author">Request author access</option>
                  </select>
                </Field>

                {form.requestedRole === "author" && (
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-stone-500">Author note</span>
                    <textarea
                      value={form.authorRequestMessage}
                      onChange={(event) => setForm({ ...form, authorRequestMessage: event.target.value })}
                      maxLength={500}
                      rows={3}
                      className="field"
                      placeholder="Tell admin what topics you want to publish"
                    />
                  </label>
                )}
              </>
            )}

            <div>
              {GOOGLE_CLIENT_ID ? (
                <div ref={googleButtonRef} className="auth-google-slot" />
              ) : (
                <div className="auth-google-missing">
                  Add Google Client ID to enable Google sign-in.
                </div>
              )}
            </div>

            <div className="auth-divider">
              <span>or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {isRegister && (
              <Field icon={User} label="Name">
                <input
                  required
                  minLength={3}
                  maxLength={30}
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="auth-input"
                  placeholder="Your name"
                />
              </Field>
            )}

            <Field icon={Mail} label="Email">
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="auth-input"
                placeholder="you@example.com"
              />
            </Field>

            <Field icon={Lock} label="Password">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="auth-input pr-12"
                placeholder={isRegister ? "Strong password required" : "Your password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="auth-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </Field>

            <button
              disabled={loading}
              className="premium-button h-12 w-full disabled:opacity-60"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {isRegister ? "Create account" : "Login"}
            </button>
          </form>

          <div className="theme-muted mt-6 text-sm font-semibold">
            {isRegister ? "Already have an account?" : "Need an account?"}{" "}
            <Link to={isRegister ? "/login" : "/register"} className="font-black text-teal-700">
              {isRegister ? "Login" : "Register"}
            </Link>
          </div>
        </div>
      </MotionSection>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  const IconComponent = Icon;

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-stone-500">{label}</span>
      <div className="relative">
        <IconComponent className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        {children}
      </div>
    </label>
  );
}
