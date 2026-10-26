// Small hand-drawn icon set (24px, 1.8 stroke). Kept local so the app doesn't
// look like every other lucide-icon dashboard.
type P = { className?: string; title?: string };
const S = ({ children, className, title }: P & { children: React.ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    className={className ?? "size-6"}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={title ? undefined : true}
    role={title ? "img" : undefined}
  >
    {title ? <title>{title}</title> : null}
    {children}
  </svg>
);

export const IconHome = (p: P) => (
  <S {...p}>
    <path d="M3 11 12 4l9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M10 20v-6h4v6" />
  </S>
);
export const IconYen = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 7 12 12l3.5-5M12 12v5.5M9 12.5h6M9 15h6" />
  </S>
);
export const IconChat = (p: P) => (
  <S {...p}>
    <path d="M4 5h16v11H9l-5 4z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </S>
);
export const IconPeople = (p: P) => (
  <S {...p}>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9.5" r="2.4" />
    <path d="M3.5 19c.6-3.4 2.8-5 5.5-5s4.9 1.6 5.5 5M14.5 15c2.6-.6 5.2.6 6 4" />
  </S>
);
export const IconRoute = (p: P) => (
  <S {...p}>
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />
  </S>
);
export const IconCamera = (p: P) => (
  <S {...p}>
    <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </S>
);
export const IconPencil = (p: P) => (
  <S {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
    <path d="m13.5 6.5 4 4" />
  </S>
);
export const IconShield = (p: P) => (
  <S {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />
    <path d="m9 12 2 2 4-4" />
  </S>
);
export const IconPhone = (p: P) => (
  <S {...p}>
    <path d="M6 3h3l1.5 4.5L8 9c1 2.6 3.4 5 6 6l1.5-2.5L20 14v3a3 3 0 0 1-3 3C9.8 20 4 14.2 4 7a3 3 0 0 1 2-4z" />
  </S>
);
export const IconArrowRight = (p: P) => (
  <S {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </S>
);
export const IconArrowLeft = (p: P) => (
  <S {...p}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </S>
);
export const IconSettings = (p: P) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
  </S>
);
export const IconTrash = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </S>
);
export const IconBook = (p: P) => (
  <S {...p}>
    <path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1z" />
    <path d="M12 6v14" />
  </S>
);
export const IconSend = (p: P) => (
  <S {...p}>
    <path d="M4 12 20 4l-5 16-3-7z" />
    <path d="m12 13 8-9" />
  </S>
);
export const IconCheck = (p: P) => (
  <S {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </S>
);
export const IconAlert = (p: P) => (
  <S {...p}>
    <path d="M12 3 2.5 20h19z" />
    <path d="M12 10v4.5M12 17.5v.01" />
  </S>
);
export const IconHeart = (p: P) => (
  <S {...p}>
    <path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10z" />
  </S>
);
export const IconCalendar = (p: P) => (
  <S {...p}>
    <rect x="4" y="5" width="16" height="15" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </S>
);
export const IconPin = (p: P) => (
  <S {...p}>
    <path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z" />
    <circle cx="12" cy="10" r="2.2" />
  </S>
);
export const IconInbox = (p: P) => (
  <S {...p}>
    <path d="M3 13h5l1.5 3h5L16 13h5" />
    <path d="M5 5h14l2 8v6H3v-6z" />
  </S>
);
export const IconChart = (p: P) => (
  <S {...p}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </S>
);
export const IconList = (p: P) => (
  <S {...p}>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </S>
);
export const IconLogout = (p: P) => (
  <S {...p}>
    <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />
  </S>
);
export const IconSparkle = (p: P) => (
  <S {...p}>
    <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" />
  </S>
);
