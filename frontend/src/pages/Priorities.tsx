import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table'
import { Plus, Pencil, Trash2, AlertCircle, Clock, X } from 'lucide-react'
import type { PriorityLevel, SLA } from '@/lib/types'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function Priorities() {
    const [priorities, setPriorities] = useState<PriorityLevel[]>([])
    const [slas, setSLAs] = useState<SLA[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSLADialogOpen, setIsSLADialogOpen] = useState(false)
    const [editingPriority, setEditingPriority] = useState<PriorityLevel | null>(null)
    const [editingSLA, setEditingSLA] = useState<SLA | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color_code: '#000000',
        sort_order: 0
    })
    const [slaFormData, setSlaFormData] = useState<Partial<SLA>>({
        name: '',
        priority: '',
        description: '',
        first_response_time: '1 hour',
        resolution_time: '4 hours'
    })

    const fetchData = async () => {
        setLoading(true)
        try {
            const [pData, sData] = await Promise.all([
                api.getPriorities(),
                api.getSLAs()
            ])
            // Sort by sort_order
            const sortedPData = pData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
            setPriorities(sortedPData)
            setSLAs(sData)
        } catch (error) {
            console.error('Failed to fetch data:', error)
            toast.error('Failed to load priorities or SLAs')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenDialog = (priority?: PriorityLevel) => {
        if (priority) {
            setEditingPriority(priority)
            setFormData({
                name: priority.name,
                description: priority.description || '',
                color_code: priority.color_code || '#000000',
                sort_order: priority.sort_order || 0
            })
        } else {
            setEditingPriority(null)
            setFormData({
                name: '',
                description: '',
                color_code: '#000000',
                sort_order: priorities.length
            })
        }
        setIsDialogOpen(true)
    }

    const handleOpenSLADialog = (priority: PriorityLevel, sla?: SLA) => {
        if (sla) {
            setEditingSLA(sla)
            setSlaFormData(sla)
        } else {
            setEditingSLA(null)
            setSlaFormData({
                name: `${priority.name} SLA`,
                priority: priority.name,
                description: `Default SLA for ${priority.name} priority`,
                first_response_time: '1 hour',
                resolution_time: '4 hours'
            })
        }
        setIsSLADialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingPriority) {
                await api.updatePriority(editingPriority.name, formData)
                toast.success('Priority updated successfully')
            } else {
                await api.createPriority(formData)
                toast.success('Priority created successfully')
            }
            setIsDialogOpen(false)
            fetchData()
        } catch (error) {
            console.error('Failed to save priority:', error)
            toast.error('Failed to save priority')
        }
    }

    const handleSLASubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingSLA) {
                await api.updateSLA(editingSLA.name, slaFormData)
                toast.success('SLA updated successfully')
            } else {
                await api.createSLA(slaFormData)
                toast.success('SLA created successfully')
            }
            setIsSLADialogOpen(false)
            fetchData()
        } catch (error) {
            console.error('Failed to save SLA:', error)
            toast.error('Failed to save SLA')
        }
    }

    const handleDelete = async (name: string) => {
        if (!confirm('Are you sure you want to delete this priority?')) return
        try {
            await api.deletePriority(name)
            toast.success('Priority deleted successfully')
            fetchData()
        } catch (error) {
            console.error('Failed to delete priority:', error)
            toast.error('Failed to delete priority')
        }
    }

    const handleDeleteSLA = async (name: string) => {
        if (!confirm('Are you sure you want to delete this SLA?')) return
        try {
            await api.deleteSLA(name)
            toast.success('SLA deleted successfully')
            fetchData()
        } catch (error) {
            console.error('Failed to delete SLA:', error)
            toast.error('Failed to delete SLA')
        }
    }

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Priorities & SLAs</h1>
                        <p className="text-muted-foreground">
                            Define ticket priority levels and their associated Service Level Agreements.
                        </p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Priority
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                Priority Levels
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex h-32 items-center justify-center">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Color</TableHead>
                                            <TableHead>Active SLAs</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {priorities.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((priority) => (
                                            <TableRow key={priority.name}>
                                                <TableCell className="font-medium">{priority.name}</TableCell>
                                                <TableCell>{priority.description}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="h-4 w-4 rounded-full border"
                                                            style={{ backgroundColor: priority.color_code || '#000' }}
                                                        />
                                                        <span className="text-xs font-mono">{priority.color_code}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {slas.filter(s => s.priority === priority.name).map(sla => (
                                                            <div
                                                                key={sla.name}
                                                                className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium cursor-pointer hover:bg-accent/80"
                                                                onClick={() => handleOpenSLADialog(priority, sla)}
                                                            >
                                                                <Clock className="h-3 w-3" />
                                                                {sla.name}
                                                                <X
                                                                    className="h-3 w-3 ml-1 text-muted-foreground hover:text-destructive"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDeleteSLA(sla.name)
                                                                    }}
                                                                />
                                                            </div>
                                                        ))}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 px-1.5 text-[10px]"
                                                            onClick={() => handleOpenSLADialog(priority)}
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Add SLA
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(priority)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(priority.name)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {priorities.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                    No priorities found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingPriority ? 'Edit Priority' : 'Add Priority'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority Name</label>
                                <Input
                                    required
                                    disabled={!!editingPriority}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. High"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Priority description"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Color Code</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="color"
                                            className="h-10 w-12 p-1"
                                            value={formData.color_code}
                                            onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                                        />
                                        <Input
                                            value={formData.color_code}
                                            onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sort Order</label>
                                    <Input
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingPriority ? 'Save Changes' : 'Create Priority'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isSLADialogOpen} onOpenChange={setIsSLADialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingSLA ? 'Edit SLA' : 'Add SLA'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSLASubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SLA Name</label>
                                <Input
                                    required
                                    disabled={!!editingSLA}
                                    value={slaFormData.name}
                                    onChange={(e) => setSlaFormData({ ...slaFormData, name: e.target.value })}
                                    placeholder="e.g. High Priority Response"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Priority</label>
                                <Input disabled value={slaFormData.priority} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">First Response Time</label>
                                    <Input
                                        value={slaFormData.first_response_time || ''}
                                        onChange={(e) => setSlaFormData({ ...slaFormData, first_response_time: e.target.value })}
                                        placeholder="e.g. 1 hour"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Resolution Time</label>
                                    <Input
                                        value={slaFormData.resolution_time || ''}
                                        onChange={(e) => setSlaFormData({ ...slaFormData, resolution_time: e.target.value })}
                                        placeholder="e.g. 4 hours"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    value={slaFormData.description || ''}
                                    onChange={(e) => setSlaFormData({ ...slaFormData, description: e.target.value })}
                                    placeholder="SLA description"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsSLADialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingSLA ? 'Save Changes' : 'Create SLA'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    )
}
