import { createContext, useContext, useEffect, useState } from 'react'
import { type Session, type User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
    session: Session | null
    user: User | null
    role: string | null
    isAdminAgent: boolean
    isSystemManager: boolean
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    role: null,
    isAdminAgent: false,
    isSystemManager: false,
    loading: true,
    signOut: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [isAdminAgent, setIsAdminAgent] = useState(false)
    const [isSystemManager, setIsSystemManager] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchRoleAndAdminStatus = async (userId: string) => {
        try {
            const [roleRes, adminRes, managerRes] = await Promise.all([
                supabase
                    .from('Role')
                    .select('name')
                    .eq('user', userId)
                    .single(),
                supabase.rpc('is_admin_agent', { user_uuid: userId }),
                supabase.rpc('is_manager', { user_uuid: userId })
            ])

            if (roleRes.data) {
                setRole(roleRes.data.name)
            } else {
                setRole(null)
            }

            setIsAdminAgent(!!adminRes.data)
            setIsSystemManager(!!managerRes.data)
        } catch (error) {
            console.error('Error fetching role or admin status:', error)
            setRole(null)
            setIsAdminAgent(false)
            setIsSystemManager(false)
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchRoleAndAdminStatus(session.user.id)
            } else {
                setRole(null)
                setIsAdminAgent(false)
                setIsSystemManager(false)
            }
            setLoading(false)
        })

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchRoleAndAdminStatus(session.user.id)
            } else {
                setRole(null)
                setIsAdminAgent(false)
                setIsSystemManager(false)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setRole(null)
        setIsAdminAgent(false)
        setIsSystemManager(false)
    }

    return (
        <AuthContext.Provider value={{ session, user, role, isAdminAgent, isSystemManager, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
