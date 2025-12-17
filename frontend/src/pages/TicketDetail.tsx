import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
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
import type { Ticket, Communication, TicketStatus, Priority, ChannelConfig } from '@/lib/types'
import { cn, safeFormat } from '@/lib/utils'
import {
    ArrowLeft, Paperclip, User, Clock, AlertTriangle,
    ChevronDown, Trash2, MoreVertical
} from 'lucide-react'

export default function TicketDetail() {
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

    useEffect(() => {
        if (id) {
            fetchTicket(id)
            fetchChannels()
        }
    }, [id])

    const fetchTicket = async (ticketId: string) => {
        setLoading(true)
        try {
            const data = await api.getTicket(ticketId)
            setTicket(data)
            setReplyChannel(data.channel || 'Email')
        } catch (error) {
            console.error('Failed to fetch ticket:', error)
        } finally {
            setLoading(false)
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
        if (!ticket) return
        if (confirm('Are you sure you want to escalate this ticket? This will set priority to Critical.')) {
            handleUpdateTicket({
                priority: 'Critical',
                escalation_count: (ticket.escalation_count || 0) + 1
            })
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
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="mt-1">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
                                    <Badge variant="outline" className="text-base">
                                        {ticket.name}
                                    </Badge>
                                    <ChannelIcon channel={ticket.channel || 'Email'} className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Created {safeFormat(ticket.creation, 'PPP p')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {ticket.raised_by}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                            <Select
                                value={ticket.status}
                                onValueChange={(val: TicketStatus) => handleUpdateTicket({ status: val })}
                                disabled={updating}
                            >
                                <SelectTrigger className="w-[130px] h-9">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Replied">Replied</SelectItem>
                                    <SelectItem value="Resolved">Resolved</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={ticket.priority || undefined}
                                onValueChange={(val: Priority) => handleUpdateTicket({ priority: val })}
                                disabled={updating}
                            >
                                <SelectTrigger className="w-[130px] h-9">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                value={ticket.assigned_agent || ''}
                                placeholder="Assignee"
                                className="w-[150px] h-9"
                                onBlur={(e) => {
                                    if (e.target.value !== ticket.assigned_agent) {
                                        handleUpdateTicket({ assigned_agent: e.target.value })
                                    }
                                }}
                                disabled={updating}
                            />

                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/50"
                                onClick={handleEscalate}
                                disabled={updating}
                            >
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Escalate
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-none bg-transparent">
                            <CardContent className="p-0 space-y-6">
                                {sortedCommunications.map((comm: Communication) => (
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
                                                <div className="mt-4 flex flex-col gap-2">
                                                    {Object.entries(comm.attachments).map(([filename, content]) => {
                                                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
                                                        if (isImage && typeof content === 'string') {
                                                            return (
                                                                <div key={filename} className="relative group max-w-sm">
                                                                    <img
                                                                        src={content}
                                                                        alt={filename}
                                                                        className="rounded-lg border shadow-sm max-h-64 object-contain bg-gray-50"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                                        <a
                                                                            href={content}
                                                                            download={filename}
                                                                            className="text-white text-sm font-medium hover:underline"
                                                                        >
                                                                            Download
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }
                                                        return (
                                                            <Badge key={filename} variant="secondary" className="gap-1 pl-2 pr-3 py-1 w-fit">
                                                                <Paperclip className="h-3 w-3" />
                                                                {filename}
                                                            </Badge>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

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
                                        <span>{ticket.customerName || ticket.customer || 'Unknown'}</span>
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
                                        {ticket.teamName || ticket.agent_group || 'Unassigned'}
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
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground">Resolution</label>
                                                <div className="text-sm">{String(ticket.SLA.resolution_time)}</div>
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
