import type { ReactNode } from 'react';

function I({ children, size = 15 }: { children: ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const VectorIcon = () => (
  <I>
    <path d="M4 20c6 0 10-4 10-10M4 20V4h16" />
    <circle cx="14" cy="10" r="2" />
  </I>
);
export const ImageIcon = () => (
  <I>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 16-5-5-9 9" />
  </I>
);
export const BadgeIcon = () => (
  <I>
    <rect x="2" y="7" width="20" height="10" rx="3" />
    <path d="M9 7v10" />
  </I>
);
export const MathMLIcon = () => (
  <I>
    <path d="M4 4h3v16H4M20 4h-3v16h3M9 9l6 6M15 9l-6 6" />
  </I>
);
export const HtmlIcon = () => (
  <I>
    <path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />
  </I>
);
export const LinkIcon = () => (
  <I>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5" />
  </I>
);
export const MarkdownIcon = () => (
  <I>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 15V9l3 3 3-3v6M16 9v6M14 13l2 2 2-2" />
  </I>
);
export const CodeIcon = () => (
  <I>
    <path d="m8 8-4 4 4 4M16 8l4 4-4 4" />
  </I>
);
export const DownloadIcon = () => (
  <I>
    <path d="M12 4v11M7 10l5 5 5-5M4 19h16" />
  </I>
);
export const CheckIcon = () => (
  <I>
    <path d="m5 12 4 4L19 7" />
  </I>
);
export const QrIcon = () => (
  <I>
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    <path d="M14 14h3v3h-3zM20 14v3M17 20h3M14 20h1" />
  </I>
);
export const ShareIcon = () => (
  <I>
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
  </I>
);
export const CopyIcon = () => (
  <I>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </I>
);
