import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
    LayoutDashboard, 
    Gavel, 
    UserCircle, 
    PlusCircle,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Auctions', href: '/auctions', icon: Gavel },
    { name: 'My Auctions', href: '/my-auctions', icon: UserCircle },
    { name: 'Create Auction', href: '/create-auction', icon: PlusCircle },
    { name: 'Profile', href: '/profile', icon: UserCircle },
];

export function Sidebar() {
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button - only show when sidebar is closed */}
            {!isMobileOpen && (
                <div className="lg:hidden fixed top-16 left-0 right-0 z-40 border-b bg-background px-4 py-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 border-r bg-sidebar transition-transform duration-300 lg:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <div className="flex items-center justify-between p-4 border-b lg:hidden">
                    <span className="text-sm font-semibold">Menu</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="flex flex-col gap-2 p-4">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground hover:scale-[1.01] hover:shadow-sm"
                                )}
                            >
                                <Icon className={cn(
                                    "h-5 w-5 transition-transform",
                                    isActive ? "scale-110" : "group-hover:scale-110"
                                )} />
                                <span className={isActive ? "font-semibold" : ""}>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}

