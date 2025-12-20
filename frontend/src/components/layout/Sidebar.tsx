import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard,
    Users,
    UserCircle,
    BookOpen,
    AlertCircle,
    Settings,
    Menu,
    X,
    LogOut,
    Ticket,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
    title: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    adminOnly?: boolean
}

const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        adminOnly: true,
    },
    {
        title: 'Tickets',
        href: '/tickets',
        icon: Ticket,
    },
    {
        title: 'Teams',
        href: '/teams',
        icon: Users,
    },
    {
        title: 'Customers',
        href: '/customers',
        icon: UserCircle,
    },
    {
        title: 'Knowledge Base',
        href: '/knowledge-base',
        icon: BookOpen,
    },
    {
        title: 'Priority',
        href: '/priority',
        icon: AlertCircle,
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
    },
]

export function Sidebar() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, isAdminAgent, isSystemManager, signOut } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    const filteredNavItems = navItems.filter(item => {
        if (item.adminOnly || item.href === '/settings') {
            return isSystemManager || isAdminAgent
        }
        return true
    })

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="fixed left-4 top-4 z-50 md:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen w-64 transform border-r bg-card transition-transform duration-200 ease-in-out md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-full flex-col">
                    <div className="flex h-16 items-center border-b px-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <LayoutDashboard className="h-4 w-4" />
                            </div>
                            <span className="text-lg font-semibold">Helpdesk Pro</span>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                        {filteredNavItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.href

                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.title}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="border-t p-4 space-y-4">
                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors cursor-pointer"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <UserCircle className="h-5 w-5" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium">{user?.email || 'User'}</p>
                                <p className="truncate text-xs text-muted-foreground">Agent</p>
                            </div>
                        </Link>
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2"
                            onClick={handleSignOut}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    )
}
