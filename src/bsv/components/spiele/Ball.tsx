import React from 'react'

/** Strich-Fußball (wie am Altersregler und auf der 404-Seite) */
export function Ball({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10.5" />
      <path d="M12 7.6l3.6 2.6-1.4 4.2H9.8L8.4 10.2z" className="ball-fleck" />
      <path d="M12 7.6V1.6M15.6 10.2l5.6-1.8M14.2 14.4l3.4 4.8M9.8 14.4l-3.4 4.8M8.4 10.2L2.8 8.4" />
    </svg>
  )
}
