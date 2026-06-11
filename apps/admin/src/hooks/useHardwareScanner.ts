import { useEffect, useRef, useState } from "react"

// Maps physical key codes to US keyboard layout characters
const CODE_TO_CHAR_US: Record<string, string> = {
  // Letters
  KeyA: "a", KeyB: "b", KeyC: "c", KeyD: "d", KeyE: "e", KeyF: "f", KeyG: "g", KeyH: "h",
  KeyI: "i", KeyJ: "j", KeyK: "k", KeyL: "l", KeyM: "m", KeyN: "n", KeyO: "o", KeyP: "p",
  KeyQ: "q", KeyR: "r", KeyS: "s", KeyT: "t", KeyU: "u", KeyV: "v", KeyW: "w", KeyX: "x",
  KeyY: "y", KeyZ: "z",
  
  // Digits
  Digit1: "1", Digit2: "2", Digit3: "3", Digit4: "4", Digit5: "5",
  Digit6: "6", Digit7: "7", Digit8: "8", Digit9: "9", Digit0: "0",
  
  // Symbols
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backquote: "`",
  Space: " "
};

const CODE_TO_CHAR_US_SHIFT: Record<string, string> = {
  // Letters (uppercase)
  KeyA: "A", KeyB: "B", KeyC: "C", KeyD: "D", KeyE: "E", KeyF: "F", KeyG: "G", KeyH: "H",
  KeyI: "I", KeyJ: "J", KeyK: "K", KeyL: "L", KeyM: "M", KeyN: "N", KeyO: "O", KeyP: "P",
  KeyQ: "Q", KeyR: "R", KeyS: "S", KeyT: "T", KeyU: "U", KeyV: "V", KeyW: "W", KeyX: "X",
  KeyY: "Y", KeyZ: "Z",
  
  // Digits shifted
  Digit1: "!", Digit2: "@", Digit3: "#", Digit4: "$", Digit5: "%",
  Digit6: "^", Digit7: "&", Digit8: "*", Digit9: "(", Digit0: ")",
  
  // Symbols shifted
  Minus: "_",
  Equal: "+",
  BracketLeft: "{",
  BracketRight: "}",
  Backslash: "|",
  Semicolon: ":",
  Quote: "\"",
  Comma: "<",
  Period: ">",
  Slash: "?",
  Backquote: "~",
  Space: " "
};

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

      if (e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter") {
        if (bufferRef.current.length > 5 && !isInputActiveLocal) {
          // Fast buffer ending with Enter usually means a scan is complete
          onScan(bufferRef.current)
        }
        bufferRef.current = ""
        if (timerRef.current) clearTimeout(timerRef.current)
        return
      }

      if (!isInputActiveLocal) {
        // Collect layout-independent characters based on physical key codes (standard US keyboard mapping)
        let char = ""
        if (e.code) {
          if (e.shiftKey) {
            char = CODE_TO_CHAR_US_SHIFT[e.code] || ""
          } else {
            char = CODE_TO_CHAR_US[e.code] || ""
          }
        }

        // Fallback to e.key for unmapped or custom characters (e.g. numeric keypad when NumLock is off/on)
        if (!char && e.key.length === 1) {
          char = e.key
        }

        if (char) {
          bufferRef.current += char
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

