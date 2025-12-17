import { Clock } from 'lucide-react'
import { calculateSLAStatus } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SLATimerProps {
    dueDate: string | Date
    className?: string
}

export function SLATimer({ dueDate, className }: SLATimerProps) {
    const { timeRemaining, urgency } = calculateSLAStatus(dueDate)

    const urgencyColors = {
        low: 'text-green-600 bg-green-50 border-green-200',
        medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        high: 'text-red-600 bg-red-50 border-red-200',
        overdue: 'text-red-700 bg-red-100 border-red-300 font-semibold',
    }

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs',
                urgencyColors[urgency],
                className
            )}
        >
            <Clock className="h-3 w-3" />
            <span>{timeRemaining}</span>
        </div>
    )
}
