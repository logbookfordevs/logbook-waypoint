'use client';

import { BellRing, GitFork } from 'lucide-react';
import { useState } from 'react';

export function LaunchStatus() {
  const [isExplaining, setIsExplaining] = useState(false);

  return (
    <div id="launch" className="launch-status">
      <button type="button" onClick={() => setIsExplaining((isOpen) => !isOpen)}>
        <BellRing aria-hidden="true" />
        Coming soon
      </button>
      <p
        className="launch-status__message"
        role="status"
        aria-hidden={!isExplaining}
        data-visible={isExplaining}
      >
        The extension and npm package are not published yet. Follow development in the{' '}
        <a href="https://github.com/logbookfordevs/logbook-waypoint">
          <GitFork aria-hidden="true" /> repository
        </a>.
      </p>
    </div>
  );
}
