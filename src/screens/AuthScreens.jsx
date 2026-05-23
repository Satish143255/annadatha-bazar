import React from 'react';
import { CROPS, LANGUAGES, STATES_DISTRICTS } from '../referenceData.js';
import { Icon } from '../icons/Icon.jsx';
import { Button, Sheet, TopBar, useT } from '../components/index.jsx';
import { apiForgotPasswordRequest, apiForgotPasswordVerify, apiForgotPasswordReset, DEMO_MODE } from '../services/marketplaceApi.js';

const { useState: useStateA, useEffect: useEffectA } = React;

const hostedAuthCopy = {
  login: {
    title: "Welcome back",
    body: "Sign in to manage listings, messages, notifications, and your farmer profile.",
    primary: "Sign in",
    primaryHref: "/login",
    secondary: "Create account",
    secondaryHref: "/signup",
  },
  signup: {
    title: "Create your account",
    body: "Set up a secure account before you post crops, services, or equipment.",
    primary: "Create account",
    primaryHref: "/signup",
    secondary: "I already have an account",
    secondaryHref: "/login",
  },
  recovery: {
    title: "Recover your account",
    body: "Continue to the secure account page to reset a forgotten password.",
    primary: "Reset password",
    primaryHref: "/forgot-password",
    secondary: "Back to sign in",
    secondaryHref: "/login",
  },
};

const hostedAuthIntent = () => {
  if (window.location.pathname === "/signup") return "signup";
  if (["/forgot-password", "/reset-password"].includes(window.location.pathname)) return "recovery";
  return "login";
};

const AuthLogo = () => (
  <div className="auth-logo" style={{
    width: 88,
    height: 88,
    margin: "0 auto 22px",
    background: "linear-gradient(135deg, var(--primary) 0%, #2d8055 100%)",
    borderRadius: 24,
    display: "grid",
    placeItems: "center",
    boxShadow: "0 12px 24px -8px rgba(31,90,58,0.4)",
  }}>
    <Icon name="leaf" size={44} color="#FFFFFF" stroke={1.8} />
  </div>
);

const HostedAccountScreen = () => {
  const copy = hostedAuthCopy[hostedAuthIntent()];

  return (
    <div className="scroll screen-enter" style={{ minHeight: "100%", display: "grid", placeItems: "center", padding: "20px 20px 34px" }}>
      <div style={{ width: "100%", maxWidth: 320, textAlign: "center" }}>
        <AuthLogo />
        <div style={{ fontFamily: "var(--font-display)", fontSize: 36, lineHeight: 1.05, marginBottom: 8 }}>
          Annadata<span style={{ color: "var(--primary)" }}>.</span>Bazar
        </div>
        <div style={{ fontSize: 23, fontWeight: 600, marginTop: 22 }}>{copy.title}</div>
        <div style={{ color: "var(--ink-3)", lineHeight: 1.5, fontSize: 14, margin: "10px auto 24px", maxWidth: 292 }}>
          {copy.body}
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <a className="btn full" href={copy.primaryHref} style={{ textDecoration: "none" }}>{copy.primary}</a>
          <a
            href={copy.secondaryHref}
            style={{
              minHeight: 48,
              border: "1px solid var(--border-strong)",
              borderRadius: 12,
              color: "var(--ink)",
              display: "grid",
              placeItems: "center",
              textDecoration: "none",
              fontWeight: 600,
              background: "var(--surface)",
            }}
          >
            {copy.secondary}
          </a>
        </div>
        {copy.primaryHref !== "/forgot-password" && (
          <a href="/forgot-password" style={{ display: "inline-block", color: "var(--primary)", fontSize: 13, fontWeight: 600, marginTop: 20 }}>
            Forgot password?
          </a>
        )}
      </div>
    </div>
  );
};

