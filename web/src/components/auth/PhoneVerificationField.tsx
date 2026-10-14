"use client";

import { useEffect, useState } from "react";

type Props = { onVerified: (phone: string | null, token: string | null) => void; disabled?: boolean };

function digits(value: string) {
  return value.replace(/\D/g, "");
}

export default function PhoneVerificationField({ onVerified, disabled = false }: Props) {
  const [phone, setPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [verified, setVerified] = useState(false);
  const [notice, setNotice] = useState("");
  const [proofExpiresAt, setProofExpiresAt] = useState<number | null>(null);
  const normalizedPhone = digits(phone);
  const validPhone = /^01[016789]\d{7,8}$/.test(normalizedPhone);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!proofExpiresAt) return;
    const timer = window.setTimeout(() => {
      setVerified(false); setChallengeId(""); setProofExpiresAt(null);
      onVerified(null, null);
      setNotice("휴대폰 인증이 만료되었습니다. 새 인증번호를 받아주세요.");
    }, Math.max(0, proofExpiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [proofExpiresAt, onVerified]);

  const sendCode = async () => {
    if (!validPhone || busy || disabled || verified) return;
    setBusy("send");
    setNotice("");
    try {
      const response = await fetch("/api/register/phone/send", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.retryAfter) setCooldown(data.retryAfter);
        throw new Error(data.error ?? "인증번호 발송에 실패했습니다.");
      }
      setChallengeId(data.challengeId);
      setCode("");
      setVerified(false);
      onVerified(null, null);
      setCooldown(data.retryAfter ?? 60);
      setNotice("카카오 알림톡으로 인증번호를 보냈어요. 받은 6자리 번호를 입력해주세요.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "인증번호 발송에 실패했습니다.");
    } finally {
      setBusy(null);
    }
  };

  const verifyCode = async () => {
    if (!challengeId || !/^\d{6}$/.test(digits(code)) || busy || disabled || verified) return;
    setBusy("verify");
    setNotice("");
    try {
      const response = await fetch("/api/register/phone/verify", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, challengeId, code: digits(code) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "인증번호를 확인할 수 없습니다.");
      setVerified(true);
      setProofExpiresAt(Date.now() + (data.expiresIn ?? 900) * 1000);
      onVerified(normalizedPhone, data.verificationToken);
      setNotice("휴대전화번호 인증이 완료되었습니다.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "인증번호를 확인할 수 없습니다.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <fieldset className="space-y-2" aria-describedby="phone-verification-help">
      <legend className="text-util text-text">휴대전화번호 인증 <span className="text-red-600">(필수)</span></legend>
      <div className="flex gap-2">
        <input value={phone} onChange={(event) => {
          setPhone(event.target.value);
          setChallengeId(""); setCode(""); setVerified(false); setCooldown(0); setNotice("");
          onVerified(null, null);
        }} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={16} aria-label="휴대전화번호" className="h-11 min-w-0 flex-1 border border-line bg-bg px-3 text-body text-text outline-none focus:border-text" placeholder="010-1234-5678" disabled={verified || busy !== null || disabled} />
        {!verified && <button type="button" onClick={() => void sendCode()} disabled={!validPhone || busy !== null || cooldown > 0 || disabled} className="h-11 shrink-0 border border-line px-3 text-util text-text transition-colors hover:bg-soft disabled:cursor-not-allowed disabled:opacity-40">
          {busy === "send" ? "발송 중…" : cooldown > 0 ? `재전송 ${cooldown}초` : challengeId ? "인증번호 재전송" : "인증번호 받기"}
        </button>}
      </div>
      <p id="phone-verification-help" className="text-util text-muted">카카오톡으로 인증번호를 보내드립니다. 인증번호는 3분, 인증 완료 후 가입은 15분간 유효합니다.</p>
      {challengeId && !verified && <div className="flex gap-2">
        <input value={code} onChange={(event) => setCode(digits(event.target.value).slice(0, 6))} disabled={busy !== null || disabled} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-label="알림톡 인증번호" className="h-11 min-w-0 flex-1 border border-line bg-bg px-3 text-body tracking-[0.25em] text-text outline-none focus:border-text" placeholder="6자리 인증번호" />
        <button type="button" onClick={() => void verifyCode()} disabled={digits(code).length !== 6 || busy !== null || disabled} className="h-11 shrink-0 bg-text px-4 text-util text-bg transition-colors hover:bg-[#444] disabled:cursor-not-allowed disabled:opacity-40">
          {busy === "verify" ? "확인 중…" : "인증하기"}
        </button>
      </div>}
      {notice && <p id="phone-verification-status" role={verified ? "status" : "alert"} className={`text-util ${verified ? "text-text" : "text-muted"}`}>{notice}</p>}
    </fieldset>
  );
}
