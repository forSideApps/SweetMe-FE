import { useRef, useEffect } from 'react'

export function useDebounce(delay = 400) {
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  function debounce(fn) {
    clearTimeout(timer.current)
    timer.current = setTimeout(fn, delay)
  }
  return debounce
}
