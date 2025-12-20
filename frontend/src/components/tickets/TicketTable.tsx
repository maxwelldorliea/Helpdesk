import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { ChannelIcon } from './ChannelIcon'
import type { Ticket, TicketStatus, Priority } from '@/lib/types'
import { cn, safeFormat, calculateSLAStatus, calculateSLAMetrics } from '@/lib/utils'
import {
    ArrowUpDown,
    Timer,
    Search
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select'

interface TicketTableProps {
    tickets: Ticket[]
    onTicketClick?: (ticket: Ticket) => void
}

type SortField = 'name' | 'creation' | 'priority' | 'status'
type SortDirection = 'asc' | 'desc'

export function TicketTable({ tickets, onTicketClick }: TicketTableProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
    const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
    const [sortField, setSortField] = useState<SortField>('creation')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const filteredTickets = tickets
        .filter((ticket) => {
            const matchesSearch =
                ticket.name.toLowerCase().includes(search.toLowerCase()) ||
                ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
                (ticket.customerName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
                (ticket.customer?.toLowerCase().includes(search.toLowerCase()) ?? false)

            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
            const matchesPriority =
                priorityFilter === 'all' || ticket.priority === priorityFilter

            return matchesSearch && matchesStatus && matchesPriority
        })
        .sort((a, b) => {
            let comparison = 0

            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name)
                    break
                case 'creation':
                    const timeA = new Date(a.creation).getTime() || 0
                    const timeB = new Date(b.creation).getTime() || 0
                    comparison = timeA - timeB
                    break
                case 'priority':
                    const priorityOrder: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 }
                    comparison = (priorityOrder[a.priority || 'Low'] || 0) - (priorityOrder[b.priority || 'Low'] || 0)
                    break
                case 'status':
                    comparison = a.status.localeCompare(b.status)
                    break
            }

            return sortDirection === 'asc' ? comparison : -comparison
        })

    const getStatusStyles = (status: TicketStatus) => {
        const styles: Record<TicketStatus, string> = {
            Open: 'bg-blue-100 text-blue-700 border-blue-200',
            Replied: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'On Hold': 'bg-orange-100 text-orange-700 border-orange-200',
            Resolved: 'bg-green-100 text-green-700 border-green-200',
            Closed: 'bg-gray-100 text-gray-700 border-gray-200',
        }
        return styles[status]
    }

    const getPriorityStyles = (priority: string | null) => {
        const styles: Record<string, string> = {
            Low: 'bg-gray-100 text-gray-700 border-gray-200',
            Medium: 'bg-orange-100 text-orange-700 border-orange-200',
            High: 'bg-red-100 text-red-700 border-red-200',
            Critical: 'bg-purple-100 text-purple-700 border-purple-200',
        }
        return styles[priority || 'Low'] || styles['Low']
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search tickets..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | 'all')}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="Replied">Replied</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={priorityFilter}
                        onValueChange={(v) => setPriorityFilter(v as Priority | 'all')}
                    >
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">
                                    Channel
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <button
                                        onClick={() => handleSort('name')}
                                        className="flex items-center gap-2 hover:text-foreground"
                                    >
                                        Ticket ID
                                        <ArrowUpDown className="h-4 w-4" />
                                    </button>
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Subject
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Customer
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <button
                                        onClick={() => handleSort('status')}
                                        className="flex items-center gap-2 hover:text-foreground"
                                    >
                                        Status
                                        <ArrowUpDown className="h-4 w-4" />
                                    </button>
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    <button
                                        onClick={() => handleSort('priority')}
                                        className="flex items-center gap-2 hover:text-foreground"
                                    >
                                        Priority
                                        <ArrowUpDown className="h-4 w-4" />
                                    </button>
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    SLA Status
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Agent
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Response By
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    Resolution By
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map((ticket) => (
                                <tr
                                    key={ticket.name}
                                    onClick={() => onTicketClick?.(ticket)}
                                    className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                                >
                                    <td className="p-4 align-middle">
                                        <ChannelIcon channel={ticket.channel || 'Email'} className="h-4 w-4 text-muted-foreground" />
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className="font-mono text-sm font-medium">
                                            {ticket.name}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="max-w-md">
                                            <p className="font-medium">{ticket.subject}</p>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {ticket.description}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div>
                                            <p className="font-medium">{ticket.customerName || ticket.customer}</p>
                                            <p className="font-mono text-xs text-muted-foreground">
                                                {ticket.customer}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <Badge
                                            className={cn(
                                                'border capitalize',
                                                getStatusStyles(ticket.status)
                                            )}
                                            variant="outline"
                                        >
                                            {ticket.status}
                                        </Badge>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <Badge
                                            className={cn(
                                                'border capitalize',
                                                getPriorityStyles(ticket.priority)
                                            )}
                                            variant="outline"
                                        >
                                            {ticket.priority || 'Low'}
                                        </Badge>
                                    </td>
                                    <td className="p-4 align-middle">
                                        {ticket.agreement_status ? (
                                            <Badge variant="outline" className={
                                                ticket.agreement_status === 'Failed' ? 'bg-red-100 text-red-800' :
                                                    (ticket.agreement_status === 'Fulfilled' || ticket.agreement_status === 'Passed') ? 'bg-green-100 text-green-800' :
                                                        'bg-blue-100 text-blue-800'
                                            }>
                                                {ticket.agreement_status}
                                            </Badge>
                                        ) : '-'}
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className="text-sm">{ticket.assigneeName || ticket.agent || '-'}</span>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex flex-col">
                                            <span className="text-sm">{ticket.response_by ? safeFormat(ticket.response_by, 'MMM d, p') : '-'}</span>
                                            {ticket.response_by && !['Failed', 'Passed', 'Fulfilled'].includes(ticket.agreement_status || '') && !ticket.first_responded_on && (
                                                <span className={cn(
                                                    "text-xs flex items-center gap-1",
                                                    calculateSLAStatus(ticket.response_by).urgency === 'overdue' ? "text-destructive font-medium" :
                                                        calculateSLAStatus(ticket.response_by).urgency === 'high' ? "text-orange-500" : "text-muted-foreground"
                                                )}>
                                                    <Timer className="h-3 w-3" />
                                                    {calculateSLAStatus(ticket.response_by).timeRemaining}
                                                </span>
                                            )}
                                            {ticket.first_responded_on && (
                                                <span className={cn(
                                                    "text-xs flex items-center gap-1",
                                                    calculateSLAMetrics(ticket.creation, ticket.first_responded_on, ticket.response_by, 'Response')?.startsWith('Overdue')
                                                        ? "text-destructive font-medium"
                                                        : "text-green-600 font-medium"
                                                )}>
                                                    {calculateSLAMetrics(ticket.creation, ticket.first_responded_on, ticket.response_by, 'Response')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <div className="flex flex-col">
                                            <span className="text-sm">{ticket.resolution_by ? safeFormat(ticket.resolution_by, 'MMM d, p') : '-'}</span>
                                            {ticket.resolution_by && !['Failed', 'Passed', 'Fulfilled'].includes(ticket.agreement_status || '') && !ticket.resolution_date && (
                                                <span className={cn(
                                                    "text-xs flex items-center gap-1",
                                                    calculateSLAStatus(ticket.resolution_by).urgency === 'overdue' ? "text-destructive font-medium" :
                                                        calculateSLAStatus(ticket.resolution_by).urgency === 'high' ? "text-orange-500" : "text-muted-foreground"
                                                )}>
                                                    <Timer className="h-3 w-3" />
                                                    {calculateSLAStatus(ticket.resolution_by).timeRemaining}
                                                </span>
                                            )}
                                            {ticket.resolution_date && (
                                                <span className={cn(
                                                    "text-xs flex items-center gap-1",
                                                    calculateSLAMetrics(ticket.creation, ticket.resolution_date, ticket.resolution_by, 'Resolution')?.startsWith('Overdue')
                                                        ? "text-destructive font-medium"
                                                        : "text-green-600 font-medium"
                                                )}>
                                                    {calculateSLAMetrics(ticket.creation, ticket.resolution_date, ticket.resolution_by, 'Resolution')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredTickets.length === 0 && (
                    <div className="flex h-32 items-center justify-center text-muted-foreground">
                        No tickets found
                    </div>
                )}
            </div>

            <div className="text-sm text-muted-foreground">
                Showing {filteredTickets.length} of {tickets.length} tickets
            </div>
        </div>
    )
}
