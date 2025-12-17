import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { LayoutDashboard, Shield, Zap, Users, MessageSquare, Clock, BarChart } from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <LayoutDashboard className="h-4 w-4" />
                        </div>
                        Helpdesk Pro
                    </div>
                    <nav className="flex gap-4">
                        <Link to="/login">
                            <Button variant="ghost">Sign In</Button>
                        </Link>
                        <Link to="/login">
                            <Button>Get Started</Button>
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
                    <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
                        <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                            Customer Support, <span className="text-primary">Reimagined</span>
                        </h1>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            The omnichannel AI-driven helpdesk system that empowers your team to deliver exceptional customer experiences.
                        </p>
                        <div className="space-x-4">
                            <Link to="/login">
                                <Button size="lg" className="h-11 px-8">
                                    Start Free Trial
                                </Button>
                            </Link>
                            <Button variant="outline" size="lg" className="h-11 px-8">
                                View Demo
                            </Button>
                        </div>
                    </div>
                </section>

                <section className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24 rounded-3xl">
                    <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
                        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                            Features
                        </h2>
                        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                            Everything you need to manage customer support at scale.
                        </p>
                    </div>
                    <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
                        <FeatureCard
                            icon={MessageSquare}
                            title="Omnichannel Support"
                            description="Manage tickets from Email, WhatsApp, Phone, and Chat in one unified inbox."
                        />
                        <FeatureCard
                            icon={Clock}
                            title="SLA Management"
                            description="Never miss a deadline with automated SLA tracking and breach alerts."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="AI Powered"
                            description="Smart categorization, auto-responses, and sentiment analysis."
                        />
                        <FeatureCard
                            icon={Users}
                            title="Team Collaboration"
                            description="Assign tickets, add internal notes, and collaborate in real-time."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Role-Based Access"
                            description="Granular permissions for Admins, Managers, and Agents."
                        />
                        <FeatureCard
                            icon={BarChart}
                            title="Analytics"
                            description="Deep insights into team performance and customer satisfaction."
                        />
                    </div>
                </section>

                <section className="py-8 md:py-12 lg:py-24">
                    <div className="container flex flex-col items-center justify-center gap-4 text-center">
                        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl font-bold">
                            Ready to upgrade your support?
                        </h2>
                        <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                            Join thousands of companies delivering better customer experiences.
                        </p>
                        <Link to="/login">
                            <Button size="lg" className="mt-4">
                                Get Started Today
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t py-6 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
                        <LayoutDashboard className="h-6 w-6" />
                        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                            Built by Max Tech Solutions. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({
    icon: Icon,
    title,
    description,
}: {
    icon: any
    title: string
    description: string
}) {
    return (
        <div className="relative overflow-hidden rounded-lg border bg-background p-2">
            <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                <Icon className="h-12 w-12 text-primary" />
                <div className="space-y-2">
                    <h3 className="font-bold">{title}</h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
        </div>
    )
}
