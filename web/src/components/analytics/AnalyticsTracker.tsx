"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { analyticsContext, analyticsIdentity, sendAnalytics, trackCommerce } from "@/src/lib/analytics-client";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === "admin";
  const page = useRef<{ path: string; sessionId: string; id: string } | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api") || status === "loading" || isAdmin) return;
    const initialContext = analyticsContext();
    if (!initialContext) return;
    let context = initialContext;
    if (page.current?.path !== pathname || page.current?.sessionId !== context.sessionId) page.current = { path: pathname, sessionId: context.sessionId, id: `p_${crypto.randomUUID()}` };
    let pageViewId = page.current.id;
    const connection = (navigator as Navigator & { connection?: { effectiveType?: string; rtt?: number } }).connection;
    const sendPage = () => sendAnalytics({
      ...context, type: "pageview", pageViewId, title: document.title,
      networkType: connection?.effectiveType, rtt: connection?.rtt,
      screenWidth: window.screen.width, screenHeight: window.screen.height, language: navigator.language,
    });
    sendPage();
    if (pathname === "/checkout" && !userId) trackCommerce("checkout_login_required");
    let activeSince = document.visibilityState === "visible" ? Date.now() : null;
    let maxScroll = 0;
    const handleScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      maxScroll = Math.max(maxScroll, height <= 0 ? 100 : Math.min(100, Math.round(window.scrollY / height * 100)));
    };
    const flush = () => {
      if (activeSince === null) return;
      analyticsIdentity();
      const now = Date.now();
      const delta = Math.min(120, Math.floor((now - activeSince) / 1000));
      if (delta > 0) {
        sendAnalytics({ type: "heartbeat", sessionId: context.sessionId, pageViewId, delta, scrollDepth: maxScroll });
        activeSince += delta * 1000;
      }
    };
    const hide = () => { flush(); activeSince = null; };
    const visibility = () => {
      if (document.visibilityState === "hidden") hide();
      else {
        const next = analyticsContext();
        if (next && next.sessionId !== context.sessionId) {
          context = next;
          pageViewId = `p_${crypto.randomUUID()}`;
          page.current = { path: pathname, sessionId: context.sessionId, id: pageViewId };
          maxScroll = 0;
          sendPage();
        }
        activeSince = Date.now();
      }
    };
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") flush(); }, 30000);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", hide);
    return () => {
      flush();
      window.clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", hide);
    };
  }, [pathname, status, userId, isAdmin]);

  return null;
}
