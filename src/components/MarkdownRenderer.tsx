import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Check, Copy, ExternalLink } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  return (
    <div className={`kaist-markdown ${className}`}>
      <ReactMarkdown
        components={{
          code({ node, inline, className: codeClassName, children, ...props }: any) {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline && (match || codeString.includes("\n"))) {
              return <CodeBlock language={match ? match[1] : "code"} value={codeString} />;
            }
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-300 font-mono text-[12px]"
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded-lg border border-zinc-200 dark:border-zinc-800 max-w-full">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs text-left">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className="bg-zinc-100 dark:bg-zinc-800/80 font-semibold text-zinc-900 dark:text-zinc-100">
                {children}
              </thead>
            );
          },
          tbody({ children }) {
            return (
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 bg-white dark:bg-transparent">
                {children}
              </tbody>
            );
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300">
                {children}
              </td>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-0.5 break-all"
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-[#0d0d10] text-zinc-100 text-xs font-mono shadow-xs max-w-full">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-800/70 border-b border-zinc-700/50 text-[11px] text-zinc-400">
        <span className="font-semibold uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-zinc-700/60"
          title="Sao chép mã nguồn"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto">
        <pre className="!bg-transparent !p-0 !m-0 !border-0 font-mono text-xs leading-relaxed text-zinc-100 whitespace-pre">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}