import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
    LayoutDashboard,
    Ticket as TicketIcon,
    Bot,
    Clock,
    CheckCircle,
    TrendingUp,
    Users,
    Calendar,
    AlertTriangle,
    PauseCircle
} from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface AgentPerformance {
    agent_id: string
    email: string
    name: string
    resolved_count: number
    closed_count: number
}

interface DashboardStats {
    total_tickets: number
    status_counts: {
        open: number
        replied: number
        'on hold': number
        resolved: number
        closed: number
    }
    bot_resolved: number
    agent_performance: AgentPerformance[]
    avg_first_response_hours: number | null
    avg_resolution_hours: number | null
    sla_compliance: number
    avg_hold_time_hours: number | null
}

type Period = 'today' | '7d' | '30d' | '3m' | '6m' | '1y' | 'all' | 'custom'

const periodOptions: { value: Period; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '3m', label: '3 Months' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' },
    { value: 'custom', label: 'Custom' },
]

export default function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [period, setPeriod] = useState<Period>('30d')
    const [customStartDate, setCustomStartDate] = useState<string>('')
    const [customEndDate, setCustomEndDate] = useState<string>('')
    const { isAdminAgent, isSystemManager, loading: authLoading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!authLoading && !isAdminAgent && !isSystemManager) {
            navigate('/tickets')
        }
    }, [authLoading, isAdminAgent, isSystemManager, navigate])

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true)
            try {
                let data
                if (period === 'custom' && customStartDate && customEndDate) {
                    data = await api.getStats(undefined, customStartDate, customEndDate)
                } else if (period !== 'custom') {
                    data = await api.getStats(period)
                } else {
                    setLoading(false)
                    return
                }
                setStats(data)
            } catch (err) {
                console.error('Failed to fetch stats:', err)
                setError('Failed to load dashboard statistics')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [period, customStartDate, customEndDate])

    const formatHours = (hours: number | null): string => {
        if (hours === null) return 'N/A'
        if (hours < 1) return `${Math.round(hours * 60)} min`
        if (hours < 24) return `${hours.toFixed(1)} hrs`
        return `${(hours / 24).toFixed(1)} days`
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </MainLayout>
        )
    }

    if (error || !stats) {
        return (
            <MainLayout>
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                    {error || 'No data available'}
                </div>
            </MainLayout>
        )
    }

    const summaryCards = [
        {
            title: 'Total Tickets',
            value: stats.total_tickets,
            icon: TicketIcon,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Resolved',
            value: stats.status_counts.resolved + stats.status_counts.closed,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Bot Resolutions',
            value: stats.bot_resolved,
            icon: Bot,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Avg Response Time',
            value: formatHours(stats.avg_first_response_hours),
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'SLA Compliance',
            value: `${stats.sla_compliance}%`,
            icon: AlertTriangle,
            color: stats.sla_compliance < 90 ? 'text-red-600' : 'text-green-600',
            bgColor: stats.sla_compliance < 90 ? 'bg-red-100' : 'bg-green-100',
        },
        {
            title: 'Avg Hold Time',
            value: formatHours(stats.avg_hold_time_hours),
            icon: PauseCircle,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ]

    return (
        <MainLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                            <LayoutDashboard className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                            <p className="text-muted-foreground">
                                Helpdesk performance analytics and insights.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                                {periodOptions.map((option) => (
                                    <Button
                                        key={option.value}
                                        variant={period === option.value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setPeriod(option.value)}
                                        className={cn(
                                            'text-xs',
                                            period === option.value && 'shadow-sm'
                                        )}
                                    >
                                        {option.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        {period === 'custom' && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="px-3 py-1.5 text-sm border rounded-md bg-background"
                                />
                                <span className="text-muted-foreground">to</span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="px-3 py-1.5 text-sm border rounded-md bg-background"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {summaryCards.map((card) => {
                        const Icon = card.icon
                        return (
                            <Card key={card.title}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {card.title}
                                    </CardTitle>
                                    <div className={`rounded-full p-2 ${card.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${card.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{card.value}</div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Ticket Status Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(stats.status_counts).map(([status, count]) => {
                                    const percentage = stats.total_tickets > 0
                                        ? Math.round((count / stats.total_tickets) * 100)
                                        : 0
                                    const colors: Record<string, string> = {
                                        open: 'bg-blue-500',
                                        replied: 'bg-yellow-500',
                                        'on hold': 'bg-orange-500',
                                        resolved: 'bg-green-500',
                                        closed: 'bg-gray-500'
                                    }
                                    return (
                                        <div key={status}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="capitalize font-medium">{status}</span>
                                                <span className="text-muted-foreground">{count} ({percentage}%)</span>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full ${colors[status] || 'bg-primary'} transition-all`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Response Metrics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg First Response</p>
                                        <p className="text-2xl font-bold">{formatHours(stats.avg_first_response_hours)}</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                                        <p className="text-2xl font-bold">{formatHours(stats.avg_resolution_hours)}</p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Agent Performance
                        </CardTitle>
                        <CardDescription>Tickets resolved and closed by each agent</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {stats.agent_performance.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No agent resolution data available yet.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-4 font-medium">Agent</th>
                                            <th className="text-center py-3 px-4 font-medium">Resolved</th>
                                            <th className="text-center py-3 px-4 font-medium">Closed</th>
                                            <th className="text-center py-3 px-4 font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.agent_performance
                                            .sort((a, b) => (b.resolved_count + b.closed_count) - (a.resolved_count + a.closed_count))
                                            .map((agent) => (
                                                <tr key={agent.agent_id} className="border-b last:border-0 hover:bg-muted/50">
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <span className="text-sm font-medium text-primary">
                                                                    {(agent.name || agent.email).charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{agent.name || agent.email}</span>
                                                                {agent.name && agent.name !== agent.email && (
                                                                    <span className="text-xs text-muted-foreground">{agent.email}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center py-3 px-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {agent.resolved_count}
                                                        </span>
                                                    </td>
                                                    <td className="text-center py-3 px-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                            {agent.closed_count}
                                                        </span>
                                                    </td>
                                                    <td className="text-center py-3 px-4 font-bold">
                                                        {agent.resolved_count + agent.closed_count}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <Bot className="h-5 w-5" />
                            AI Bot Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-4xl font-bold text-purple-700 dark:text-purple-300">{stats.bot_resolved}</p>
                                <p className="text-sm text-purple-600 dark:text-purple-400">Tickets auto-resolved</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                                    {stats.total_tickets > 0
                                        ? Math.round((stats.bot_resolved / stats.total_tickets) * 100)
                                        : 0}%
                                </p>
                                <p className="text-sm text-purple-600 dark:text-purple-400">of total tickets</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}