// ---------- Splash Screen ----------
const SplashScreen = ({ onGetStarted }) => {
  const [progress, setProgress] = useStateA(0);
  const [loadingComplete, setLoadingComplete] = useStateA(false);

  useEffectA(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setLoadingComplete(true);
          return 100;
        }
        return prev + 5;
      });
    }, 40);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="scroll screen-enter" style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "50px 24px 60px",
      background: "linear-gradient(180deg, var(--bg) 0%, var(--surface-2) 100%)",
      position: "relative",
    }}>
      {/* Background glowing gradients */}
      <div style={{
        position: "absolute",
        top: "-10%",
        left: "-10%",
        width: "60%",
        aspectRatio: 1,
        borderRadius: "999px",
        background: "radial-gradient(circle, rgba(21, 66, 18, 0.08) 0%, transparent 70%)",
        filter: "blur(40px)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        right: "-10%",
        width: "60%",
        aspectRatio: 1,
        borderRadius: "999px",
        background: "radial-gradient(circle, rgba(116, 91, 0, 0.06) 0%, transparent 70%)",
        filter: "blur(40px)",
        pointerEvents: "none"
      }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%" }}>
        <div className="modal-enter" style={{
          width: 100,
          height: 100,
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)",
          borderRadius: 24,
          display: "grid",
          placeItems: "center",
          boxShadow: "var(--shadow-lg)",
          marginBottom: 24,
        }}>
          <Icon name="leaf" size={50} color="#FFFFFF" stroke={1.8} />
        </div>
        
        <h1 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 32,
          fontWeight: 800,
          color: "var(--ink)",
          margin: "0 0 8px 0",
          letterSpacing: "-0.02em",
          textAlign: "center"
        }}>
          Annadata<span style={{ color: "var(--primary)" }}>.</span>Bazar
        </h1>
        <p style={{
          fontSize: 14,
          color: "var(--ink-2)",
          margin: 0,
          textAlign: "center",
          fontWeight: 500,
          maxWidth: 260,
          lineHeight: 1.5,
          textWrap: "balance"
        }}>
          Indian Farmer's Direct Marketplace. Buy, Sell, and Connect.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {!loadingComplete ? (
          <div style={{ width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-3)", marginBottom: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Initializing... {progress}%
            </div>
            <div style={{
              width: "100%",
              height: 6,
              background: "var(--surface-3)",
              borderRadius: 999,
              overflow: "hidden"
            }}>
              <div style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, var(--primary) 0%, var(--primary-2) 100%)",
                borderRadius: 999,
                transition: "width 80ms ease-out"
              }} />
            </div>
          </div>
        ) : (
          <div className="modal-enter" style={{ width: "100%" }}>
            <Button full onClick={onGetStarted} style={{
              height: 52,
              borderRadius: 16,
              boxShadow: "0 8px 20px -4px rgba(21, 66, 18, 0.25)",
              fontSize: 16,
              letterSpacing: "0.01em"
            }}>
              Get Started <Icon name="arrow-right" size={16} style={{ marginLeft: 4 }} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------- Signup & Login Screen ----------
const SignupLoginScreen = ({ onLogin, onSignup, onForgotPasswordClick, onSkip, lang, error, setError }) => {
  const [tab, setTab] = useStateA("login"); // "login" | "signup"
  const [email, setEmail] = useStateA("");
  const [password, setPassword] = useStateA("");
  const [confirmPassword, setConfirmPassword] = useStateA("");
  const [name, setName] = useStateA("");
  const [agreed, setAgreed] = useStateA(false);
  const [loading, setLoading] = useStateA(false);
  const [langOpen, setLangOpen] = useStateA(false);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setError && setError(null);
  };

  const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const isFormValid = tab === "login"
    ? (isEmailValid(email) && password.length >= 6)
    : (name.trim().length >= 2 && isEmailValid(email) && password.length >= 6 && password === confirmPassword && agreed);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;
    setLoading(true);
    setError && setError(null);
    try {
      if (tab === "login") {
        await onLogin(email, password);
      } else {
        await onSignup(name, email, password);
      }
    } catch (err) {
      setError && setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scroll screen-enter" style={{ padding: "0 0 30px" }}>
      <div style={{ padding: "12px 16px 0", display: "flex", justifyContent: "flex-end" }}>
        <button className="chip" type="button" onClick={() => setLangOpen(true)}>
          <Icon name="globe" size={14} />
          {LANGUAGES.find(l => l.code === lang)?.native || "English"}
        </button>
      </div>

      <div style={{ textAlign: "center", margin: "20px 0 28px" }}>
        <div style={{
          width: 72,
          height: 72,
          background: "linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 100%)",
          borderRadius: 20,
          display: "grid",
          placeItems: "center",
          margin: "0 auto 16px",
          boxShadow: "var(--shadow)"
        }}>
          <Icon name="leaf" size={36} color="#FFFFFF" stroke={1.8} />
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 28, fontWeight: 800, color: "var(--ink)" }}>
          Annadata<span style={{ color: "var(--primary)" }}>.</span>Bazar
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 6 }}>
          Direct Marketplace. No Middlemen.
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>
        <div className="segmented" style={{ marginBottom: 24, padding: 4 }}>
          <button
            type="button"
            className={tab === "login" ? "active" : ""}
            onClick={() => handleTabChange("login")}
            style={{ height: 40, fontSize: 14, borderRadius: 8 }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={tab === "signup" ? "active" : ""}
            onClick={() => handleTabChange("signup")}
            style={{ height: 40, fontSize: 14, borderRadius: 8 }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: "rgba(186, 26, 26, 0.08)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 13,
              marginBottom: 20,
              lineHeight: 1.4
            }}>
              {error}
            </div>
          )}

          {tab === "signup" && (
            <div className="field">
              <label className="field-label">Full Name<span className="req"> *</span></label>
              <input
                className="input"
                type="text"
                placeholder="eg. Ramesh Yadav"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="field">
            <label className="field-label">Email Address<span className="req"> *</span></label>
            <input
              className="input"
              type="email"
              placeholder="eg. ramesh@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label className="field-label">Password<span className="req"> *</span></label>
              {tab === "login" && (
                <button
                  type="button"
                  onClick={onForgotPasswordClick}
                  style={{ color: "var(--primary)", fontSize: 13, fontWeight: 600, padding: "2px 6px" }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {tab === "signup" && (
            <div className="field">
              <label className="field-label">Confirm Password<span className="req"> *</span></label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {tab === "signup" && (
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 20, marginBottom: 24, cursor: "pointer" }}>
              <div
                onClick={() => setAgreed(!agreed)}
                style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: `2px solid ${agreed ? "var(--primary)" : "var(--border-strong)"}`,
                  background: agreed ? "var(--primary)" : "transparent",
                  flexShrink: 0, display: "grid", placeItems: "center", marginTop: 2,
                }}
              >
                {agreed && <Icon name="check" size={13} color="#fff" stroke={3} />}
              </div>
              <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.4 }}>
                I agree to the <a style={{ color: "var(--primary)", textDecoration: "underline" }}>Terms</a> and <a style={{ color: "var(--primary)", textDecoration: "underline" }}>Privacy Policy</a>
              </span>
            </label>
          )}

          <div style={{ marginTop: 28 }}>
            <Button full disabled={!isFormValid || loading} type="submit">
              {loading ? "Authenticating..." : tab === "login" ? "Sign In" : "Create Account"}
            </Button>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={onSkip} style={{ fontSize: 13, color: "var(--ink-3)", padding: 8 }}>
            Skip to demo (Guest Mode)
          </button>
        </div>
      </div>

      <Sheet open={langOpen} onClose={() => setLangOpen(false)} title="Choose Language">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`chip${lang === l.code ? " active" : ""}`}
              style={{ height: 48, padding: "0 12px", justifyContent: "flex-start", borderRadius: 12, fontSize: 14 }}
              onClick={() => { window.agriSetLang ? window.agriSetLang(l.code) : null; setLangOpen(false); }}
            >
              <span style={{ fontWeight: 600 }}>{l.native}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.7 }}>{l.name}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
};

