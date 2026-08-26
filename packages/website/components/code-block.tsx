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

  return (
    <div className="code-block">
      <pre><code>{code}</code></pre>
      <button type="button" onClick={copyCode} aria-label={isCopied ? 'Copied' : 'Copy code'}>
        {isCopied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        {isCopied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
