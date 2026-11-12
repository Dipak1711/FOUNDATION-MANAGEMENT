import { useEffect, useRef, useState } from 'react'

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Counts a figure up to its value (easeOutQuint). Instant for reduced-motion users. */
export function AnimatedNumber({ value, format, duration = 900, className }: { value: number; format?: (v: number) => string; duration?: number; className?: string }) {
  const render = format ?? ((n: number) => String(Math.round(n)))
  const reduced = useRef(reducedMotion()).current
  const [shown, setShown] = useState(reduced ? value : 0)
  const from = useRef(reduced ? value : 0)

  useEffect(() => {
    if (reduced || from.current === value) { setShown(value); from.current = value; return }
    const start = performance.now(), a = from.current, delta = value - a
    let frame = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      from.current = a + delta * (1 - Math.pow(1 - t, 5))
      setShown(from.current)
      if (t < 1) frame = requestAnimationFrame(tick)
      else { from.current = value; setShown(value) }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, reduced])

  return <span className={`tabular-nums ${className ?? ''}`}>{render(shown)}</span>
}
