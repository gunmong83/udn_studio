export function parseUserAgent(ua: string) {
  let device = "Desktop";
  if (/tablet|ipad/i.test(ua)) {
    device = "Tablet";
  } else if (/mobile|iphone|ipod|android/i.test(ua)) {
    device = "Mobile";
  }

  let browser = "Other";
  if (/whale/i.test(ua)) {
    browser = "Whale";
  } else if (/edg/i.test(ua)) {
    browser = "Edge";
  } else if (/samsungbrowser/i.test(ua)) {
    browser = "Samsung Internet";
  } else if (/chrome|crios/i.test(ua)) {
    browser = "Chrome";
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = "Safari";
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
  }

  let os = "Other";
  if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
  } else if (/android/i.test(ua)) {
    os = "Android";
  } else if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  return { device, browser, os };
}
