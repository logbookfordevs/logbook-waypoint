import Image from 'next/image';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__thelu" aria-hidden="true">
        <Image src="/brand/thelu-profile.webp" alt="" width={180} height={180} />
      </div>
      <div>
        <strong>Logbook Waypoint</strong>
        <p>Charting the technical seas, one commit at a time.</p>
      </div>
      <div className="site-footer__links">
        <a href="https://logbookfordevs.com/">A tool from the Logbook for Devs</a>
        <a href="https://github.com/logbookfordevs/logbook-waypoint">Repository</a>
        <a href="/docs">Documentation</a>
      </div>
    </footer>
  );
}
