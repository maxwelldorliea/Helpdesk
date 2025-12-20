import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { TicketTable } from '@/components/tickets/TicketTable'
import { CreateTicketDialog } from '@/components/tickets/CreateTicketDialog'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Plus, Ticket as TicketIcon, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import type { Ticket } from '@/lib/types'
import { api } from '@/lib/api'

import { useStreamGroup, useMotiaStream } from '@motiadev/stream-client-react'

export default function Tickets() {
    const navigate = useNavigate()
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [fetchTime, setFetchTime] = useState<Date | null>(null)
    const { data: streamedTickets } = useStreamGroup({ streamName: 'tickets', groupId: 'all' })
    const { stream } = useMotiaStream()

    const fetchTickets = async () => {
        setLoading(true)
        try {
            const now = new Date()
            const data = await api.getTickets()
            setTickets(data)
            setFetchTime(now)
        } catch (error) {
            console.error('Failed to fetch tickets:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTickets()
    }, [])

    useEffect(() => {
        if (streamedTickets && streamedTickets.length > 0 && fetchTime) {
            setTickets(prev => {
                const newTickets = [...prev]
                streamedTickets.forEach((st: any) => {
                    const index = newTickets.findIndex(t => t.name === st.name)
                    if (index !== -1) {
                        newTickets[index] = { ...newTickets[index], ...st } as Ticket
                    } else {
                        const creationDate = new Date(st.creation)
                        if (creationDate > fetchTime) {
                            newTickets.unshift(st as unknown as Ticket)
                        } else {
                            console.log('Ignoring stale ticket from stream:', st.name)
                        }
                    }
                })
                return newTickets
            })
        }
    }, [streamedTickets, fetchTime])

    const stats = [
        {
            title: 'Total Tickets',
            value: tickets.length,
            icon: TicketIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Open',
            value: tickets.filter(t => t.status === 'Open').length,
            icon: AlertCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
        {
            title: 'Replied',
            value: tickets.filter(t => t.status === 'Replied').length,
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
        {
            title: 'Resolved',
            value: tickets.filter(t => t.status === 'Resolved').length,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
    ]

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
                            {stream && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 gap-1 animate-pulse">
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    Live
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">
                            Manage your support tickets.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Ticket
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon
                        return (
                            <Card key={stat.title}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={`rounded-full p-2 ${stat.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex h-32 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <TicketTable
                                tickets={tickets}
                                onTicketClick={(ticket) => navigate(`/tickets/${ticket.name}`)}
                            />
                        )}
                    </CardContent>
                </Card>

                <CreateTicketDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setIsCreateDialogOpen}
                    onTicketCreated={fetchTickets}
                />
            </div>
        </MainLayout>
    )
}
