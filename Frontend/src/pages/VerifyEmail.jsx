import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { CheckCircle2, Loader2, Mail, Send, XCircle } from "lucide-react";
import { resendVerificationByEmail, verifyEmail } from "../utility/api";

export default function VerifyEmail() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: "", message: "" });
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendState, setResendState] = useState({ error: "", message: "" });

  useEffect(() => {
    let active = true;

    const verify = async () => {
      try {
        const data = await verifyEmail(token);
        if (active) setState({ loading: false, error: "", message: data.message });
      } catch (err) {
        if (active) setState({ loading: false, error: err.response?.data?.message || "Verification failed.", message: "" });
      }
    };

    verify();
    return () => {
      active = false;
    };
  }, [token]);

  const handleResend = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    setResending(true);
    setResendState({ error: "", message: "" });
    try {
      const data = await resendVerificationByEmail(email.trim());
      setResendState({ error: "", message: data.message || "A new verification link has been sent." });
    } catch (err) {
      setResendState({ error: err.response?.data?.message || "Could not send verification link.", message: "" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="grid min-h-[72vh] place-items-center px-4 py-10">
      <section className="premium-card w-full max-w-xl p-8 text-center">
        {state.loading ? (
          <>
            <Loader2 className="mx-auto animate-spin text-teal-700" size={40} />
            <h1 className="mt-6 text-3xl font-black tracking-tight">Verifying email</h1>
          </>
        ) : state.error ? (
          <>
            <XCircle className="mx-auto text-red-600" size={44} />
            <h1 className="mt-6 text-3xl font-black tracking-tight">Verification failed</h1>
            <p className="mt-3 text-stone-600">{state.error}</p>
            <form onSubmit={handleResend} className="mt-7 text-left">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-stone-500">Send a new link</span>
                <span className="relative block">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="auth-input"
                    placeholder="you@example.com"
                  />
                </span>
              </label>
              {resendState.error && <p className="mt-3 text-sm font-bold text-red-600">{resendState.error}</p>}
              {resendState.message && <p className="mt-3 text-sm font-bold text-teal-700">{resendState.message}</p>}
              <button type="submit" disabled={resending} className="premium-button mt-4 w-full disabled:opacity-60">
                {resending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                Send new verification link
              </button>
            </form>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto text-teal-700" size={44} />
            <h1 className="mt-6 text-3xl font-black tracking-tight">Email verified</h1>
            <p className="mt-3 text-stone-600">{state.message}</p>
          </>
        )}

        <Link to="/login" className="premium-button mt-8">
          Continue to login
        </Link>
      </section>
    </div>
  );
}
