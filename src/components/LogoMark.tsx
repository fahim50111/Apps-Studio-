import { useId } from 'react';

export default function LogoMark({
  className = 'h-9 w-9',
  float = true,
}: {
  className?: string;
  float?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const bg = `app-logo-bg-${uid}`;
  const ga = `app-logo-a-${uid}`;
  const gb = `app-logo-b-${uid}`;
  const sh = `app-logo-shadow-${uid}`;

  return (
    <svg
      viewBox="0 0 512 512"
      role="img"
      aria-label="Apps Studio"
      className={`${className} ${float ? 'logo-float' : ''} shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-line/40`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={bg} x1="60" y1="42" x2="452" y2="470" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--c-panel2)" />
          <stop offset="0.58" stopColor="var(--c-bg)" />
          <stop offset="1" stopColor="var(--c-accent2)" />
        </linearGradient>
        <linearGradient id={ga} x1="126" y1="122" x2="386" y2="382" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--c-accent)" />
          <stop offset="1" stopColor="var(--c-accent2)" />
        </linearGradient>
        <linearGradient id={gb} x1="278" y1="122" x2="386" y2="382" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--c-accent2)" />
          <stop offset="1" stopColor="var(--c-accent3)" />
        </linearGradient>
        <filter id={sh} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="20" floodColor="#000000" floodOpacity="0.28" />
        </filter>
      </defs>

      <rect x="32" y="32" width="448" height="448" rx="112" fill={`url(#${bg})`} />
      <rect x="54" y="54" width="404" height="404" rx="96" fill="none" stroke="var(--c-line)" strokeWidth="10" opacity="0.65" />

      <g filter={`url(#${sh})`}>
        <rect x="126" y="122" width="108" height="108" rx="30" fill={`url(#${ga})`} />
        <rect x="278" y="122" width="108" height="108" rx="30" fill="var(--c-panel)" />
        <rect x="126" y="274" width="108" height="108" rx="30" fill="var(--c-panel)" />
        <rect x="278" y="274" width="108" height="108" rx="30" fill={`url(#${gb})`} />
      </g>

      <path d="M307 162c0-21 17-38 43-38 19 0 33 7 44 18l-19 22c-8-7-16-11-27-11-10 0-17 4-17 11 0 9 10 12 28 18 24 8 42 20 42 47 0 27-22 45-54 45-24 0-45-9-59-24l20-23c11 11 25 17 40 17 13 0 21-5 21-13 0-9-9-13-27-19-23-8-35-20-35-48Z" fill="var(--c-fg)" />
      <path d="M182 371h-30l41-72 41 72h-30v48h-22v-48Z" fill="var(--c-fg)" opacity="0.9" />
      <circle cx="386" cy="126" r="18" fill="var(--c-accent)" />
    </svg>
  );
}
