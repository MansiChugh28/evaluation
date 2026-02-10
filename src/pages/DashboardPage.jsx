import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Gavel, TrendingUp, Clock, DollarSign, ArrowRight, PlusCircle } from 'lucide-react';
import { EmptyState } from '../components/ui/empty-state';
import { toast } from 'sonner';
import auctionApi from '../api/auctionApi';
import { extractErrorMessage } from '../utils/errorHandler';
import { Loader } from '../components/ui/loader';

export default function DashboardPage() {
    const { user } = useSelector((state) => state.auth);
    
    // Statistics state - initialized with empty/zero values
    const [statistics, setStatistics] = useState({
        activeAuctions: 0,
        totalBids: 0,
        endingSoon: 0,
        totalValue: 0,
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    
    // Recent auctions from API
    const [recentAuctions, setRecentAuctions] = useState([]);
    const [isLoadingRecent, setIsLoadingRecent] = useState(true);

    // My active auctions from API
    const [myActiveAuctions, setMyActiveAuctions] = useState([]);
    const [isLoadingMyAuctions, setIsLoadingMyAuctions] = useState(true);

    // Load statistics from API
    useEffect(() => {
        const fetchStatistics = async () => {
            setIsLoadingStats(true);
            try {
                // Fetch default statistics (1-hour window)
                const defaultStats = await auctionApi.getStatistics();
                
                // Fetch statistics with 2-hour window for "ending soon"
                const endingSoonStats = await auctionApi.getStatistics(2);
                
                // API response is at root level, not nested
                const statsData = defaultStats || {};
                const endingSoonData = endingSoonStats || {};
                
                // Get ending soon count from the array length
                const endingSoonCount = Array.isArray(endingSoonData.ending_soon_auctions)
                    ? endingSoonData.ending_soon_auctions.length
                    : 0;
                
                setStatistics({
                    activeAuctions: statsData.total_active_auctions ?? 0,
                    totalBids: statsData.total_bids ?? 0,
                    endingSoon: endingSoonCount,
                    totalValue: statsData.total_auction_value ?? 0,
                });
                
                // Use recent_active_auctions from statistics API if available
                if (Array.isArray(statsData.recent_active_auctions) && statsData.recent_active_auctions.length > 0) {
                    const mappedRecent = statsData.recent_active_auctions.map((a) => ({
                        id: a.id,
                        title: a.title || '',
                        currentBid: a.current_price ?? a.currentBid ?? a.starting_price ?? 0,
                        endTime: a.ends_at || a.endTime || '',
                        status: a.status || 'active',
                    }));
                    setRecentAuctions(mappedRecent);
                    setIsLoadingRecent(false);
                } else {
                    setIsLoadingRecent(false);
                }
            } catch (error) {
                const message = extractErrorMessage(error);
                toast.error('Failed to load statistics', {
                    description: message,
                });
                setIsLoadingStats(false);
                setIsLoadingRecent(false);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchStatistics();
    }, []);

    // Load my active auctions
    useEffect(() => {
        const fetchMyAuctions = async () => {
            setIsLoadingMyAuctions(true);
            try {
                // Fetch my active auctions
                const myAuctionsData = await auctionApi.getMyAuctions();
                const myAuctionsList = myAuctionsData?.auctions || myAuctionsData || [];
                
                if (Array.isArray(myAuctionsList) && myAuctionsList.length > 0) {
                    const now = new Date();
                    const activeMyAuctions = myAuctionsList
                        .filter((a) => {
                            const endTime = a.ends_at || a.endTime;
                            const endDate = endTime ? new Date(endTime) : null;
                            const status = a.status;
                            return (
                                (status === 'active' || !status) &&
                                (!endDate || endDate > now)
                            );
                        })
                        .slice(0, 3)
                        .map((a) => ({
                            id: a.id,
                            title: a.title || '',
                            currentBid: a.current_price ?? a.currentBid ?? a.starting_price ?? 0,
                            bidCount: a.bid_count ?? a.bidCount ?? 0,
                            endTime: a.ends_at || a.endTime || '',
                        }));
                    setMyActiveAuctions(activeMyAuctions);
                }
            } catch (error) {
                const message = extractErrorMessage(error);
                toast.error('Failed to load my auctions', {
                    description: message,
                });
            } finally {
                setIsLoadingMyAuctions(false);
            }
        };

        fetchMyAuctions();
    }, []);

    const formatTimeRemaining = (endTime) => {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;
        
        if (diff <= 0) return 'Ended';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 shadow-lg">
                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                Welcome back, {user?.name || 'User'}! 👋
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Discover amazing auctions and place your bids
                            </p>
                        </div>
                        <Button asChild size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
                            <Link to="/create-auction">
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Create Auction
                            </Link>
                        </Button>
                    </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">
                            Active Auctions
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                            <Gavel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? (
                            <Loader size="sm" className="h-8 w-8" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold mb-1">{statistics.activeAuctions}</div>
                                <p className="text-xs text-muted-foreground">
                                    Currently running
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">
                            Total Bids
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? (
                            <Loader size="sm" className="h-8 w-8" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold mb-1">{statistics.totalBids}</div>
                                <p className="text-xs text-muted-foreground">
                                    All time bids
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">
                            Ending Soon
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? (
                            <Loader size="sm" className="h-8 w-8" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold mb-1">{statistics.endingSoon}</div>
                                <p className="text-xs text-muted-foreground">
                                    Auctions ending in 2 hours
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold">
                            Total Value
                        </CardTitle>
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingStats ? (
                            <Loader size="sm" className="h-8 w-8" />
                        ) : (
                            <>
                                <div className="text-3xl font-bold mb-1">
                                    ${typeof statistics.totalValue === 'number' 
                                        ? statistics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                        : statistics.totalValue}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Total auction value
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* My Active Auctions */}
                <Card className="border-2 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent border-b">
                        <div>
                            <CardTitle className="text-xl">My Active Auctions</CardTitle>
                            <CardDescription className="text-sm">
                                Auctions you've created
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="rounded-full">
                            <Link to="/my-auctions">
                                View All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoadingMyAuctions ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader size="sm" />
                            </div>
                        ) : myActiveAuctions.length === 0 ? (
                            <EmptyState
                                icon={Gavel}
                                title="No active auctions"
                                description="Create your first auction to get started"
                                action={
                                    <Button asChild size="sm">
                                        <Link to="/create-auction">Create Auction</Link>
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="space-y-4">
                                {myActiveAuctions.map((auction) => (
                                    <div key={auction.id} className="flex items-center justify-between p-4 border-2 rounded-xl hover:bg-muted/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 mt-4">
                                        <div className="flex-1">
                                            <Link to={`/auctions/${auction.id}`} className="font-medium hover:underline">
                                                {auction.title}
                                            </Link>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span>${auction.currentBid.toLocaleString()}</span>
                                                <span>{auction.bidCount} bids</span>
                                                <span>{formatTimeRemaining(auction.endTime)} left</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Auctions */}
                <Card className="border-2 hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-transparent border-b">
                        <div>
                            <CardTitle className="text-xl">Recent Auctions</CardTitle>
                            <CardDescription className="text-sm">
                                Latest auctions you might be interested in
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="rounded-full">
                            <Link to="/auctions">
                                View All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoadingRecent ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader size="sm" />
                            </div>
                        ) : recentAuctions.length === 0 ? (
                            <EmptyState
                                icon={Gavel}
                                title="No recent auctions"
                                description="Browse all auctions to find items"
                                action={
                                    <Button asChild size="sm">
                                        <Link to="/auctions">Browse Auctions</Link>
                                    </Button>
                                }
                            />
                        ) : (
                            <div className="space-y-4">
                                {recentAuctions.map((auction) => (
                                    <div key={auction.id} className="flex items-center justify-between p-4 border-2 rounded-xl hover:bg-muted/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 mt-4">
                                        <div className="flex-1">
                                            <Link to={`/auctions/${auction.id}`} className="font-medium hover:underline">
                                                {auction.title}
                                            </Link>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                <span>${auction.currentBid.toLocaleString()}</span>
                                                <span>{formatTimeRemaining(auction.endTime)} left</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

