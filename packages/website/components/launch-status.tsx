'use client';

import { BellRing, ExternalLink } from 'lucide-react';
import { useState } from 'react';

import { chromeWebStoreUrl } from '@/lib/site-config';

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
        Install the browser extension from the{' '}
        <a href={chromeWebStoreUrl} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" /> Chrome Web Store
        </a>.
      </p>
    </div>
  );
}
