import { QRCodeSVG } from "qrcode.react"

interface QrCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

export function QrCodeDisplay({ value, size = 200, className = "" }: QrCodeDisplayProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="p-3 bg-guild-text rounded-2xl" data-radius-exempt>
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          bgColor="#EDE6D8"
          fgColor="#0E0D0C"
        />
      </div>
    </div>
  )
}
