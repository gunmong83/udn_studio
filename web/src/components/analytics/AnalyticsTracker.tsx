"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

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

function getNetworkInfo() {
  if (typeof window === "undefined") return { networkType: undefined, rtt: undefined };
  // Network Information API (Chrome, Edge, Samsung Internet, Android)
  const nav = navigator as unknown as { connection?: { effectiveType?: string; rtt?: number } };
  const conn = nav.connection;
  return {
    networkType: conn?.effectiveType,
    rtt: typeof conn?.rtt === "number" ? conn.rtt : undefined,
  };
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
  const { data: session } = useSession();
  const currentPvIdRef = useRef<string | null>(null);
  const lastHeartbeatTimeRef = useRef<number>(Date.now());
  const maxScrollRef = useRef<number>(0);

  useEffect(() => {
    // 관리자 페이지 및 내부 리소스 제외
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    const vid = getOrCreateVisitorId();
    const sid = getOrCreateSessionId();
    lastHeartbeatTimeRef.current = Date.now();
    maxScrollRef.current = 0;

    const net = getNetworkInfo();
    const screenWidth = typeof window !== "undefined" ? window.screen?.width : undefined;
    const screenHeight = typeof window !== "undefined" ? window.screen?.height : undefined;
    const language = typeof navigator !== "undefined" ? navigator.language : undefined;

    // 1. 새 페이지뷰 전송
    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "pageview",
        sessionId: sid,
        visitorId: vid,
        userId: session?.user?.id || undefined,
        path: pathname,
        title: document.title,
        referrer: document.referrer,
        networkType: net.networkType,
        rtt: net.rtt,
        screenWidth,
        screenHeight,
        language,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.pageViewId) {
          currentPvIdRef.current = data.pageViewId;
        }
      })
      .catch(() => {});

    // 2. 스크롤 깊이 추적 (passive listener, 서버 요청 0)
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const depth = Math.min(100, Math.round((window.scrollY / scrollHeight) * 100));
        if (depth > maxScrollRef.current) {
          maxScrollRef.current = depth;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 3. 주기적 Heartbeat (서버 부하 방지를 위해 30초 주기)
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = Math.round((now - lastHeartbeatTimeRef.current) / 1000);
      if (deltaSec >= 15) {
        lastHeartbeatTimeRef.current = now;
        sendBeaconEvent({
          type: "heartbeat",
          sessionId: sid,
          pageViewId: currentPvIdRef.current || undefined,
          delta: deltaSec,
          scrollDepth: maxScrollRef.current,
        });
      }
    }, 30000);

    // 4. 페이지 이탈/숨김 감지 핸들러
    const handleLeave = () => {
      const now = Date.now();
      const deltaSec = Math.round((now - lastHeartbeatTimeRef.current) / 1000);
      if (deltaSec >= 1) {
        lastHeartbeatTimeRef.current = now;
        sendBeaconEvent({
          type: "leave",
          sessionId: sid,
          pageViewId: currentPvIdRef.current || undefined,
          delta: deltaSec,
          scrollDepth: maxScrollRef.current,
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
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleLeave);
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, [pathname, session?.user?.id]);

  return null;
}
