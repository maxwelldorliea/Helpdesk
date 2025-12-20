import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select'
import { FileInput } from '@/components/ui/FileInput'
import { ChannelIcon } from '@/components/tickets/ChannelIcon'
import { fileToBase64 } from '@/lib/fileUtils'
import { api } from '@/lib/api'
import type { Ticket, Communication, TicketStatus, Priority, ChannelConfig, AgentMembership, Team } from '@/lib/types'
import { cn, safeFormat } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import {
    ArrowLeft, Paperclip, User, Clock, AlertTriangle, Info,
    ChevronDown, Trash2, MoreVertical, Timer, Download, FileText
} from 'lucide-react'
import { calculateSLAStatus, calculateSLAMetrics } from '@/lib/utils'

import { useStreamItem, useStreamGroup, useMotiaStream } from '@motiadev/stream-client-react'

export default function TicketDetail() {
    const { role, isAdminAgent, isSystemManager } = useAuth()
    const canChangeTeam = isAdminAgent || isSystemManager
    const canUpdateStatus = role === 'Agent' || isAdminAgent || isSystemManager
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [loading, setLoading] = useState(true)
    const [replyText, setReplyText] = useState('')
    const [replyChannel, setReplyChannel] = useState<string>('Email')
    const [channels, setChannels] = useState<ChannelConfig[]>([])
    const [files, setFiles] = useState<File[]>([])
    const [sending, setSending] = useState(false)
    const [updating, setUpdating] = useState(false)
    const [teamMembers, setTeamMembers] = useState<AgentMembership[]>([])
    const [teams, setTeams] = useState<Team[]>([])

    const { data: streamedTicket } = useStreamItem({ streamName: 'tickets', groupId: 'all', id: id || '' })
    const { data: streamedCommunications } = useStreamGroup({ streamName: 'communications', groupId: id || '' })
    const { data: streamedStatus } = useStreamItem({ streamName: 'ticket_events', groupId: id || '', id: 'status' })
    const { stream } = useMotiaStream()

    useEffect(() => {
        if (stream) {
            console.log('Motia Stream connected')
        }
    }, [stream])

    useEffect(() => {
        if (id) {
            fetchTicket(id, true)
            fetchChannels()
            fetchTeams()
        }
    }, [id])

    useEffect(() => {
        if (ticket?.team) {
            fetchTeamMembers(ticket.team)
        }
    }, [ticket?.team])

    useEffect(() => {
        if (streamedTicket) {
            setTicket(prev => ({ ...prev, ...streamedTicket } as Ticket))
        }
    }, [streamedTicket])

    useEffect(() => {
        if (streamedCommunications && streamedCommunications.length > 0) {
            setTicket(prev => {
                if (!prev) return null
                const currentComms = prev.Communication || []
                const newComms = [...currentComms]
                let changed = false

                streamedCommunications.forEach((sc: any) => {
                    const index = newComms.findIndex(c => String(c.id) === String(sc.id))
                    if (index !== -1) {
                        const updated = { ...newComms[index], ...sc }
                        if (JSON.stringify(newComms[index]) !== JSON.stringify(updated)) {
                            newComms[index] = updated
                            changed = true
                        }
                    } else {
                        newComms.push(sc as Communication)
                        changed = true
                    }
                })

                return changed ? { ...prev, Communication: newComms } : prev
            })
        }
    }, [streamedCommunications])

    const [latestAiEvent, setLatestAiEvent] = useState<{ event: string, message: string } | null>(null)

    useEffect(() => {
        if (streamedStatus) {
            const latest = streamedStatus as any
            if (latest.event === 'completed') {
                const timer = setTimeout(() => setLatestAiEvent(null), 3000)
                return () => clearTimeout(timer)
            } else {
                setLatestAiEvent(latest)
                const timer = setTimeout(() => {
                    setLatestAiEvent(null)
                }, 30000)
                return () => clearTimeout(timer)
            }
        }
    }, [streamedStatus])
    const fetchTicket = async (ticketId: string, showLoading = false) => {
        if (showLoading) setLoading(true)
        try {
            const data = await api.getTicket(ticketId)
            setTicket(prev => {
                if (!prev) return data

                const existingComms = prev.Communication || []
                const dbComms = data.Communication || []
                const mergedComms = [...dbComms]

                existingComms.forEach(ec => {
                    if (!mergedComms.find(dc => String(dc.id) === String(ec.id))) {
                        mergedComms.push(ec)
                    }
                })

                return {
                    ...prev,
                    ...data,
                    Communication: mergedComms.sort((a, b) =>
                        new Date(a.creation).getTime() - new Date(b.creation).getTime()
                    )
                }
            })
            setReplyChannel(data.channel || 'Email')
        } catch (error) {
            console.error('Failed to fetch ticket:', error)
        } finally {
            if (showLoading) setLoading(false)
        }
    }

    const fetchChannels = async () => {
        try {
            const data = await api.getChannels()
            setChannels(data)
        } catch (error) {
            console.error('Failed to fetch channels:', error)
        }
    }

    const fetchTeamMembers = async (teamName: string) => {
        try {
            const members = await api.getTeamMembers(teamName)
            setTeamMembers(members)
        } catch (error) {
            console.error('Failed to fetch team members:', error)
        }
    }

    const fetchTeams = async () => {
        try {
            const data = await api.getTeams()
            setTeams(data)
        } catch (error) {
            console.error('Failed to fetch teams:', error)
        }
    }

    const handleUpdateTicket = async (updates: Partial<Ticket>) => {
        if (!ticket) return
        setUpdating(true)
        try {
            await api.updateTicket(ticket.name, updates)
            fetchTicket(ticket.name)
        } catch (error) {
            console.error('Failed to update ticket:', error)
        } finally {
            setUpdating(false)
        }
    }

    const handleEscalate = async () => {
        const currentTeam = teams.find(t => t.name === ticket?.team)
        if (!ticket || !currentTeam?.escalation_team) return

        try {
            await handleUpdateTicket({
                team: currentTeam.escalation_team,
                escalation_count: (ticket.escalation_count || 0) + 1
            })
        } catch (error) {
            console.error('Failed to escalate ticket:', error)
        }
    }

    const handleReply = async () => {
        if (!ticket || !replyText.trim()) return

        setSending(true)
        try {
            const attachments: Record<string, string> = {}
            for (const file of files) {
                const base64 = await fileToBase64(file)
                attachments[file.name] = base64
            }

            await api.replyToTicket(ticket.name, {
                body: replyText,
                attachments: Object.keys(attachments).length > 0 ? attachments : undefined,
                channel: replyChannel,
                raised_by: ticket.raised_by,
            })

            setReplyText('')
            setFiles([])
            fetchTicket(ticket.name)
        } catch (error) {
            console.error('Failed to send reply:', error)
        } finally {
            setSending(false)
        }
    }


    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-[50vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            </MainLayout>
        )
    }

    if (!ticket) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center space-y-4 py-12">
                    <h2 className="text-2xl font-bold">Ticket not found</h2>
                    <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
                </div>
            </MainLayout>
        )
    }

    const sortedCommunications = ticket.Communication?.sort(
        (a, b) => new Date(a.creation).getTime() - new Date(b.creation).getTime()
    ) || []

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-6 border-b pb-6 bg-white p-6 -mx-6 -mt-6 shadow-sm">
                    <div className="flex items-start gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mt-1 flex-shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 min-w-0 space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 break-words leading-tight mr-2">
                                    {ticket.subject}
                                </h1>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded text-sm">
                                        {ticket.name}
                                    </span>
                                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <ChannelIcon channel={ticket.channel || 'Email'} className="h-4 w-4" />
                                        {ticket.channel || 'Email'}
                                    </span>
                                    {stream && (
                                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 gap-1 animate-pulse h-5">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                            Live
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Select
                                    value={ticket.status}
                                    onValueChange={(val: TicketStatus) => handleUpdateTicket({ status: val })}
                                    disabled={updating || !canUpdateStatus}
                                >
                                    <SelectTrigger className={cn(
                                        "w-[130px] h-9 border-none text-white font-semibold shadow-sm",
                                        ticket.status === 'Open' && "bg-blue-600 hover:bg-blue-700",
                                        ticket.status === 'Replied' && "bg-yellow-500 hover:bg-yellow-600",
                                        ticket.status === 'On Hold' && "bg-orange-500 hover:bg-orange-600",
                                        ticket.status === 'Resolved' && "bg-green-600 hover:bg-green-700",
                                        ticket.status === 'Closed' && "bg-slate-600 hover:bg-slate-700"
                                    )}>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="Replied">Replied</SelectItem>
                                        <SelectItem value="On Hold">On Hold</SelectItem>
                                        <SelectItem value="Resolved">Resolved</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={ticket.priority || undefined}
                                    onValueChange={(val: Priority) => handleUpdateTicket({ priority: val })}
                                    disabled={updating || !canUpdateStatus}
                                >
                                    <SelectTrigger className="w-[130px] h-9 font-medium">
                                        <SelectValue placeholder="Priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={ticket.team || undefined}
                                    onValueChange={(val) => handleUpdateTicket({ team: val })}
                                    disabled={updating || !canChangeTeam}
                                >
                                    <SelectTrigger className="w-[160px] h-9 font-medium">
                                        <SelectValue placeholder="Team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teams.map((team) => (
                                            <SelectItem key={team.name} value={team.name}>
                                                {team.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={ticket.agent || undefined}
                                    onValueChange={(val) => handleUpdateTicket({ agent: val })}
                                    disabled={updating || !canUpdateStatus}
                                >
                                    <SelectTrigger className="w-[180px] h-9 font-medium">
                                        <SelectValue placeholder="Assignee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teamMembers.map((member) => (
                                            <SelectItem key={member.user} value={member.user}>
                                                {member.userInfo?.full_name || member.userInfo?.email || 'Unknown Agent'}
                                            </SelectItem>
                                        ))}
                                        {!ticket.team && <SelectItem value="unassigned" disabled>Select a team first</SelectItem>}
                                    </SelectContent>
                                </Select>

                                {canUpdateStatus && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50 font-medium"
                                        onClick={handleEscalate}
                                        disabled={updating || !teams.find(t => t.name === ticket.team)?.escalation_team}
                                    >
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Escalate
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <User className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Customer</span>
                                        <span className="font-medium text-slate-700">{ticket.customerName || ticket.raised_by}</span>
                                        {ticket.customerEmail && ticket.customerEmail !== ticket.customerName && (
                                            <span className="text-xs text-muted-foreground">{ticket.customerEmail}</span>
                                        )}
                                        {ticket.customerPhone && (
                                            <span className="text-xs text-muted-foreground">{ticket.customerPhone}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Clock className="h-4 w-4 text-slate-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Created On</span>
                                        <span className="font-medium text-slate-700">{safeFormat(ticket.creation, 'PPP p')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {latestAiEvent && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900">AI is working...</p>
                                    <p className="text-xs text-blue-700">{latestAiEvent.message}</p>
                                </div>
                            </div>
                        )}
                        <Card className="border-none shadow-none bg-transparent">
                            <CardContent className="p-0 space-y-6">
                                {sortedCommunications.map((comm: Communication) => {
                                    const isEvent = comm.direction === 'System' || comm.direction === 'Escalation'

                                    if (isEvent) {
                                        return (
                                            <div key={comm.id} className="flex flex-col items-center justify-center py-2">
                                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border border-muted text-[11px] font-medium text-muted-foreground shadow-sm">
                                                    {comm.direction === 'Escalation' ? (
                                                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                    ) : (
                                                        <Info className="h-3 w-3 text-blue-500" />
                                                    )}
                                                    <span>{comm.body}</span>
                                                    <span className="opacity-50">•</span>
                                                    <span>{safeFormat(comm.creation, 'p')}</span>
                                                </div>
                                            </div>
                                        )
                                    }

                                    return (
                                        <div
                                            key={comm.id}
                                            className={cn(
                                                "flex gap-4",
                                                comm.direction === 'Inbound' ? "" : "flex-row-reverse"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                                                comm.direction === 'Inbound' ? "bg-white border" : "bg-primary text-primary-foreground"
                                            )}>
                                                {comm.direction === 'Inbound' ? (
                                                    <ChannelIcon channel={comm.channel || 'Email'} className="h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <User className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div className={cn(
                                                "flex-1 max-w-[85%] rounded-2xl p-4 shadow-sm",
                                                comm.direction === 'Inbound' ? "bg-white border" : "bg-primary/10"
                                            )}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-semibold text-sm">
                                                        {comm.direction === 'Inbound' ? comm.raised_by : 'Support Agent'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {safeFormat(comm.creation, 'MMM d, p')}
                                                    </span>
                                                </div>
                                                <div className="prose prose-sm max-w-none text-foreground">
                                                    <p className="whitespace-pre-wrap">{comm.body}</p>
                                                </div>
                                                {comm.attachments && Object.keys(comm.attachments).length > 0 && (
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        {Object.entries(comm.attachments).map(([filename, content]) => {
                                                            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename) || (typeof content === 'string' && content.startsWith('data:image/'))
                                                            const isPdf = /\.pdf$/i.test(filename)

                                                            if (isImage && typeof content === 'string') {
                                                                return (
                                                                    <div key={filename} className="relative group max-w-sm">
                                                                        <img
                                                                            src={content}
                                                                            alt={filename}
                                                                            className="rounded-lg border shadow-sm max-h-64 object-contain bg-gray-50"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg gap-2">
                                                                            <a
                                                                                href={content}
                                                                                download={filename}
                                                                                className="flex items-center gap-1 bg-white/90 hover:bg-white text-slate-900 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                                                                            >
                                                                                <Download className="h-3.5 w-3.5" />
                                                                                Download
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            }

                                                            if (isPdf && typeof content === 'string') {
                                                                return (
                                                                    <div key={filename} className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm max-w-sm hover:bg-gray-50 transition-colors group">
                                                                        <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                                                                            <FileText className="h-5 w-5" />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-medium text-slate-900 truncate" title={filename}>{filename}</p>
                                                                            <p className="text-xs text-muted-foreground">PDF Document</p>
                                                                        </div>
                                                                        <a
                                                                            href={content}
                                                                            download={filename}
                                                                            className="p-2 rounded-full hover:bg-gray-200 text-slate-500 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100"
                                                                            title="Download"
                                                                        >
                                                                            <Download className="h-4 w-4" />
                                                                        </a>
                                                                    </div>
                                                                )
                                                            }

                                                            return (
                                                                <div key={filename} className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm max-w-sm hover:bg-gray-50 transition-colors group">
                                                                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600">
                                                                        <Paperclip className="h-5 w-5" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-slate-900 truncate" title={filename}>{filename}</p>
                                                                        <p className="text-xs text-muted-foreground">Attachment</p>
                                                                    </div>
                                                                    {typeof content === 'string' && (
                                                                        <a
                                                                            href={content}
                                                                            download={filename}
                                                                            className="p-2 rounded-full hover:bg-gray-200 text-slate-500 hover:text-slate-900 transition-colors opacity-0 group-hover:opacity-100"
                                                                            title="Download"
                                                                        >
                                                                            <Download className="h-4 w-4" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}

                                {sortedCommunications.length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        No messages yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Gmail-style Reply Box */}
                        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                            <div className="p-2">
                                <Textarea
                                    placeholder="Type your reply..."
                                    className="min-h-[200px] resize-none border-none focus-visible:ring-0 p-2 text-base shadow-none"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                {files.length > 0 && (
                                    <div className="mt-2 border-t pt-2">
                                        <FileInput
                                            files={files}
                                            onFilesChange={setFiles}
                                            maxFiles={3}
                                            className="border-0 p-0"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between px-2 py-2 border-t bg-gray-50/50">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        <Button
                                            onClick={handleReply}
                                            disabled={sending || !replyText.trim()}
                                            className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white h-9"
                                        >
                                            {sending ? 'Sending...' : 'Send'}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-6 rounded-none rounded-r-full border-l border-blue-500 bg-blue-600 hover:bg-blue-700 text-white -ml-1">
                                            <ChevronDown className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="h-6 w-px bg-gray-300 mx-2" />

                                    <Select value={replyChannel} onValueChange={setReplyChannel}>
                                        <SelectTrigger className="w-[130px] h-8 border-none shadow-none bg-transparent hover:bg-gray-100 focus:ring-0 px-2">
                                            <div className="flex items-center gap-2">
                                                <ChannelIcon channel={replyChannel} className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">{replyChannel}</span>
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {channels.length > 0 ? channels.map(c => (
                                                <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                                            )) : (
                                                <>
                                                    <SelectItem value="Email">Email</SelectItem>
                                                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    <div className="h-6 w-px bg-gray-300 mx-2" />

                                    <div className="flex items-center gap-0.5 text-gray-600">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200">
                                            <span className="font-serif font-bold text-lg">A</span>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200" onClick={() => document.getElementById('reply-file-input')?.click()}>
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200" onClick={() => { setReplyText(''); setFiles([]); }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <input
                                id="reply-file-input"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files) {
                                        setFiles([...files, ...Array.from(e.target.files)])
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <label className="font-medium text-muted-foreground">Customer</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{ticket.customerName || ticket.customer || 'Unknown'}</span>
                                            {ticket.customerEmail && (
                                                <span className="text-xs text-muted-foreground">{ticket.customerEmail}</span>
                                            )}
                                            {ticket.customerPhone && (
                                                <span className="text-xs text-muted-foreground">{ticket.customerPhone}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">Channel</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <ChannelIcon channel={ticket.channel || 'Email'} />
                                        <span>{ticket.channel}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">Team</label>
                                    <div className="mt-1">
                                        {ticket.teamName || ticket.team || 'Unassigned'}
                                    </div>
                                </div>

                                {ticket.SLA && (
                                    <>
                                        <div className="border-t pt-4 mt-4">
                                            <label className="font-medium text-muted-foreground">SLA Policy</label>
                                            <div className="mt-1 font-medium">
                                                {ticket.SLA.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {ticket.SLA.description}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-muted-foreground">First Response</label>
                                                <div className="text-sm">{String(ticket.SLA.first_response_time)}</div>
                                                {ticket.response_by && !['Failed', 'Fulfilled'].includes(ticket.agreement_status || '') && !ticket.first_responded_on && (
                                                    <div className={cn(
                                                        "text-xs flex items-center gap-1 mt-1",
                                                        calculateSLAStatus(ticket.response_by).urgency === 'overdue' ? "text-destructive font-medium" :
                                                            calculateSLAStatus(ticket.response_by).urgency === 'high' ? "text-orange-500" : "text-muted-foreground"
                                                    )}>
                                                        <Timer className="h-3 w-3" />
                                                        {calculateSLAStatus(ticket.response_by).timeRemaining}
                                                    </div>
                                                )}
                                                {ticket.first_responded_on && (
                                                    <div className={cn(
                                                        "text-xs flex items-center gap-1 mt-1",
                                                        calculateSLAMetrics(ticket.creation, ticket.first_responded_on, ticket.response_by, 'Response')?.startsWith('Overdue')
                                                            ? "text-destructive font-medium"
                                                            : "text-green-600 font-medium"
                                                    )}>
                                                        {calculateSLAMetrics(ticket.creation, ticket.first_responded_on, ticket.response_by, 'Response')}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground">Resolution</label>
                                                <div className="text-sm">{String(ticket.SLA.resolution_time)}</div>
                                                {ticket.resolution_by && !['Failed', 'Fulfilled'].includes(ticket.agreement_status || '') && !ticket.resolution_date && (
                                                    <div className={cn(
                                                        "text-xs flex items-center gap-1 mt-1",
                                                        calculateSLAStatus(ticket.resolution_by).urgency === 'overdue' ? "text-destructive font-medium" :
                                                            calculateSLAStatus(ticket.resolution_by).urgency === 'high' ? "text-orange-500" : "text-muted-foreground"
                                                    )}>
                                                        <Timer className="h-3 w-3" />
                                                        {calculateSLAStatus(ticket.resolution_by).timeRemaining}
                                                    </div>
                                                )}
                                                {ticket.resolution_date && (
                                                    <div className={cn(
                                                        "text-xs flex items-center gap-1 mt-1",
                                                        calculateSLAMetrics(ticket.creation, ticket.resolution_date, ticket.resolution_by, 'Resolution')?.startsWith('Overdue')
                                                            ? "text-destructive font-medium"
                                                            : "text-green-600 font-medium"
                                                    )}>
                                                        {calculateSLAMetrics(ticket.creation, ticket.resolution_date, ticket.resolution_by, 'Resolution')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {ticket.Priority && (
                                    <div className="border-t pt-4 mt-4">
                                        <label className="font-medium text-muted-foreground">Priority Detail</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ticket.Priority.color_code || '#ccc' }} />
                                            <span>{ticket.Priority.name}</span>
                                        </div>
                                        {ticket.Priority.description && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {ticket.Priority.description}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
