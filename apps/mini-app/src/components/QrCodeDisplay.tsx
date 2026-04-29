import { QRCodeSVG } from "qrcode.react"

interface QrCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

export function QrCodeDisplay({ value, size = 200, className = "" }: QrCodeDisplayProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="p-3 bg-white rounded-2xl">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          bgColor="#FFFFFF"
          fgColor="#001610"
        />
      </div>
    </div>
  )
}
