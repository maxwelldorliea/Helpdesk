import { Sidebar } from './Sidebar'

interface MainLayoutProps {
    children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto md:ml-64">
                <div className="container mx-auto p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
