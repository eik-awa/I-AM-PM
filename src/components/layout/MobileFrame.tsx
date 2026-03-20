import type { ReactNode } from 'react'

export function MobileFrame({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050508]">
      <div
        className="relative w-full h-full max-w-[430px] max-h-[932px] bg-pm-bg overflow-hidden"
        style={{ boxShadow: '0 0 60px rgba(0,180,216,0.1)' }}
      >
        {children}
      </div>
    </div>
  )
}
