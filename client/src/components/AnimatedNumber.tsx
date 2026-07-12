import { useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'

export default function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number
  format?: (n: number) => string
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)
  const formatFn = format || ((n: number) => Math.round(n).toLocaleString())

  useEffect(() => {
    const controls = animate(prevValue.current, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    })
    prevValue.current = value
    return () => controls.stop()
  }, [value])

  return <span className={className}>{formatFn(display)}</span>
}
