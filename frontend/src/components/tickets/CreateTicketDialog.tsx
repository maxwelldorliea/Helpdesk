import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select'
import { FileInput } from '@/components/ui/FileInput'
import { fileToBase64 } from '@/lib/fileUtils'
import type { Priority, Channel } from '@/lib/types'
import { api } from '@/lib/api'

interface CreateTicketDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onTicketCreated?: () => void
}

export function CreateTicketDialog({
    open,
    onOpenChange,
    onTicketCreated,
}: CreateTicketDialogProps) {
    const [loading, setLoading] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: 'Medium' as Priority,
        customer: '',
        channel: 'Email' as Channel,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const attachments: Record<string, string> = {}
            for (const file of files) {
                const base64 = await fileToBase64(file)
                attachments[file.name] = base64
            }

            await api.createTicket({
                subject: formData.subject,
                description: formData.description,
                priority: formData.priority,
                customer: formData.customer,
                channel: formData.channel,
                status: 'Open',
                name: '',
                creation: new Date().toISOString(),
                modified: new Date().toISOString(),
                resolved_by_bot: false,
                escalation_count: 0,
                // @ts-ignore
                attachments: Object.keys(attachments).length > 0 ? attachments : undefined
            })

            setFormData({
                subject: '',
                description: '',
                priority: 'Medium',
                customer: '',
                channel: 'Email',
            })
            setFiles([])

            onOpenChange(false)
            onTicketCreated?.()
        } catch (error) {
            console.error('Failed to create ticket:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Create New Ticket</SheetTitle>
                    <SheetDescription>
                        Fill in the details below to create a new support ticket.
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                            id="subject"
                            placeholder="Brief description of the issue"
                            value={formData.subject}
                            onChange={(e) =>
                                setFormData({ ...formData, subject: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer">Customer *</Label>
                        <Input
                            id="customer"
                            placeholder="Customer Name or ID"
                            value={formData.customer}
                            onChange={(e) =>
                                setFormData({ ...formData, customer: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value: Priority) =>
                                setFormData({ ...formData, priority: value })
                            }
                        >
                            <SelectTrigger id="priority">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="channel">Channel</Label>
                        <Select
                            value={formData.channel}
                            onValueChange={(value: Channel) =>
                                setFormData({ ...formData, channel: value })
                            }
                        >
                            <SelectTrigger id="channel">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Email">Email</SelectItem>
                                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                                <SelectItem value="Phone">Phone</SelectItem>
                                <SelectItem value="Chat">Chat</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            placeholder="Detailed description of the issue"
                            rows={5}
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Attachments</Label>
                        <FileInput
                            files={files}
                            onFilesChange={setFiles}
                            maxFiles={3}
                            accept={{
                                'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
                                'application/pdf': ['.pdf'],
                            }}
                        />
                    </div>

                    <SheetFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Ticket'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
