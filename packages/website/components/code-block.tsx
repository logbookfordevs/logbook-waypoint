'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeBlockProps {
  code: string;
}

export function CodeBlock({ code }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1600);
  };
  const copyIcon = isCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />;
  const copyLabel = isCopied ? 'Copied' : 'Copy';

  return (
    <div className="code-block">
      <pre><code>{code}</code></pre>
      <button type="button" onClick={copyCode} aria-label={isCopied ? 'Copied' : 'Copy code'}>
        {copyIcon}
        {copyLabel}
      </button>
    </div>
  );
}
