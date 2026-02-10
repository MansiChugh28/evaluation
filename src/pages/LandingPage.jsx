import { Link } from 'react-router-dom';
import { Gavel, Clock, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { ThemeToggle } from '../components/ThemeToggle';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-background flex flex-col">
            {/* Top bar */}
            <header className="w-full border-b border-primary/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-background font-bold text-sm shadow-lg">
                            LB
                        </div>
                        <span className="font-semibold tracking-tight">LiveBid</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Button variant="ghost" asChild size="sm" className="rounded-full">
                            <Link to="/login">Login</Link>
                        </Button>
                        <Button asChild size="sm" className="rounded-full">
                            <Link to="/register">
                                Register
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <main className="flex-1 flex items-center">
                <div className="w-full max-w-6xl mx-auto px-4 py-10 md:py-16">
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/30 p-8 md:p-10 shadow-2xl">
                        <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center">
                            <div>
                                <p className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-background/40 border border-primary/30 text-primary mb-4">
                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                    Real-time auction platform
                                </p>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                                    Bid live. Win big. Collect amazing items.
                                </h1>
                                <p className="text-muted-foreground text-lg max-w-xl">
                                    LiveBid lets you experience real-time online auctions with instant bid updates,
                                    secure payments, and a beautiful, modern interface.
                                </p>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    <Button asChild size="lg" className="rounded-full shadow-lg hover:shadow-xl">
                                        <Link to="/register">
                                            Get Started
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        size="lg"
                                        variant="outline"
                                        className="rounded-full border-primary/40 bg-background/40 backdrop-blur"
                                    >
                                        <Link to="/login">
                                            Sign In
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Card className="border-primary/30 bg-background/70 backdrop-blur">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400/40 to-yellow-500/20 flex items-center justify-center">
                                                <Gavel className="h-5 w-5 text-yellow-300" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Real-Time Bidding</CardTitle>
                                                <CardDescription>See bids update live without refreshing.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">
                                            Powered by WebSocket technology for smooth, low-latency updates across all your
                                            devices.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-primary/20 bg-background/70 backdrop-blur">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400/40 to-emerald-500/20 flex items-center justify-center">
                                                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Secure & Trusted</CardTitle>
                                                <CardDescription>Protected with JWT-based authentication.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">
                                            Your account, bids, and auctions are guarded with modern security practices.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="border-primary/20 bg-background/70 backdrop-blur">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-400/40 to-sky-500/20 flex items-center justify-center">
                                                <Clock className="h-5 w-5 text-sky-300" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Never Miss a Finale</CardTitle>
                                                <CardDescription>Track auctions ending soon in one view.</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-xs text-muted-foreground">
                                            Stay ahead of other bidders with clear countdowns and status indicators.
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/40 blur-3xl opacity-70" />
                        <div className="absolute -left-32 -bottom-32 h-72 w-72 rounded-full bg-purple-700/40 blur-3xl opacity-60" />
                    </div>
                </div>
            </main>
        </div>
    );
}


