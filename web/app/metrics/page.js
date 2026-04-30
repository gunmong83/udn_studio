import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatDuration(seconds) {
  if (!seconds) {
    return '0s';
  }
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes}m ${rest}s` : `${rest}s`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export default async function MetricsPage() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalVisits, todayVisits, uniqueSessions, averageDuration, recentVisits, topPages] =
    await Promise.all([
      prisma.siteVisit.count(),
      prisma.siteVisit.count({ where: { startedAt: { gte: today } } }),
      prisma.siteVisit
        .findMany({
          where: { startedAt: { gte: sevenDaysAgo } },
          distinct: ['sessionId'],
          select: { sessionId: true },
        })
        .then((rows) => rows.length),
      prisma.siteVisit.aggregate({
        where: { durationSeconds: { not: null } },
        _avg: { durationSeconds: true },
      }),
      prisma.siteVisit.findMany({
        orderBy: { startedAt: 'desc' },
        take: 30,
      }),
      prisma.siteVisit.groupBy({
        by: ['path'],
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 8,
      }),
    ]);

  const averageSeconds = Math.round(averageDuration._avg.durationSeconds || 0);

  return (
    <main className="metrics-page">
      <header className="metrics-header">
        <div>
          <p className="metrics-eyebrow">Studio UDN</p>
          <h1>Metrics</h1>
        </div>
        <span>{formatDate(now)}</span>
      </header>

      <section className="metrics-summary" aria-label="Metrics summary">
        <div>
          <span>Total visits</span>
          <strong>{totalVisits.toLocaleString('ko-KR')}</strong>
        </div>
        <div>
          <span>Today</span>
          <strong>{todayVisits.toLocaleString('ko-KR')}</strong>
        </div>
        <div>
          <span>Unique sessions, 7d</span>
          <strong>{uniqueSessions.toLocaleString('ko-KR')}</strong>
        </div>
        <div>
          <span>Average stay</span>
          <strong>{formatDuration(averageSeconds)}</strong>
        </div>
      </section>

      <section className="metrics-grid">
        <div className="metrics-panel">
          <h2>Top Pages</h2>
          <div className="metrics-list">
            {topPages.map((page) => (
              <div className="metrics-row" key={page.path}>
                <span>{page.path}</span>
                <strong>{page._count.path}</strong>
              </div>
            ))}
            {!topPages.length && <p className="metrics-empty">No visits yet.</p>}
          </div>
        </div>

        <div className="metrics-panel metrics-panel--wide">
          <h2>Recent Visits</h2>
          <div className="metrics-table">
            <div className="metrics-table-head">
              <span>Time</span>
              <span>Path</span>
              <span>Stay</span>
              <span>Referrer</span>
            </div>
            {recentVisits.map((visit) => (
              <div className="metrics-table-row" key={visit.id}>
                <span>{formatDate(visit.startedAt)}</span>
                <span>{visit.path}</span>
                <span>{formatDuration(visit.durationSeconds)}</span>
                <span>{visit.referrer || '-'}</span>
              </div>
            ))}
            {!recentVisits.length && <p className="metrics-empty">No visits yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
