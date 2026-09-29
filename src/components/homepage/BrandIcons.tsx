import type { SVGProps } from "react";

// Simplified brand marks for the homepage hero; they carry their own colors

type IconProps = SVGProps<SVGSVGElement>;

export function NotionIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect x="3.5" y="3" width="17" height="18" rx="2.5" fill="#fff" />
      <path
        d="M8 17V7.5l7.5 9.5V7"
        fill="none"
        stroke="#111"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#f5f5f5"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"
      />
    </svg>
  );
}

export function SlackIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <rect x="9.5" y="2.5" width="3.2" height="8" rx="1.6" fill="#36c5f0" />
      <rect x="13.5" y="9.5" width="8" height="3.2" rx="1.6" fill="#2eb67d" />
      <rect x="11.3" y="13.5" width="3.2" height="8" rx="1.6" fill="#ecb22e" />
      <rect x="2.5" y="11.3" width="8" height="3.2" rx="1.6" fill="#e01e5a" />
    </svg>
  );
}

export function VSCodeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#23a9f2"
        d="M17 2.5l4.5 2.2v14.6L17 21.5 7.8 13.2 4 16.1l-1.5-.8V8.7L4 7.9l3.8 2.9L17 2.5zm0 5.3L11 12l6 4.2V7.8zM4 9.9v4.2L6 12 4 9.9z"
      />
    </svg>
  );
}