// ---------- Forgot Password Screen ----------
const ForgotPasswordScreen = ({ onBack, onSuccess, showToast }) => {
  const [step, setStep] = useStateA(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useStateA("");
  const [otp, setOtp] = useStateA("");
  const [newPassword, setNewPassword] = useStateA("");
  const [confirmPassword, setConfirmPassword] = useStateA("");
  const [loading, setLoading] = useStateA(false);
  const [error, setError] = useStateA(null);
  const [resetToken, setResetToken] = useStateA("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (DEMO_MODE) {
        showToast("Demo OTP sent to " + email, "check");
        setTimeout(() => {
          showToast("Demo OTP is 123456", "info");
        }, 800);
      } else {
        const response = await apiForgotPasswordRequest(email);
        // Supports both pure API recovery or returning inline code in logs
        showToast("OTP sent to your email.", "check");
        if (response?.otp) {
          setTimeout(() => {
            showToast(`Demo OTP is ${response.otp}`, "info");
          }, 800);
        }
      }
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to initiate recovery. Ensure your email is registered.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6 || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (DEMO_MODE) {
        if (otp === "123456") {
          setResetToken("mock-reset-token-123456");
          setStep(3);
        } else {
          setError("Wrong OTP code. Enter 123456 for demo.");
        }
      } else {
        const res = await apiForgotPasswordVerify(email, otp);
        if (res?.resetToken) {
          setResetToken(res.resetToken);
          setStep(3);
        } else {
          setError("Verification failed.");
        }
      }
    } catch (err) {
      setError(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6 || newPassword !== confirmPassword || loading) return;
    setLoading(true);
    setError(null);
    try {
      if (DEMO_MODE) {
        showToast("Password reset successful!", "check");
        onSuccess();
      } else {
        await apiForgotPasswordReset(resetToken, newPassword);
        showToast("Password reset successful!", "check");
        onSuccess();
      }
    } catch (err) {
      setError(err.message || "Password reset failed. Please request OTP again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scroll screen-enter" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar onBack={onBack} title="Reset Password" />
      
      <div style={{ padding: "20px 24px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ flex: 1, height: 4, background: "var(--primary)", borderRadius: 2 }} />
          <div style={{ flex: 1, height: 4, background: step >= 2 ? "var(--primary)" : "var(--border)", borderRadius: 2 }} />
          <div style={{ flex: 1, height: 4, background: step >= 3 ? "var(--primary)" : "var(--border)", borderRadius: 2 }} />
        </div>

        {error && (
          <div style={{
            background: "rgba(186, 26, 26, 0.08)",
            border: "1px solid var(--danger)",
            color: "var(--danger)",
            borderRadius: 12,
            padding: "12px 14px",
            fontSize: 13,
            marginBottom: 20,
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="modal-enter">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Find Your Account</h2>
            <p style={{ color: "var(--ink-3)", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              Enter the email address associated with your account, and we will send a 6-digit OTP code to reset your password.
            </p>
            <div className="field">
              <label className="field-label">Email Address<span className="req"> *</span></label>
              <input
                className="input"
                type="email"
                placeholder="eg. ramesh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div style={{ marginTop: 32 }}>
              <Button full disabled={!email || loading} type="submit">
                {loading ? "Sending..." : "Send OTP Verification"}
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="modal-enter">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Enter Verification Code</h2>
            <p style={{ color: "var(--ink-3)", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              We've sent a 6-digit verification code to <span style={{ color: "var(--ink)", fontWeight: 600 }}>{email}</span>. Please enter it below.
            </p>
            <div className="field">
              <label className="field-label">6-Digit OTP Code<span className="req"> *</span></label>
              <input
                className="input"
                type="text"
                maxLength={6}
                inputMode="numeric"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.2em", textAlign: "center" }}
                required
                autoFocus
              />
            </div>
            <div style={{ marginTop: 32 }}>
              <Button full disabled={otp.length !== 6 || loading} type="submit">
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
            </div>
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ color: "var(--primary)", fontSize: 13, fontWeight: 600, padding: 8 }}
              >
                Change Email Address
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="modal-enter">
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Set New Password</h2>
            <p style={{ color: "var(--ink-3)", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
              Create a secure new password for your account. It must be at least 6 characters.
            </p>
            
            <div className="field">
              <label className="field-label">New Password<span className="req"> *</span></label>
              <input
                className="input"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="field">
              <label className="field-label">Confirm New Password<span className="req"> *</span></label>
              <input
                className="input"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ marginTop: 32 }}>
              <Button full disabled={newPassword.length < 6 || newPassword !== confirmPassword || loading} type="submit">
                {loading ? "Saving Password..." : "Update Password"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ---------- Profile Setup ----------
const ProfileSetupScreen = ({ onFinish, lang }) => {
  const t = useT(lang);
  const [name, setName] = useStateA("");
  const [village, setVillage] = useStateA("");
  const [state, setState] = useStateA("");
  const [district, setDistrict] = useStateA("");
  const [crops, setCrops] = useStateA([]);
  const [gpsing, setGpsing] = useStateA(false);
  const [coordinates, setCoordinates] = useStateA(null);
  const [locationError, setLocationError] = useStateA("");
  const [saving, setSaving] = useStateA(false);
  const [submitError, setSubmitError] = useStateA("");

  const districts = STATES_DISTRICTS[state] || [];
  const toggleCrop = (id) => setCrops(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  const gpsLabel = coordinates
    ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`
    : "";
  const finish = async (data) => {
    setSaving(true);
    setSubmitError("");
    try {
      await onFinish(data);
    } catch {
      setSubmitError("Profile could not be saved. Check your connection and try again.");
      setSaving(false);
    }
  };

  const useGPS = () => {
    setGpsing(true);
    setLocationError("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setCoordinates({
            latitude: Number(coords.latitude.toFixed(6)),
            longitude: Number(coords.longitude.toFixed(6)),
          });
          setGpsing(false);
        },
        () => {
          setLocationError("Location permission is needed to place nearby listings on the map.");
          setGpsing(false);
        },
        { timeout: 6000 }
      );
    } else {
      setLocationError("This device does not provide browser location.");
      setGpsing(false);
    }
  };

  return (
    <div className="scroll screen-enter" style={{ padding: "0 0 32px" }}>
      <div style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 4, background: "var(--primary)", borderRadius: 2 }} />
          <div style={{ width: 24, height: 4, background: "var(--primary)", borderRadius: 2 }} />
          <div style={{ width: 24, height: 4, background: "var(--border)", borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4 }}>
          {t("auth.profile.title")}
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
          We'll use this to personalize your feed and show relevant listings nearby.
        </div>
      </div>

      <div style={{ padding: "8px 16px" }}>
        {/* Photo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <button style={{
            width: 96, height: 96, borderRadius: 999,
            background: "var(--surface-2)",
            border: "2px dashed var(--border-strong)",
            display: "grid", placeItems: "center", color: "var(--ink-3)"
          }}>
            <Icon name="camera" size={28} stroke={1.6} />
            <span style={{ fontSize: 10, marginTop: 4 }}>Add photo</span>
          </button>
        </div>

        <div className="field">
          <label className="field-label">{t("auth.profile.name")} <span className="req">*</span></label>
          <input className="input" placeholder="eg. Ramesh Yadav" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label">{t("auth.profile.village")}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" placeholder="eg. Hanamkonda" value={village} onChange={e => setVillage(e.target.value)} style={{ flex: 1 }} />
            <button
              onClick={useGPS}
              style={{
                width: 52, height: 52, borderRadius: 12,
                background: "var(--primary-soft)", color: "var(--primary)",
                display: "grid", placeItems: "center", flexShrink: 0
              }}
            >
              {gpsing
                ? <div className="skel" style={{ width: 18, height: 18, borderRadius: 999 }} />
                : <Icon name="pin" size={20} />
              }
            </button>
          </div>
          {gpsing && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>Detecting your location...</div>}
          {coordinates && (
            <div style={{ fontSize: 11, color: "var(--primary)", marginTop: 6 }}>
              GPS captured: {gpsLabel}. Enter your village and select district for display.
            </div>
          )}
          {locationError && <div style={{ fontSize: 11, color: "var(--terra)", marginTop: 6 }}>{locationError}</div>}
        </div>

        <div className="field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="field-label">{t("auth.profile.state")}</label>
            <select className="input" value={state} onChange={e => { setState(e.target.value); setDistrict(STATES_DISTRICTS[e.target.value]?.[0] || ""); }}>
              <option value="">Select state</option>
              {Object.keys(STATES_DISTRICTS).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("auth.profile.district")}</label>
            <select className="input" value={district} onChange={e => setDistrict(e.target.value)}>
              <option value="">Select district</option>
              {districts.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 8 }}>
          <label className="field-label">{t("auth.profile.crops")}</label>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 10 }}>{t("auth.profile.cropSub")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CROPS.map(c => (
              <button
                key={c.id}
                onClick={() => toggleCrop(c.id)}
                className={`chip${crops.includes(c.id) ? " active" : ""}`}
                style={{ height: 38 }}
              >
                <span style={{ fontSize: 14 }}>{c.emoji}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
        <Button full disabled={saving || !name || name.length < 2 || !village || !state || !district} onClick={() => finish({ name, village, district, state, crops, ...coordinates })}>
          {saving ? "Saving..." : t("auth.profile.finish")}
        </Button>
        <button disabled={saving} onClick={() => finish({ name: name || "Farmer", village, district, state, crops, ...coordinates })} style={{ padding: 12, fontSize: 13, color: "var(--ink-3)" }}>
          {t("auth.profile.skip")}
        </button>
        {submitError && <div style={{ fontSize: 12, color: "var(--danger)", textAlign: "center" }}>{submitError}</div>}
      </div>
    </div>
  );
};

export { HostedAccountScreen, SplashScreen, SignupLoginScreen, ForgotPasswordScreen, ProfileSetupScreen };
