"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let vid = localStorage.getItem("_udn_vid");
    if (!vid) {
      vid = "v_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem("_udn_vid", vid);
    }
    return vid;
  } catch {
    return "v_anon_" + Math.random().toString(36).substring(2, 10);
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = sessionStorage.getItem("_udn_sid");
    if (!sid) {
      sid = "s_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      sessionStorage.setItem("_udn_sid", sid);
    }
    return sid;
  } catch {
    return "s_anon_" + Math.random().toString(36).substring(2, 10);
  }
}

function sendBeaconEvent(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([json], { type: "application/json" });
    const sent = navigator.sendBeacon("/api/analytics/collect", blob);
    if (sent) return;
  }
  // Fallback to fetch with keepalive
  fetch("/api/analytics/collect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
    keepalive: true,
  }).catch(() => {});
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const currentPvIdRef = useRef<string | null>(null);
  const lastHeartbeatTimeRef = useRef<number>(Date.now());
  const currentPathRef = useRef<string>(pathname);

  useEffect(() => {
    // 관리자 페이지 및 내부 리소스 제외
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const vid = getOrCreateVisitorId();
    const sid = getOrCreateSessionId();
    currentPathRef.current = pathname;
    lastHeartbeatTimeRef.current = Date.now();

    // 1. 새 페이지뷰 전송
    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "pageview",
        sessionId: sid,
        visitorId: vid,
        path: pathname,
        title: document.title,
        referrer: document.referrer,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.pageViewId) {
          currentPvIdRef.current = data.pageViewId;
        }
      })
      .catch(() => {});

    // 2. 주기적 Heartbeat (15초마다)
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = Math.round((now - lastHeartbeatTimeRef.current) / 1000);
      if (deltaSec >= 10) {
        lastHeartbeatTimeRef.current = now;
        sendBeaconEvent({
          type: "heartbeat",
          sessionId: sid,
          pageViewId: currentPvIdRef.current || undefined,
          delta: deltaSec,
        });
      }
    }, 15000);

    // 3. 페이지 이탈/숨김 감지 핸들러
    const handleLeave = () => {
      const now = Date.now();
      const deltaSec = Math.round((now - lastHeartbeatTimeRef.current) / 1000);
      if (deltaSec >= 2) {
        lastHeartbeatTimeRef.current = now;
        sendBeaconEvent({
          type: "leave",
          sessionId: sid,
          pageViewId: currentPvIdRef.current || undefined,
          delta: deltaSec,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleLeave();
      } else {
        lastHeartbeatTimeRef.current = Date.now();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleLeave);
    window.addEventListener("beforeunload", handleLeave);

    return () => {
      clearInterval(interval);
      handleLeave();
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleLeave);
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, [pathname]);

  return null;
}
