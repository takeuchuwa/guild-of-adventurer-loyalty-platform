import { useEffect, useRef, useState } from "react"

/**
 * Listens for hardware scanner events globally.
 * Hardware scanners typically act as rapid keyboards, usually appending "Enter" at the end.
 */
export function useHardwareScanner(onScan: (data: string) => void) {
  const [isInputActive, setIsInputActive] = useState(false)
  const bufferRef = useRef("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleFocusCheck = () => {
      const activeElement = document.activeElement
      const active = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA"
      setIsInputActive(active)
    }

    handleFocusCheck()
    window.addEventListener("focusin", handleFocusCheck)
    window.addEventListener("focusout", handleFocusCheck)

    const handleKeyDown = (e: KeyboardEvent) => {
      // Safety check: is the admin inside an input field?
      // If so, we let normal typing happen and don't intercept for the scanner buffer
      const activeElement = document.activeElement
      const isInputActiveLocal =
        activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA"

      if (e.key === "Enter") {
        if (bufferRef.current.length > 5 && !isInputActiveLocal) {
          // Fast buffer ending with Enter usually means a scan is complete
          onScan(bufferRef.current)
        }
        bufferRef.current = ""
        if (timerRef.current) clearTimeout(timerRef.current)
        return
      }

      if (!isInputActiveLocal) {
        // Only collect keys if they aren't typing into a form field
        if (e.key.length === 1) {
          bufferRef.current += e.key
        }

        // Clear existing timeout
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }

        // Set a new timeout to clear the buffer if keystrokes stop.
        // Scanners typically send keystrokes <20ms apart. 100ms is a safe gap.
        timerRef.current = setTimeout(() => {
          bufferRef.current = ""
        }, 80)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("focusin", handleFocusCheck)
      window.removeEventListener("focusout", handleFocusCheck)
      window.removeEventListener("keydown", handleKeyDown)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [onScan])

  return { isInputActive }
}
