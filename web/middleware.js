import { NextResponse } from 'next/server';

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Studio UDN Metrics", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  });
}

function unavailable() {
  return new NextResponse('Metrics credentials are not configured', {
    status: 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export function middleware(request) {
  const username = process.env.METRICS_USERNAME;
  const password = process.env.METRICS_PASSWORD;

  if (!username || !password) {
    return unavailable();
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Basic ')) {
    return unauthorized();
  }

  let decoded = '';
  try {
    decoded = atob(authorization.slice('Basic '.length));
  } catch {
    return unauthorized();
  }

  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex < 0) {
    return unauthorized();
  }

  const suppliedUsername = decoded.slice(0, separatorIndex);
  const suppliedPassword = decoded.slice(separatorIndex + 1);

  if (
    timingSafeEqual(suppliedUsername, username) &&
    timingSafeEqual(suppliedPassword, password)
  ) {
    return NextResponse.next();
  }

  return unauthorized();
}

export const config = {
  matcher: ['/metrics/:path*'],
};
