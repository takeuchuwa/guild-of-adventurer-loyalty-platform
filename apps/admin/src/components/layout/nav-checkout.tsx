import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export function NavCheckout() {
    const navigate = useNavigate()
    const { pathname } = useLocation()

    // The sidebar advertises «F2», so the key has to actually work.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "F2" || event.repeat) return
            // Don't hijack the key while a modal owns the screen.
            if (document.querySelector('[data-slot="dialog-content"]')) return
            event.preventDefault()
            if (pathname !== "/checkout") navigate("/checkout")
        }

        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [navigate, pathname])

    return (
        <button
            type="button"
            onClick={() => navigate("/checkout")}
            className="bg-primary text-primary-foreground font-heading flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-[17px] font-semibold uppercase tracking-[.12em] transition-colors hover:bg-accent-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
            Каса
            <span className="font-mono text-[11px] tracking-[.1em] opacity-65">F2</span>
        </button>
    )
}
