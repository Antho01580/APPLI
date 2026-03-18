interface StatCardProps {
  title: string
  value: string | number
  icon: string
  color?: string
  subtitle?: string
}

export default function StatCard({ title, value, icon, color = 'text-weform-blue', subtitle }: StatCardProps) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`text-3xl ${color}`} dangerouslySetInnerHTML={{ __html: icon }} />
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
