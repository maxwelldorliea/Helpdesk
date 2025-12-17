import { Mail, MessageCircle, Phone, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Channel, ChannelConfig } from '@/lib/types'

interface ChannelIconProps {
    channel: Channel | string | ChannelConfig
    className?: string
}

export function ChannelIcon({ channel, className }: ChannelIconProps) {
    const name = typeof channel === 'object' ? channel.name : channel
    const normalized = name.toLowerCase()

    const baseClass = cn("h-4 w-4", className)

    switch (normalized) {
        case 'email':
            return <Mail className={baseClass} />
        case 'whatsapp':
            return <MessageCircle className={cn(baseClass, !className?.includes('text-') && "text-green-600")} />
        case 'phone':
            return <Phone className={baseClass} />
        case 'chat':
            return <MessageSquare className={baseClass} />
        default:
            return <Mail className={baseClass} />
    }
}
