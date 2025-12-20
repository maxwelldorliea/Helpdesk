import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function safeFormat(date: Date | string | null | undefined, formatStr: string, fallback: string = 'N/A'): string {
    if (!date) return fallback
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (!isValid(dateObj)) return fallback
    return format(dateObj, formatStr)
}

export function formatDate(date: Date | string, timezone?: string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(dateObj)
}

export function formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return formatDate(dateObj)
}

export function calculateSLAStatus(dueDate: Date | string): {
    timeRemaining: string
    urgency: 'low' | 'medium' | 'high' | 'overdue'
    percentage: number
} {
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate

    if (!isValid(due)) {
        return {
            timeRemaining: 'N/A',
            urgency: 'low',
            percentage: 0,
        }
    }

    const now = new Date()
    const diffInMs = due.getTime() - now.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)

    if (diffInMs < 0) {
        const overdueMs = Math.abs(diffInMs)
        const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60))
        const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60))

        return {
            timeRemaining: overdueHours > 24 ? `${Math.floor(overdueHours / 24)}d ${overdueHours % 24}h overdue` : `${overdueHours}h ${overdueMinutes}m overdue`,
            urgency: 'overdue',
            percentage: 0,
        }
    }

    let urgency: 'low' | 'medium' | 'high' | 'overdue' = 'low'
    if (diffInHours < 2) urgency = 'high'
    else if (diffInHours < 24) urgency = 'medium'

    const hours = Math.floor(diffInHours)
    const minutes = Math.floor((diffInHours - hours) * 60)

    return {
        timeRemaining: hours > 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h ${minutes}m`,
        urgency,
        percentage: Math.min(100, Math.max(0, (diffInHours / 48) * 100)),
    }
}

export function calculateSLAMetrics(
    creation: string,
    actionDate: string | null,
    deadlineDate: string | null,
    type: 'Response' | 'Resolution'
): string | null {
    if (!actionDate) return null

    const action = new Date(actionDate)
    const created = new Date(creation)
    const verb = type === 'Response' ? 'Responded' : 'Resolved'

    if (deadlineDate) {
        const deadline = new Date(deadlineDate)
        if (action > deadline) {
            const diffInMs = action.getTime() - deadline.getTime()
            const hours = Math.floor(diffInMs / (1000 * 60 * 60))
            const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60))

            const timeStr = hours > 24
                ? `${Math.floor(hours / 24)}d ${hours % 24}h`
                : `${hours}h ${minutes}m`

            return `Overdue by ${timeStr}`
        }
    }

    const diffInMs = action.getTime() - created.getTime()
    const hours = Math.floor(diffInMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60))

    const timeStr = hours > 24
        ? `${Math.floor(hours / 24)}d ${hours % 24}h`
        : `${hours}h ${minutes}m`

    return `${verb} within ${timeStr}`
}
