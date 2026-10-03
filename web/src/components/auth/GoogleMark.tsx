type GoogleMarkProps = { className?: string };

/** The official four-colour Google "G" mark used for OAuth actions. */
export default function GoogleMark({ className = "h-5 w-5" }: GoogleMarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56C20.68 17.83 22 15.1 22 12c0-.72-.07-1.41-.2-2.08H12z" />
      <path fill="#4285F4" d="M12 22c2.7 0 4.96-.9 6.62-2.29l-3.3-2.56c-.91.61-2.07.98-3.32.98-2.55 0-4.71-1.72-5.49-4.04H3.1v2.64A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.51 14.09A6 6 0 0 1 6.2 12c0-.72.12-1.42.31-2.09V7.27H3.1A10 10 0 0 0 2 12c0 1.62.39 3.15 1.1 4.73l3.41-2.64z" />
      <path fill="#34A853" d="M12 5.87c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.92 14.69 2 12 2a10 10 0 0 0-8.9 5.27l3.41 2.64C7.29 7.59 9.45 5.87 12 5.87z" />
    </svg>
  );
}
