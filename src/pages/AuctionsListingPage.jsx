import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Gavel, Clock, DollarSign, Search, Filter } from 'lucide-react';
import { EmptyState } from '../components/ui/empty-state';
import { toast } from 'sonner';
import auctionApi from '../api/auctionApi';
import { extractErrorMessage } from '../utils/errorHandler';
import { Loader } from '../components/ui/loader';

export default function AuctionsListingPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('active');
    const [auctions, setAuctions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const perPage = 20;
    
    // Dummy data as fallback
    const dummyAuctions = [
        {
            id: 1,
            title: 'Vintage Rolex Submariner',
            description: 'Classic diving watch in excellent condition',
            currentBid: 8500,
            startingBid: 5000,
            endTime: '2024-12-25T18:00:00',
            image: '/api/placeholder/400/300',
            bidCount: 23,
            status: 'active'
        },
        {
            id: 2,
            title: 'Antique Persian Rug',
            description: 'Handwoven silk rug from 1920s',
            currentBid: 3200,
            startingBid: 2000,
            endTime: '2024-12-24T20:00:00',
            image: '/api/placeholder/400/300',
            bidCount: 15,
            status: 'active'
        },
        {
            id: 3,
            title: 'Rare Vintage Wine Collection',
            description: 'Collection of 12 bottles from 1985',
            currentBid: 12500,
            startingBid: 8000,
            endTime: '2024-12-26T22:00:00',
            image: '/api/placeholder/400/300',
            bidCount: 42,
            status: 'active'
        },
    ];

    // Load auctions from API
    useEffect(() => {
        const fetchAuctions = async () => {
            setIsLoading(true);
            try {
                // Build params object - only include status if it's not 'all'
                const params = {
                    page: currentPage,
                    per_page: perPage,
                };
                
                if (statusFilter !== 'all') {
                    params.status = statusFilter;
                }
                
                const data = await auctionApi.getAuctions(params);
                
                const auctionsList = data?.auctions || data?.data || data || [];
                
                if (Array.isArray(auctionsList) && auctionsList.length > 0) {
                    // Map API response to component format
                    const mappedAuctions = auctionsList.map((a) => ({
                        id: a.id,
                        title: a.title || '',
                        description: a.description || '',
                        currentBid: a.current_price ?? a.currentBid ?? a.starting_price ?? a.startingBid ?? 0,
                        startingBid: a.starting_price ?? a.startingBid ?? 0,
                        endTime: a.ends_at || a.endTime || '',
                        image: Array.isArray(a.images) && a.images.length > 0 
                            ? a.images[0] 
                            : a.image || null,
                        bidCount: a.bid_count ?? a.bidCount ?? 0,
                        status: a.status || 'active',
                    }));
                    setAuctions(mappedAuctions);

                    // If API provides pagination meta, use it; otherwise infer "has next"
                    if (data?.pagination) {
                        const { current_page, total_pages } = data.pagination;
                        setHasNextPage(
                            typeof total_pages === 'number' &&
                            typeof current_page === 'number' &&
                            current_page < total_pages
                        );
                    } else {
                        // Fallback: assume there might be a next page only when we filled this one
                        setHasNextPage(mappedAuctions.length === perPage);
                    }
                } else {
                    // Use dummy data if API returns empty
                    setAuctions(dummyAuctions);
                    setHasNextPage(false);
                }
            } catch (error) {
                const message = extractErrorMessage(error);
                toast.error('Failed to load auctions', {
                    description: message,
                });
                // Use dummy data as fallback on error
                setAuctions(dummyAuctions);
                setHasNextPage(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAuctions();
    }, [statusFilter, currentPage]);

    // Reset to first page when filters change significantly
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, searchQuery]);

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

    const filteredAuctions = auctions.filter(auction => {
        const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            auction.description.toLowerCase().includes(searchQuery.toLowerCase());
        
        // If statusFilter is 'all', show all auctions, otherwise filter by status
        const matchesStatus = statusFilter === 'all' || auction.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 shadow-lg">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        All Auctions 🎯
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Discover amazing items and place your winning bids
                    </p>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
            </div>

            {/* Search and Filter */}
            <Card className="border-2 shadow-lg">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search auctions by title or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 rounded-full border-2 focus:border-primary transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="pl-10 pr-8 h-12 rounded-full border-2 border-input bg-transparent text-sm font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer hover:border-primary/50"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="sold">Sold</option>
                                    <option value="expired">Expired</option>
                                </select>
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Auctions Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                        <Loader size="lg" />
                        <p className="text-sm text-muted-foreground">Loading auctions...</p>
                    </div>
                </div>
            ) : filteredAuctions.length === 0 ? (
                <EmptyState
                    icon={Gavel}
                    title="No auctions found"
                    description="Try adjusting your search or filters"
                />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredAuctions.map((auction) => (
                        <Card key={auction.id} className="flex flex-col hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden group">
                            <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden relative">
                                {auction.image ? (
                                    <img 
                                        src={auction.image} 
                                        alt={auction.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Hide image and show placeholder on error
                                            e.target.style.display = 'none';
                                            const placeholder = e.target.nextElementSibling;
                                            if (placeholder) placeholder.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div 
                                    className={`w-full h-full flex items-center justify-center absolute inset-0 ${auction.image ? 'hidden' : ''}`}
                                >
                                    <Gavel className="h-12 w-12 text-muted-foreground" />
                                </div>
                            </div>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="line-clamp-2">{auction.title}</CardTitle>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        auction.status === 'active' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                    }`}>
                                        {auction.status}
                                    </span>
                                </div>
                                <CardDescription className="line-clamp-2">
                                    {auction.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Current Bid</span>
                                        <span className="text-2xl font-bold">
                                            ${auction.currentBid.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            <span>{formatTimeRemaining(auction.endTime)}</span>
                                        </div>
                                        <span className="text-muted-foreground">
                                            {auction.bidCount} bids
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full" size="sm">
                                    <Link to={`/auctions/${auction.id}`}>
                                        View Details
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {!isLoading && filteredAuctions.length > 0 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page <span className="font-medium">{currentPage}</span>
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={!hasNextPage}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}

