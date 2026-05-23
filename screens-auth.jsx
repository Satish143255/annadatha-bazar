// ===== Auth Screens: A1 Signup, A2 OTP, A3 Profile =====

const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;

// ---------- A1: Signup ----------
const SignupScreen = ({ onNext, onSkip, lang, setLang }) => {
  const t = useT(lang);
  const [phone, setPhone] = useStateA("");
  const [agreed, setAgreed] = useStateA(false);
  const [langOpen, setLangOpen] = useStateA(false);
  const valid = phone.length === 10 && /^[6-9]/.test(phone) && agreed;
  const langName = AGRI_DATA.LANGUAGES.find(l => l.code === lang)?.native || "English";

  return (
    <div className="scroll screen-enter" style={{ padding: "0 0 24px" }}>
      <div style={{ padding: "8px 16px 0", display: "flex", justifyContent: "flex-end" }}>
        <button className="chip" onClick={() => setLangOpen(true)}>
          <Icon name="globe" size={14} />
          {langName}
        </button>
      </div>

      <div style={{ padding: "32px 24px 0", textAlign: "center" }}>
        <div className="auth-logo" style={{
          width: 88, height: 88, margin: "0 auto 24px",
          background: "linear-gradient(135deg, var(--primary) 0%, #2d8055 100%)",
          borderRadius: 24, display: "grid", placeItems: "center",
          boxShadow: "0 12px 24px -8px rgba(31,90,58,0.4)"
        }}>
          <Icon name="leaf" size={44} color="#FFFFFF" stroke={1.8} />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 38, lineHeight: 1.05, letterSpacing: "-0.01em", marginBottom: 8 }}>
          Annadatha<span style={{ color: "var(--primary)" }}>Bazar</span>
        </div>
        <div style={{ fontSize: 15, color: "var(--ink-3)", textWrap: "balance", maxWidth: 280, margin: "0 auto" }}>
          {lang === "hi" ? "अपनी फ़सल, सेवा या उपकरण के लिए सीधे जोड़ें" : "Find buyers, services, and equipment. Connect direct, no middlemen."}
        </div>
      </div>

      <div style={{ padding: "44px 20px 20px" }}>
        <div className="field">
          <label className="field-label">{t("auth.phone")}<span className="req"> *</span></label>
          <div className="input-row">
            <div className="prefix">+91</div>
            <input
              className="input"
              type="tel"
              maxLength={10}
              inputMode="numeric"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              style={{ letterSpacing: "0.04em", fontSize: 18 }}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>
            We'll send a 6-digit code to verify
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 24, cursor: "pointer" }}>
          <div
            onClick={() => setAgreed(!agreed)}
            style={{
              width: 22, height: 22, borderRadius: 6,
              border: `2px solid ${agreed ? "var(--primary)" : "var(--border-strong)"}`,
              background: agreed ? "var(--primary)" : "transparent",
              flexShrink: 0, display: "grid", placeItems: "center", marginTop: 2,
            }}
          >
            {agreed && <Icon name="check" size={14} color="#fff" stroke={3} />}
          </div>
          <span style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>
            I agree to the <a style={{ color: "var(--primary)", textDecoration: "underline" }}>Terms</a> and <a style={{ color: "var(--primary)", textDecoration: "underline" }}>Privacy Policy</a>
          </span>
        </label>

        <div style={{ marginTop: 28 }}>
          <Button full disabled={!valid} onClick={() => onNext(phone)}>
            {t("auth.sendOtp")}
          </Button>
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={onSkip} style={{ fontSize: 13, color: "var(--ink-3)", padding: 8 }}>
            Skip to demo (no signup)
          </button>
        </div>
      </div>

      <Sheet open={langOpen} onClose={() => setLangOpen(false)} title="Choose Language">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {AGRI_DATA.LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`chip${lang === l.code ? " active" : ""}`}
              style={{ height: 48, padding: "0 12px", justifyContent: "flex-start", borderRadius: 12, fontSize: 14 }}
              onClick={() => { setLang(l.code); setLangOpen(false); }}
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

