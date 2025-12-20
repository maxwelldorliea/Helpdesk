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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select'
import { Plus, Pencil, Trash2, UserCircle, Mail, Phone, Building, Link as LinkIcon, X } from 'lucide-react'
import type { Customer, CustomerHandle, ChannelConfig } from '@/lib/types'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function Customers() {
    const { role } = useAuth()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isHandlesDialogOpen, setIsHandlesDialogOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [customerHandles, setCustomerHandles] = useState<CustomerHandle[]>([])
    const [channels, setChannels] = useState<ChannelConfig[]>([])
    const [newHandle, setNewHandle] = useState({ channel: '', handle: '' })
    const [formData, setFormData] = useState({
        name: '',
        full_name: '',
        email: '',
        phone: '',
        organization: ''
    })

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const response = await api.getCustomers()
            setCustomers(response.data || [])
        } catch (error) {
            console.error('Failed to fetch customers:', error)
            toast.error('Failed to load customers')
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

    useEffect(() => {
        fetchCustomers()
        fetchChannels()
    }, [])

    const handleOpenDialog = (customer?: Customer) => {
        if (customer) {
            setEditingCustomer(customer)
            setFormData({
                name: customer.name,
                full_name: customer.full_name || '',
                email: customer.email || '',
                phone: customer.phone || '',
                organization: customer.organization || ''
            })
        } else {
            setEditingCustomer(null)
            setFormData({
                name: '',
                full_name: '',
                email: '',
                phone: '',
                organization: ''
            })
        }
        setIsDialogOpen(true)
    }

    const handleOpenHandlesDialog = async (customer: Customer) => {
        setSelectedCustomer(customer)
        setIsHandlesDialogOpen(true)
        try {
            const handles = await api.getCustomerHandles(customer.name)
            setCustomerHandles(handles)
        } catch (error) {
            console.error('Failed to fetch handles:', error)
            toast.error('Failed to load handles')
        }
    }

    const handleAddHandle = async () => {
        if (!selectedCustomer || !newHandle.channel || !newHandle.handle) return
        try {
            await api.addCustomerHandle(selectedCustomer.name, newHandle)
            toast.success('Handle added successfully')
            setNewHandle({ channel: '', handle: '' })
            const handles = await api.getCustomerHandles(selectedCustomer.name)
            setCustomerHandles(handles)
        } catch (error) {
            console.error('Failed to add handle:', error)
            toast.error('Failed to add handle')
        }
    }

    const handleRemoveHandle = async (handleId: number) => {
        if (!selectedCustomer) return
        try {
            await api.removeCustomerHandle(selectedCustomer.name, handleId)
            toast.success('Handle removed successfully')
            const handles = await api.getCustomerHandles(selectedCustomer.name)
            setCustomerHandles(handles)
        } catch (error) {
            console.error('Failed to remove handle:', error)
            toast.error('Failed to remove handle')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingCustomer) {
                await api.updateCustomer(editingCustomer.name, formData)
                toast.success('Customer updated successfully')
            } else {
                await api.createCustomer(formData)
                toast.success('Customer created successfully')
            }
            setIsDialogOpen(false)
            fetchCustomers()
        } catch (error) {
            console.error('Failed to save customer:', error)
            toast.error('Failed to save customer')
        }
    }

    const handleDelete = async (name: string) => {
        if (!confirm('Are you sure you want to delete this customer?')) return
        try {
            await api.deleteCustomer(name)
            toast.success('Customer deleted successfully')
            fetchCustomers()
        } catch (error) {
            console.error('Failed to delete customer:', error)
            toast.error('Failed to delete customer')
        }
    }

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                        <p className="text-muted-foreground">
                            Manage customer profiles and contact information.
                        </p>
                    </div>
                    {(role === 'Agent' || role === 'System Manager') && (
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Customer
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserCircle className="h-5 w-5" />
                            All Customers
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
                                        <TableHead>Name</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Organization</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map((customer) => (
                                        <TableRow key={customer.name}>
                                            <TableCell>
                                                <div className="font-medium">{customer.full_name || customer.name}</div>
                                                <div className="text-xs text-muted-foreground">{customer.name}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {customer.email && (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Mail className="h-3 w-3" />
                                                            {customer.email}
                                                        </div>
                                                    )}
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Phone className="h-3 w-3" />
                                                            {customer.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {customer.organization && (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Building className="h-3 w-3" />
                                                        {customer.organization}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {(role === 'Agent' || role === 'System Manager') && (
                                                        <>
                                                            <Button variant="ghost" size="icon" title="Manage Handles" onClick={() => handleOpenHandlesDialog(customer)}>
                                                                <LinkIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(customer)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(customer.name)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">ID / Username</label>
                                    <Input
                                        required
                                        disabled={!!editingCustomer}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. john_doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Phone</label>
                                    <Input
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Organization</label>
                                <Input
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    placeholder="Company Name"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingCustomer ? 'Save Changes' : 'Create Customer'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isHandlesDialogOpen} onOpenChange={setIsHandlesDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Manage Handles: {selectedCustomer?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Channel</label>
                                    <Select
                                        value={newHandle.channel}
                                        onValueChange={(value) => setNewHandle({ ...newHandle, channel: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select channel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {channels.map(channel => (
                                                <SelectItem key={channel.name} value={channel.name}>
                                                    {channel.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Handle / ID</label>
                                    <Input
                                        value={newHandle.handle}
                                        onChange={(e) => setNewHandle({ ...newHandle, handle: e.target.value })}
                                        placeholder="e.g. +12345678"
                                    />
                                </div>
                                <Button onClick={handleAddHandle} disabled={!newHandle.channel || !newHandle.handle}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Handle
                                </Button>
                            </div>

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Channel</TableHead>
                                            <TableHead>Handle</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customerHandles.map((handle) => (
                                            <TableRow key={handle.id}>
                                                <TableCell className="font-medium">{handle.channel}</TableCell>
                                                <TableCell>{handle.handle}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => handleRemoveHandle(handle.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {customerHandles.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                                    No handles associated with this customer.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </MainLayout>
    )
}
