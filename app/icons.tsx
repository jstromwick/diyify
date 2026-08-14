"use client";

export function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 2.64-6.36"></path>
      <path d="M3 4v5h5"></path>
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14"></path>
      <path d="m12 5 7 7-7 7"></path>
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 7v5l3 2"></path>
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.3-4.3"></path>
    </svg>
  );
}

export function PencilGroup() {
  return (
    <g transform="translate(78,54) rotate(38)">
      <rect x="-8" y="-46" width="16" height="70" rx="4" fill="var(--color-accent-300)"></rect>
      <rect x="-8" y="-46" width="16" height="12" rx="3" fill="var(--color-accent-700)"></rect>
      <polygon points="-8,24 8,24 0,40" fill="var(--color-neutral-700)"></polygon>
      <polygon points="-3,32 3,32 0,40" fill="var(--color-neutral-900)"></polygon>
    </g>
  );
}

export function IdleIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
      <PencilGroup />
      <path
        d="M14,96 q12,-22 26,0 t26,0 t26,0 t26,0"
        stroke="var(--color-accent-700)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      ></path>
    </svg>
  );
}

export function LoadingIllustration() {
  return (
    <svg width="140" height="120" viewBox="0 0 140 120" fill="none">
      <g style={{ animation: "bob 1.1s ease-in-out infinite", transformOrigin: "70px 60px" }}>
        <PencilGroup />
      </g>
      <path
        d="M16,98 q12,-24 26,0 t26,0 t26,0 t26,0"
        stroke="var(--color-accent-700)"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="220"
        strokeDashoffset="220"
        style={{ animation: "draw-line 1.6s ease-in-out infinite" }}
      ></path>
      <circle
        cx="100"
        cy="70"
        r="3"
        fill="var(--color-accent-500)"
        style={{ animation: "speck-float 1.8s ease-in infinite" }}
      ></circle>
      <circle
        cx="112"
        cy="66"
        r="2.4"
        fill="var(--color-accent-2-500)"
        style={{ animation: "speck-float 1.8s ease-in infinite 0.4s" }}
      ></circle>
      <circle
        cx="106"
        cy="78"
        r="2"
        fill="var(--color-accent-400)"
        style={{ animation: "speck-float 1.8s ease-in infinite 0.9s" }}
      ></circle>
    </svg>
  );
}