import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
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
import { Plus, Pencil, Trash2, Users, UserPlus, X } from 'lucide-react'
import type { Team, AgentMembership, User } from '@/lib/types'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export default function Teams() {
    const { role, isAdminAgent, isSystemManager } = useAuth()
    const canManageMembers = isSystemManager || isAdminAgent
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false)
    const [editingTeam, setEditingTeam] = useState<Team | null>(null)
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [teamMembers, setTeamMembers] = useState<AgentMembership[]>([])
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [selectedAgentId, setSelectedAgentId] = useState<string>('')
    const [inviteEmail, setInviteEmail] = useState('')
    const [isInviting, setIsInviting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        escalation_team: ''
    })

    const fetchTeams = async () => {
        setLoading(true)
        try {
            const data = await api.getTeams()
            setTeams(data)
        } catch (error) {
            console.error('Failed to fetch teams:', error)
            toast.error('Failed to load teams')
        } finally {
            setLoading(false)
        }
    }

    const fetchAllUsers = async () => {
        try {
            const data = await api.getUsers()
            setAllUsers(data)
        } catch (error) {
            console.error('Failed to fetch users:', error)
        }
    }

    useEffect(() => {
        fetchTeams()
        fetchAllUsers()
    }, [])

    const handleOpenDialog = (team?: Team) => {
        if (team) {
            setEditingTeam(team)
            setFormData({
                name: team.name,
                description: team.description || '',
                escalation_team: team.escalation_team || ''
            })
        } else {
            setEditingTeam(null)
            setFormData({
                name: '',
                description: '',
                escalation_team: ''
            })
        }
        setIsDialogOpen(true)
    }

    const handleOpenMembersDialog = async (team: Team) => {
        setSelectedTeam(team)
        setIsMembersDialogOpen(true)
        try {
            const members = await api.getTeamMembers(team.name)
            setTeamMembers(members)
        } catch (error) {
            console.error('Failed to fetch team members:', error)
            toast.error('Failed to load team members')
        }
    }

    const handleAddMember = async () => {
        if (!selectedTeam || !selectedAgentId) return
        try {
            await api.addTeamMember(selectedTeam.name, selectedAgentId)
            toast.success('Member added successfully')
            setSelectedAgentId('')
            const members = await api.getTeamMembers(selectedTeam.name)
            setTeamMembers(members)
        } catch (error) {
            console.error('Failed to add member:', error)
            toast.error('Failed to add member')
        }
    }

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail) return
        setIsInviting(true)
        try {
            await api.inviteUser(inviteEmail)
            toast.success(`Invitation sent to ${inviteEmail}`)
            setInviteEmail('')
            fetchAllUsers()
        } catch (error) {
            console.error('Failed to invite user:', error)
            toast.error('Failed to invite user')
        } finally {
            setIsInviting(false)
        }
    }

    const handleRemoveMember = async (userId: string) => {
        if (!selectedTeam) return
        try {
            await api.removeTeamMember(selectedTeam.name, userId)
            toast.success('Member removed successfully')
            const members = await api.getTeamMembers(selectedTeam.name)
            setTeamMembers(members)
        } catch (error) {
            console.error('Failed to remove member:', error)
            toast.error('Failed to remove member')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingTeam) {
                await api.updateTeam(editingTeam.name, formData)
                toast.success('Team updated successfully')
            } else {
                await api.createTeam(formData)
                toast.success('Team created successfully')
            }
            setIsDialogOpen(false)
            fetchTeams()
        } catch (error) {
            console.error('Failed to save team:', error)
            toast.error('Failed to save team')
        }
    }

    const handleDelete = async (name: string) => {
        if (!confirm('Are you sure you want to delete this team?')) return
        try {
            await api.deleteTeam(name)
            toast.success('Team deleted successfully')
            fetchTeams()
        } catch (error) {
            console.error('Failed to delete team:', error)
            toast.error('Failed to delete team')
        }
    }

    return (
        <MainLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
                        <p className="text-muted-foreground">
                            Manage support teams and their escalation paths.
                        </p>
                    </div>
                    {role === 'System Manager' && (
                        <Button onClick={() => handleOpenDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Team
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            All Teams
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
                                        <TableHead>Description</TableHead>
                                        <TableHead>Escalation To</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {teams.map((team) => (
                                        <TableRow key={team.name}>
                                            <TableCell className="font-medium">{team.name}</TableCell>
                                            <TableCell>{team.description}</TableCell>
                                            <TableCell>{team.escalation_team || '-'}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" title="Manage Members" onClick={() => handleOpenMembersDialog(team)}>
                                                        <Users className="h-4 w-4" />
                                                    </Button>
                                                    {isSystemManager && (
                                                        <>
                                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(team)}>
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(team.name)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {teams.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No teams found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingTeam ? 'Edit Team' : 'Add Team'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Team Name</label>
                                <Input
                                    required
                                    disabled={!!editingTeam}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Support"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Team description"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Escalation Team</label>
                                <Select
                                    value={formData.escalation_team}
                                    onValueChange={(value) => setFormData({ ...formData, escalation_team: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select escalation team" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {teams.filter(t => t.name !== formData.name).map(t => (
                                            <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingTeam ? 'Save Changes' : 'Create Team'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Manage Members: {selectedTeam?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            {canManageMembers && (
                                <div className="space-y-4">
                                    <div className="flex items-end gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-sm font-medium">Add Existing User</label>
                                            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a user" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allUsers
                                                        .filter(user => !teamMembers.some(m => m.user === user.id))
                                                        .map(user => (
                                                            <SelectItem key={user.id} value={user.id}>
                                                                {user.email} ({user.id.substring(0, 8)}...)
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button onClick={handleAddMember} disabled={!selectedAgentId}>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Add
                                        </Button>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">Or invite new user</span>
                                        </div>
                                    </div>

                                    <form onSubmit={handleInviteUser} className="flex items-end gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-sm font-medium">Invite by Email</label>
                                            <Input
                                                type="email"
                                                placeholder="email@example.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                            />
                                        </div>
                                        <Button type="submit" variant="outline" disabled={!inviteEmail || isInviting}>
                                            {isInviting ? 'Inviting...' : 'Invite'}
                                        </Button>
                                    </form>
                                </div>
                            )}

                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Agent ID</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {teamMembers.map((member) => (
                                            <TableRow key={member.user}>
                                                <TableCell className="font-medium text-xs">{member.user}</TableCell>
                                                <TableCell>{member.userInfo?.email || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    {canManageMembers && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive"
                                                            onClick={() => handleRemoveMember(member.user)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {teamMembers.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                                    No members in this team.
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
