import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LayoutDashboard, Shield, Zap, Users, MessageSquare, Clock, BarChart, Star, ArrowRight, Sparkles, ChevronRight, Mail, Github, Twitter, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function LandingPage() {
    const { session } = useAuth()
    return (
        <div className="flex min-h-screen flex-col bg-background overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-3 font-bold text-xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                            <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <span className="font-extrabold tracking-tight">Helpdesk Pro</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
                        <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Stats</a>
                        <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
                    </nav>
                    <nav className="flex gap-3">
                        {session ? (
                            <>
                                <Link to="/profile">
                                    <Button variant="ghost">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </Button>
                                </Link>
                                <Link to="/dashboard">
                                    <Button className="shadow-sm">
                                        Go to Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost">Sign In</Button>
                                </Link>
                                <Link to="/login">
                                    <Button className="shadow-sm">
                                        Get Started
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="flex-1">
                <section className="relative py-20 lg:py-32 overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
                    </div>

                    <div className="container">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="flex flex-col gap-6 animate-fade-in">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 w-fit">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-medium">AI-Powered Support Platform</span>
                                </div>

                                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                                    Customer Support,{' '}
                                    <span className="text-primary">Reimagined</span>
                                </h1>

                                <p className="text-lg sm:text-xl text-muted-foreground max-w-lg leading-relaxed">
                                    The omnichannel AI-driven helpdesk system that empowers your team to deliver exceptional customer experiences. Faster responses, happier customers.
                                </p>

                                <div className="flex flex-wrap gap-4 pt-2">
                                    {session ? (
                                        <Link to="/dashboard">
                                            <Button size="lg" className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all">
                                                Go to Dashboard
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link to="/login">
                                            <Button size="lg" className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all">
                                                Start Free Trial
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </Link>
                                    )}
                                    <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                                        Watch Demo
                                        <ChevronRight className="ml-1 h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Social proof mini */}
                                <div className="flex items-center gap-4 pt-6">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-xs font-medium text-primary">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">Trusted by 2,000+ companies</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative hidden lg:block">
                                <Card className="shadow-2xl animate-float">
                                    <div className="h-8 bg-muted/50 flex items-center px-4 gap-2 rounded-t-lg border-b">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="h-4 w-32 bg-muted rounded"></div>
                                            <div className="h-8 w-24 bg-primary/20 rounded-lg"></div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {['bg-blue-100 dark:bg-blue-900/30', 'bg-green-100 dark:bg-green-900/30', 'bg-purple-100 dark:bg-purple-900/30'].map((bg, i) => (
                                                <div key={i} className={`${bg} rounded-xl p-4 space-y-2`}>
                                                    <div className="h-3 w-16 bg-muted rounded"></div>
                                                    <div className="h-6 w-12 bg-muted rounded"></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg border">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-primary">{String.fromCharCode(64 + i)}</span>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-3 w-3/4 bg-muted rounded"></div>
                                                        <div className="h-2 w-1/2 bg-muted rounded"></div>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${i === 1 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : i === 2 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                        {i === 1 ? 'Resolved' : i === 2 ? 'Pending' : 'Open'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Floating notification card */}
                                <Card className="absolute -right-4 top-16 shadow-xl animate-float-delayed">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">New ticket resolved!</p>
                                                <p className="text-xs text-muted-foreground">Response time: 2m 34s</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* AI badge */}
                                <Card className="absolute -left-4 bottom-20 shadow-xl bg-primary text-primary-foreground animate-float">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-5 w-5" />
                                            <span className="text-sm font-medium">AI Auto-categorized</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="stats" className="py-16 border-y bg-muted/30">
                    <div className="container">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <StatCard icon={Shield} value="99.9%" label="Uptime SLA" index={0} />
                            <StatCard icon={Clock} value="<2min" label="Avg Response" index={1} />
                            <StatCard icon={MessageSquare} value="50K+" label="Tickets/Month" index={2} />
                            <StatCard icon={Star} value="4.9/5" label="Customer Rating" index={3} />
                        </div>
                    </div>
                </section>

                <section id="features" className="py-24 lg:py-32">
                    <div className="container">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                                <LayoutDashboard className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Powerful Features</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                                Everything you need to{' '}
                                <span className="text-primary">scale support</span>
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                A complete toolkit designed for modern support teams. From AI automation to deep analytics.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={MessageSquare}
                                title="Omnichannel Support"
                                description="Manage tickets from Email, WhatsApp, Phone, and Chat in one unified inbox. Never miss a customer message."
                                color="text-blue-600"
                                bgColor="bg-blue-100 dark:bg-blue-900/30"
                                index={0}
                            />
                            <FeatureCard
                                icon={Clock}
                                title="SLA Management"
                                description="Never miss a deadline with automated SLA tracking, breach alerts, and escalation workflows."
                                color="text-amber-600"
                                bgColor="bg-amber-100 dark:bg-amber-900/30"
                                index={1}
                            />
                            <FeatureCard
                                icon={Zap}
                                title="AI Powered"
                                description="Smart categorization, auto-responses, sentiment analysis, and intelligent routing powered by AI."
                                color="text-purple-600"
                                bgColor="bg-purple-100 dark:bg-purple-900/30"
                                index={2}
                            />
                            <FeatureCard
                                icon={Users}
                                title="Team Collaboration"
                                description="Assign tickets, add internal notes, mention teammates, and collaborate in real-time."
                                color="text-green-600"
                                bgColor="bg-green-100 dark:bg-green-900/30"
                                index={3}
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Role-Based Access"
                                description="Granular permissions for Admins, Managers, and Agents. Keep your data secure and organized."
                                color="text-red-600"
                                bgColor="bg-red-100 dark:bg-red-900/30"
                                index={4}
                            />
                            <FeatureCard
                                icon={BarChart}
                                title="Deep Analytics"
                                description="Powerful insights into team performance, customer satisfaction, and support trends."
                                color="text-indigo-600"
                                bgColor="bg-indigo-100 dark:bg-indigo-900/30"
                                index={5}
                            />
                        </div>
                    </div>
                </section>

                <section id="testimonials" className="py-24 lg:py-32 bg-muted/30">
                    <div className="container">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
                                Loved by{' '}
                                <span className="text-primary">support teams</span>
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                See what teams around the world are saying about Helpdesk Pro.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <TestimonialCard
                                quote="Helpdesk Pro transformed our customer support. Response times dropped by 60% and customer satisfaction is at an all-time high."
                                author="Sarah Chen"
                                role="Head of Support, TechCorp"
                                index={0}
                            />
                            <TestimonialCard
                                quote="The AI features are incredible. Auto-categorization saves our team hours every day. It's like having an extra team member."
                                author="Marcus Johnson"
                                role="CTO, StartupXYZ"
                                index={1}
                            />
                            <TestimonialCard
                                quote="Finally, a helpdesk that just works. The omnichannel support means we never miss a customer inquiry, regardless of where it comes from."
                                author="Emily Rodriguez"
                                role="Operations Manager, ScaleUp Inc"
                                index={2}
                            />
                        </div>
                    </div>
                </section>

                <section className="py-24 lg:py-32 bg-primary text-primary-foreground">
                    <div className="container">
                        <div className="text-center max-w-3xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
                                Ready to transform your support?
                            </h2>
                            <p className="text-lg sm:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
                                Join thousands of companies delivering exceptional customer experiences. Start your free trial today — no credit card required.
                            </p>
                            <div className="flex flex-wrap justify-center gap-4">
                                {session ? (
                                    <Link to="/dashboard">
                                        <Button size="lg" variant="secondary" className="h-12 px-8 text-base shadow-lg">
                                            Go to Dashboard
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link to="/login">
                                        <Button size="lg" variant="secondary" className="h-12 px-8 text-base shadow-lg">
                                            Start Free Trial
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                )}
                                <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-transparent border-2 border-primary-foreground/30 hover:bg-primary-foreground/10 hover:border-primary-foreground/50">
                                    Contact Sales
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t py-12">
                <div className="container">
                    <div className="grid gap-8 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 font-bold text-xl mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <LayoutDashboard className="h-5 w-5" />
                                </div>
                                <span className="font-extrabold">Helpdesk Pro</span>
                            </div>
                            <p className="text-muted-foreground max-w-sm mb-6">
                                The modern, AI-powered helpdesk solution for teams that care about customer experience.
                            </p>
                            <div className="flex gap-3">
                                <a href="#" className="w-9 h-9 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                                    <Twitter className="h-4 w-4 text-muted-foreground" />
                                </a>
                                <a href="#" className="w-9 h-9 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                                    <Github className="h-4 w-4 text-muted-foreground" />
                                </a>
                                <a href="#" className="w-9 h-9 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                </a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Max Tech Solutions. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function StatCard({
    icon: Icon,
    value,
    label,
    index,
}: {
    icon: any
    value: string
    label: string
    index: number
}) {
    return (
        <div className="text-center animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-primary">{value}</div>
            <div className="text-sm text-muted-foreground mt-1">{label}</div>
        </div>
    )
}

function FeatureCard({
    icon: Icon,
    title,
    description,
    color,
    bgColor,
    index,
}: {
    icon: any
    title: string
    description: string
    color: string
    bgColor: string
    index: number
}) {
    return (
        <Card
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <CardContent className="p-8">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${bgColor} mb-6`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    )
}

function TestimonialCard({
    quote,
    author,
    role,
    index,
}: {
    quote: string
    author: string
    role: string
    index: number
}) {
    return (
        <Card className="hover:shadow-lg transition-shadow animate-slide-up" style={{ animationDelay: `${index * 0.15}s` }}>
            <CardContent className="p-8">
                <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">"{quote}"</p>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                        {author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <p className="font-semibold">{author}</p>
                        <p className="text-sm text-muted-foreground">{role}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
