'use client';

import { BellRing, GitFork } from 'lucide-react';
import { useState } from 'react';

export function LaunchStatus() {
  const [isExplaining, setIsExplaining] = useState(false);

  return (
    <div id="launch" className="launch-status">
      <button type="button" onClick={() => setIsExplaining((isOpen) => !isOpen)}>
        <BellRing aria-hidden="true" />
        Available now
      </button>
      <p
        className="launch-status__message"
        role="status"
        aria-hidden={!isExplaining}
        data-visible={isExplaining}
      >
        Install the CLI from npm or a checksummed GitHub Release. Build the browser extension from the{' '}
        <a href="https://github.com/logbookfordevs/logbook-waypoint">
          <GitFork aria-hidden="true" /> repository
        </a>.
      </p>
    </div>
  );
}
