'use client'

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  color?: string
  showCount?: boolean
}

export default function ProgressBar({ value, max, label, color = 'bg-weform-blue', showCount = true }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div>
      {(label || showCount) && (
        <div className="flex justify-between text-sm mb-1">
          {label && <span className="text-gray-600">{label}</span>}
          {showCount && (
            <span className="text-gray-500">
              {value}/{max} ({percentage}%)
            </span>
          )}
        </div>
      )}
      <div className="progress-bar">
        <div className={`progress-fill ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}