// ---------- A2: OTP ----------
const OtpScreen = ({ phone, onVerify, onBack, lang }) => {
  const t = useT(lang);
  const [digits, setDigits] = useStateA(["", "", "", "", "", ""]);
  const [resend, setResend] = useStateA(30);
  const [error, setError] = useStateA(null);
  const refs = useRefA([]);

  useEffectA(() => {
    if (resend > 0) {
      const id = setTimeout(() => setResend(r => r - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [resend]);

  useEffectA(() => {
    refs.current[0]?.focus();
    // Auto-fill demo OTP after 2s
    const id = setTimeout(() => {
      setDigits(["1", "2", "3", "4", "5", "6"]);
    }, 1500);
    return () => clearTimeout(id);
  }, []);

  const setAt = (i, v) => {
    if (v && !/^\d$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError(null);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const code = digits.join("");
  const complete = code.length === 6;

  const verify = () => {
    if (code === "123456") {
      onVerify(phone, false); // existing user → straight to home; change to true to force profile setup
    } else {
      setError("Wrong code. Try 123456 for demo.");
    }
  };

  return (
    <div className="scroll screen-enter" style={{ padding: "0 0 24px" }}>
      <TopBar onBack={onBack} title="" />
      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.01em" }}>
          {t("auth.otp.title")}
        </div>
        <div style={{ fontSize: 15, color: "var(--ink-3)" }}>
          {t("auth.otp.sub")} <span style={{ color: "var(--ink)", fontWeight: 500 }}>+91 {phone}</span>
          <button onClick={onBack} style={{ color: "var(--primary)", fontWeight: 500, marginLeft: 8 }}>Change</button>
        </div>
      </div>

      <div style={{ padding: "32px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => refs.current[i] = el}
              value={d}
              onChange={e => setAt(i, e.target.value.slice(-1))}
              onKeyDown={e => { if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus(); }}
              inputMode="numeric"
              maxLength={1}
              style={{
                width: 48, height: 56,
                fontSize: 24, fontWeight: 600,
                textAlign: "center",
                border: `2px solid ${error ? "var(--terra)" : d ? "var(--primary)" : "var(--border)"}`,
                background: "var(--surface)",
                borderRadius: 12,
                color: "var(--ink)",
                outline: "none",
              }}
            />
          ))}
        </div>
        {error && (
          <div style={{ textAlign: "center", color: "var(--terra)", fontSize: 13, marginTop: 12 }}>{error}</div>
        )}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--ink-3)" }}>
          {resend > 0 ? (
            <span>{t("auth.otp.resend")} {resend}s</span>
          ) : (
            <button onClick={() => setResend(30)} style={{ color: "var(--primary)", fontWeight: 600 }}>Resend OTP</button>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button style={{ color: "var(--ink-2)", fontSize: 13, textDecoration: "underline" }}>
            <Icon name="phone" size={12} /> {t("auth.otp.voice")}
          </button>
        </div>
      </div>

      <div style={{ padding: "32px 20px 0" }}>
        <Button full disabled={!complete} onClick={verify}>Verify & Continue</Button>
      </div>

      <div style={{ padding: "24px 20px 0", textAlign: "center", fontSize: 11, color: "var(--ink-4)" }}>
        Demo: code <span style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "2px 6px", borderRadius: 4 }}>123456</span> works
      </div>
    </div>
  );
};

// ---------- A3: Profile Setup ----------
const ProfileSetupScreen = ({ onFinish, lang }) => {
  const t = useT(lang);
  const [name, setName] = useStateA("");
  const [village, setVillage] = useStateA("");
  const [state, setState] = useStateA("Telangana");
  const [district, setDistrict] = useStateA("Warangal");
  const [crops, setCrops] = useStateA([]);
  const [gpsing, setGpsing] = useStateA(false);

  const districts = AGRI_DATA.STATES_DISTRICTS[state] || [];
  const toggleCrop = (id) => setCrops(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);

  const useGPS = () => {
    setGpsing(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setVillage("Hanamkonda");
          setState("Telangana");
          setDistrict("Warangal");
          setGpsing(false);
        },
        () => {
          setVillage("Hanamkonda");
          setState("Telangana");
          setDistrict("Warangal");
          setGpsing(false);
        },
        { timeout: 6000 }
      );
    } else {
      setTimeout(() => {
        setVillage("Hanamkonda");
        setState("Telangana");
        setDistrict("Warangal");
        setGpsing(false);
      }, 1100);
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
          {gpsing && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6 }}>Detecting your location…</div>}
        </div>

        <div className="field" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="field-label">{t("auth.profile.state")}</label>
            <select className="input" value={state} onChange={e => { setState(e.target.value); setDistrict(AGRI_DATA.STATES_DISTRICTS[e.target.value][0]); }}>
              {Object.keys(AGRI_DATA.STATES_DISTRICTS).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">{t("auth.profile.district")}</label>
            <select className="input" value={district} onChange={e => setDistrict(e.target.value)}>
              {districts.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 8 }}>
          <label className="field-label">{t("auth.profile.crops")}</label>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 10 }}>{t("auth.profile.cropSub")}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AGRI_DATA.CROPS.map(c => (
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
        <Button full disabled={!name || name.length < 2} onClick={() => onFinish({ name, village, district, state, crops })}>
          {t("auth.profile.finish")}
        </Button>
        <button onClick={() => onFinish({ name: name || "You", village: "Hanamkonda", district: "Warangal", state: "Telangana", crops: ["rice"] })} style={{ padding: 12, fontSize: 13, color: "var(--ink-3)" }}>
          {t("auth.profile.skip")}
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { SignupScreen, OtpScreen, ProfileSetupScreen });
