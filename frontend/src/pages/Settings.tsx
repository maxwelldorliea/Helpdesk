import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Save, RefreshCw, Hash, UserPlus, ShieldCheck } from 'lucide-react'
import type { SystemSettings } from '@/lib/types'
import { api } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function Settings() {
    const navigate = useNavigate()
    const { isAdminAgent, isSystemManager } = useAuth()
    const [settings, setSettings] = useState<SystemSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<Partial<SystemSettings>>({})

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const data = await api.getSettings()
            setSettings(data)
            setFormData(data)
        } catch (error) {
            console.error('Failed to fetch settings:', error)
            toast.error('Failed to load system settings')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!isSystemManager && !isAdminAgent) {
            toast.error('You do not have permission to access system settings')
            navigate('/dashboard')
            return
        }
        fetchSettings()
    }, [isSystemManager, isAdminAgent, navigate])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await api.updateSettings(formData)
            toast.success('Settings updated successfully')
            fetchSettings()
        } catch (error) {
            console.error('Failed to update settings:', error)
            toast.error('Failed to update settings')
        } finally {
            setSaving(false)
        }
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

    return (
        <MainLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
                    <p className="text-muted-foreground">
                        Configure global application parameters and numbering sequences.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Hash className="h-5 w-5" />
                                    Ticket Numbering
                                </CardTitle>
                                <CardDescription>
                                    Configure how ticket IDs are generated.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ticket_prefix">Ticket Prefix</Label>
                                    <Input
                                        id="ticket_prefix"
                                        value={formData.ticket_prefix || ''}
                                        onChange={(e) => setFormData({ ...formData, ticket_prefix: e.target.value })}
                                        placeholder="TIK"
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="current_count">Current Ticket Count</Label>
                                    <Input
                                        id="current_count"
                                        type="number"
                                        value={formData.current_count || 0}
                                        onChange={(e) => setFormData({ ...formData, current_count: parseInt(e.target.value) })}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        The next ticket will be generated with this number + 1.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <UserPlus className="h-5 w-5" />
                                    Customer Numbering
                                </CardTitle>
                                <CardDescription>
                                    Configure how customer IDs are generated.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer_prefix">Customer Prefix</Label>
                                    <Input
                                        id="customer_prefix"
                                        value={formData.customer_prefix || ''}
                                        onChange={(e) => setFormData({ ...formData, customer_prefix: e.target.value })}
                                        placeholder="CUST"
                                        maxLength={10}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="current_customer_count">Current Customer Count</Label>
                                    <Input
                                        id="current_customer_count"
                                        type="number"
                                        value={formData.current_customer_count || 0}
                                        onChange={(e) => setFormData({ ...formData, current_customer_count: parseInt(e.target.value) })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ShieldCheck className="h-5 w-5" />
                                    Administration
                                </CardTitle>
                                <CardDescription>
                                    System-wide administrative configurations.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admin_team">Admin Team</Label>
                                    <Input
                                        id="admin_team"
                                        value={formData.admin_team || ''}
                                        onChange={(e) => setFormData({ ...formData, admin_team: e.target.value })}
                                        placeholder="e.g. Administrators"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Agents in this group will have administrative privileges.
                                    </p>
                                </div>
                                <div className="pt-4 flex items-center justify-between border-t">
                                    <div className="text-sm text-muted-foreground">
                                        Last Reset Date: {settings?.last_reset_date ? new Date(settings.last_reset_date).toLocaleString() : 'Never'}
                                    </div>
                                    <div className="flex gap-4">
                                        <Button type="button" variant="outline" onClick={fetchSettings}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Reset Changes
                                        </Button>
                                        <Button type="submit" disabled={saving}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {saving ? 'Saving...' : 'Save Settings'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </MainLayout>
    )
}
