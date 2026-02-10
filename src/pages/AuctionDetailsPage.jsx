import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from '../components/ui/table';
import { 
    Gavel, 
    Clock, 
    DollarSign, 
    User, 
    TrendingUp,
    ArrowLeft,
    Timer
} from 'lucide-react';
import auctionApi from '../api/auctionApi';
import { extractErrorMessage } from '../utils/errorHandler';
import { Loader } from '../components/ui/loader';
import { EmptyState } from '../components/ui/empty-state';
import websocketService from '../services/websocketService';

export default function AuctionDetailsPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { bidUpdates, auctionUpdates } = useSelector((state) => state.websocket);
    const [bidAmount, setBidAmount] = useState('');
    const [isPlacingBid, setIsPlacingBid] = useState(false);
    const [auction, setAuction] = useState(null);
    const [bidHistory, setBidHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingBids, setIsLoadingBids] = useState(true);
    
    // Fetch auction details and bid history from bid history API
    useEffect(() => {
        const fetchAuctionAndBidHistory = async () => {
            setIsLoading(true);
            setIsLoadingBids(true);
            try {
                const data = await auctionApi.getBidHistory(id);
                
                // Extract auction data from bid history response
                const auctionData = data?.auction || data || {};
                const summary = data?.summary || {};
                
                    // Map auction data to component format
                const mappedAuction = {
                    id: auctionData.id || id,
                    title: auctionData.title || '',
                    description: auctionData.description || '',
                    currentBid: summary.highest_bid ?? auctionData.current_price ?? auctionData.currentBid ?? auctionData.starting_price ?? 0,
                    startingBid: auctionData.starting_price ?? auctionData.startingBid ?? 0,
                    endTime: auctionData.ends_at || auctionData.endTime || '',
                    image: Array.isArray(auctionData.images) && auctionData.images.length > 0 
                        ? auctionData.images[0] 
                        : auctionData.image || null,
                    bidCount: summary.total_bids ?? auctionData.total_bids ?? auctionData.bid_count ?? auctionData.bidCount ?? 0,
                    status: auctionData.status || 'active',
                    sellerName: auctionData.sellerName || auctionData.seller?.name || '',
                    category: auctionData.category || '',
                    condition: auctionData.condition || '',
                    location: auctionData.location || '',
                    creatorId: auctionData.creator_id ?? auctionData.creatorId ?? auctionData.user_id ?? auctionData.userId ?? auctionData.creator?.id ?? auctionData.user?.id ?? null,
                };
                setAuction(mappedAuction);
                
                // Extract bid history from response - API returns bid_history array
                const bids = data?.bid_history || data?.bids || [];
                
                if (Array.isArray(bids) && bids.length > 0) {
                    const mappedBids = bids.map((bid, index) => ({
                        id: bid.bid_id || bid.id || `bid-${index}`,
                        bidder: bid.bidder?.email || bid.bidder?.name || bid.username || bid.bidder || bid.user?.name || bid.user?.email || 'Unknown',
                        amount: bid.bid_amount ?? bid.amount ?? 0,
                        time: bid.created_at || bid.bid_time || bid.time || new Date().toISOString(),
                        previousPrice: bid.previous_price,
                        newCurrentPrice: bid.new_current_price,
                        priceIncrease: bid.price_increase,
                    }));
                    setBidHistory(mappedBids);
                } else {
                    setBidHistory([]);
                }
            } catch (error) {
                const message = extractErrorMessage(error);
                toast.error('Failed to load auction details', {
                    description: message,
                });
                setBidHistory([]);
            } finally {
                setIsLoading(false);
                setIsLoadingBids(false);
            }
        };

        if (id) {
            fetchAuctionAndBidHistory();
        }
    }, [id]);
    
    useEffect(() => {
        if (!id) return;

        // Subscribe to bid placed events for this auction
        const unsubscribeBid = websocketService.subscribe('bidPlaced', (data) => {
            console.log('bidPlaced', data);
            if (data.auctionId === id || data.auction_id === id) {
                // Add new bid to bid history - handle both API format and WebSocket format
                const bid = data.bid || data;
                const newBid = {
                    id: bid.bid_id || bid.id || Date.now(),
                    bidder: bid.bidder?.email || bid.bidder?.name || bid.username || bid.bidder || bid.user?.name || bid.user?.email || 'Unknown',
                    amount: bid.bid_amount ?? bid.amount ?? 0,
                    time: bid.created_at || bid.bid_time || bid.time || new Date().toISOString(),
                    previousPrice: bid.previous_price,
                    newCurrentPrice: bid.new_current_price,
                    priceIncrease: bid.price_increase,
                };
                
                setBidHistory(prev => [newBid, ...prev]);
                
                // Update current bid if this is the highest bid
                if (auction && newBid.amount > auction.currentBid) {
                    setAuction(prev => ({
                        ...prev,
                        currentBid: newBid.amount,
                        bidCount: (prev?.bidCount || 0) + 1,
                    }));
                }
                
                // Show toast notification
                toast.info('New bid placed!', {
                    description: `${newBid.bidder} placed a bid of $${newBid.amount.toLocaleString()}`,
                });
            }
        });

        // Subscribe to auction updated events
        const unsubscribeAuction = websocketService.subscribe('auctionUpdated', (data) => {
            if (data.auctionId === id || data.auction_id === id || data.auction?.id === id) {
                const updatedAuction = data.auction || data;
                
                setAuction(prev => ({
                    ...prev,
                    currentBid: updatedAuction.current_price ?? updatedAuction.currentBid ?? prev?.currentBid ?? 0,
                    bidCount: updatedAuction.total_bids ?? updatedAuction.bid_count ?? prev?.bidCount ?? 0,
                    status: updatedAuction.status || prev?.status || 'active',
                    creatorId: updatedAuction.creator_id ?? updatedAuction.creatorId ?? updatedAuction.user_id ?? updatedAuction.userId ?? updatedAuction.creator?.id ?? updatedAuction.user?.id ?? prev?.creatorId ?? null,
                    image: Array.isArray(updatedAuction.images) && updatedAuction.images.length > 0 
                        ? updatedAuction.images[0] 
                        : updatedAuction.image ?? prev?.image ?? null,
                }));
            }
        });

        // Subscribe to bid history events (complete bid history update)
        const unsubscribeBidHistory = websocketService.subscribe('bidHistory', (data) => {
            if (data.auctionId === id || data.auction_id === id) {
                const bids = data.bid_history || data.bids || [];
                
                if (Array.isArray(bids) && bids.length > 0) {
                    const mappedBids = bids.map((bid, index) => ({
                        id: bid.bid_id || bid.id || `bid-${index}`,
                        bidder: bid.bidder?.email || bid.bidder?.name || bid.username || bid.bidder || bid.user?.name || bid.user?.email || 'Unknown',
                        amount: bid.bid_amount ?? bid.amount ?? 0,
                        time: bid.created_at || bid.bid_time || bid.time || new Date().toISOString(),
                        previousPrice: bid.previous_price,
                        newCurrentPrice: bid.new_current_price,
                        priceIncrease: bid.price_increase,
                    }));
                    setBidHistory(mappedBids);
                } else {
                    setBidHistory([]);
                }
            }
        });

        // Cleanup subscriptions on unmount
        return () => {
            unsubscribeBid();
            unsubscribeAuction();
            unsubscribeBidHistory();
        };
    }, [id, auction]);
    
    // Also listen to Redux WebSocket state for updates
    useEffect(() => {
        if (!id) return;

        // Check for complete bid history update from Redux
        if (bidUpdates[id] && Array.isArray(bidUpdates[id])) {
            // If it's a complete bid history array, replace the current history
            const mappedBids = bidUpdates[id].map((bid, index) => ({
                id: bid.bid_id || bid.id || `bid-${index}`,
                bidder: bid.bidder?.email || bid.bidder?.name || bid.username || bid.bidder || bid.user?.name || bid.user?.email || 'Unknown',
                amount: bid.bid_amount ?? bid.amount ?? 0,
                time: bid.created_at || bid.bid_time || bid.time || new Date().toISOString(),
                previousPrice: bid.previous_price,
                newCurrentPrice: bid.new_current_price,
                priceIncrease: bid.price_increase,
            }));
            setBidHistory(mappedBids);
        }

        // Check for auction updates from Redux
        if (auctionUpdates[id]) {
            const updated = auctionUpdates[id];
            setAuction(prev => ({
                ...prev,
                currentBid: updated.current_price ?? updated.currentBid ?? prev?.currentBid ?? 0,
                bidCount: updated.total_bids ?? updated.bid_count ?? prev?.bidCount ?? 0,
                status: updated.status || prev?.status || 'active',
                creatorId: updated.creator_id ?? updated.creatorId ?? updated.user_id ?? updated.userId ?? updated.creator?.id ?? updated.user?.id ?? prev?.creatorId ?? null,
                image: Array.isArray(updated.images) && updated.images.length > 0 
                    ? updated.images[0] 
                    : updated.image ?? prev?.image ?? null,
            }));
        }
    }, [id, bidUpdates, auctionUpdates]);
    
    // Refresh auction data after placing a bid
    const refreshAuctionData = async () => {
        try {
            // Refresh auction details and bid history from bid history API
            const data = await auctionApi.getBidHistory(id);
            
            // Extract and update auction data
            const auctionData = data?.auction || data || {};
            const summary = data?.summary || {};
            
            setAuction(prev => ({
                ...prev,
                currentBid: summary.highest_bid ?? auctionData.current_price ?? auctionData.currentBid ?? prev?.currentBid ?? 0,
                bidCount: summary.total_bids ?? auctionData.total_bids ?? auctionData.bid_count ?? prev?.bidCount ?? 0,
                status: auctionData.status || prev?.status || 'active',
                creatorId: auctionData.creator_id ?? auctionData.creatorId ?? auctionData.user_id ?? auctionData.userId ?? auctionData.creator?.id ?? auctionData.user?.id ?? prev?.creatorId ?? null,
                image: Array.isArray(auctionData.images) && auctionData.images.length > 0 
                    ? auctionData.images[0] 
                    : auctionData.image ?? prev?.image ?? null,
            }));
            
            // Extract and update bid history - API returns bid_history array
            const bids = data?.bid_history || data?.bids || [];
            
            if (Array.isArray(bids) && bids.length > 0) {
                const mappedBids = bids.map((bid, index) => ({
                    id: bid.bid_id || bid.id || `bid-${index}`,
                    bidder: bid.bidder?.email || bid.bidder?.name || bid.username || bid.bidder || bid.user?.name || bid.user?.email || 'Unknown',
                    amount: bid.bid_amount ?? bid.amount ?? 0,
                    time: bid.created_at || bid.bid_time || bid.time || new Date().toISOString(),
                    previousPrice: bid.previous_price,
                    newCurrentPrice: bid.new_current_price,
                    priceIncrease: bid.price_increase,
                }));
                setBidHistory(mappedBids);
            } else {
                setBidHistory([]);
            }
        } catch (error) {
            console.error('Error refreshing auction data:', error);
        }
    };

    const formatTimeRemaining = (endTime) => {
        if (!endTime) return { text: 'N/A', isUrgent: false };
        
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;
        
        if (diff <= 0) return { text: 'Ended', isUrgent: false };
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const isUrgent = days === 0 && hours < 1;
        
        if (days > 0) return { text: `${days}d ${hours}h ${minutes}m`, isUrgent };
        if (hours > 0) return { text: `${hours}h ${minutes}m ${seconds}s`, isUrgent };
        return { text: `${minutes}m ${seconds}s`, isUrgent: true };
    };

    if (isLoading || !auction) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader size="lg" />
                    <p className="text-sm text-muted-foreground">Loading auction details...</p>
                </div>
            </div>
        );
    }

    const timeRemaining = formatTimeRemaining(auction.endTime);
    const minBid = auction.currentBid + 100;
    
    // Get current user ID from Redux or localStorage
    const getCurrentUserId = () => {
        if (user?.id) return user.id;
        if (user?.user_id) return user.user_id;
        
        // Try to get from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                return userObj.id || userObj.user_id || null;
            } catch (error) {
                console.error('Error parsing user from localStorage:', error);
            }
        }
        return null;
    };
    
    const currentUserId = getCurrentUserId();
    const isCreator = auction.creatorId && currentUserId && 
                     (auction.creatorId.toString() === currentUserId.toString());
    
    // Check if bidding is allowed
    const isBiddingAllowed = !isCreator && 
                             auction.status === 'active' && 
                             auction.endTime && 
                             new Date(auction.endTime) > new Date();

    // Handle bid amount input change
    const handleBidAmountChange = (e) => {
        const value = e.target.value;
        setBidAmount(value);
    };
    console.log('handlePlaceBid', auction);

    const handlePlaceBid = async (e) => {
        e.preventDefault();
        
        // Check if user is the creator
        if (isCreator) {
            toast.error('Cannot bid on your own auction', {
                description: 'You cannot place bids on auctions you created.',
            });
            return;
        }
        
        // Check if auction is still active
        if (auction.status !== 'active') {
            toast.error('Auction not active', {
                description: `This auction is ${auction.status}. Bidding is no longer available.`,
            });
            return;
        }
        
        // Check if auction has ended
        if (auction.endTime) {
            const endTime = new Date(auction.endTime);
            const now = new Date();
            if (endTime <= now) {
                toast.error('Auction has ended', {
                    description: 'This auction is no longer accepting bids.',
                });
                return;
            }
        }
        
        // Get username from localStorage user object
        const userStr = localStorage.getItem('user');
        let username = '';
        
        if (userStr) {
            try {
                const userObj = JSON.parse(userStr);
                username = userObj.name || userObj.username || userObj.email || '';
            } catch (error) {
                console.error('Error parsing user from localStorage:', error);
            }
        }
        
        // Fallback to Redux user if localStorage doesn't have it
        if (!username && user) {
            username = user.name || user.username || user.email || '';
        }
        
        if (!username) {
            toast.error('User information not found', {
                description: 'Please log in again to place a bid.',
            });
            return;
        }
        
        // Validate bid amount
        if (!bidAmount || bidAmount.trim() === '') {
            toast.error('Bid amount required', {
                description: 'Please enter a bid amount.',
            });
            return;
        }
        
        const bid = parseFloat(bidAmount);
        
        if (isNaN(bid) || !isFinite(bid)) {
            toast.error('Invalid bid amount', {
                description: 'Please enter a valid number.',
            });
            return;
        }
        
        if (bid <= 0) {
            toast.error('Invalid bid amount', {
                description: 'Bid amount must be greater than 0.',
            });
            return;
        }
        
        // Check decimal places (max 2)
        const decimalPlaces = (bid.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
            toast.error('Invalid bid amount', {
                description: 'Bid amount can have maximum 2 decimal places.',
            });
            return;
        }
        
        if (bid < minBid) {
            toast.error('Bid too low', {
                description: `Minimum bid is $${minBid.toLocaleString()}. Please enter a higher amount.`,
            });
            return;
        }
        
        // Check maximum bid (reasonable limit)
        if (bid > 1000000000) {
            toast.error('Bid too high', {
                description: 'Bid amount exceeds maximum limit of $1,000,000,000.',
            });
            return;
        }
        
        setIsPlacingBid(true);
        
        try {
            // Get current timestamp
            const bidTime = new Date().toISOString();
            
            // Prepare bid payload
            const bidData = {
                bid: {
                    amount: bid,
                    username: username,
                    bid_time: bidTime,
                },
            };
            
            // Call the API to place the bid
            await auctionApi.placeBid(id, bidData);
            
            toast.success(`Bid of $${bid.toLocaleString()} placed successfully!`, {
                description: 'Your bid has been recorded and will be visible to other bidders.',
            });
            
            setBidAmount('');
            
            // Refresh auction data to show updated current bid and bid history
            await refreshAuctionData();
            
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error('Failed to place bid', {
                description: message || 'An error occurred. Please try again.',
            });
        } finally {
            setIsPlacingBid(false);
        }
    };

    return (
        <div className="space-y-6">
            <Button variant="ghost" asChild>
                <Link to="/auctions" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Auctions
                </Link>
            </Button>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Auction Image */}
                    <Card>
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
                                <Gavel className="h-24 w-24 text-muted-foreground" />
                            </div>
                        </div>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-3xl mb-2">{auction.title}</CardTitle>
                                    <CardDescription className="text-base">
                                        {auction.description}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Category</p>
                                    <p className="font-medium">{auction.category}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Condition</p>
                                    <p className="font-medium">{auction.condition}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Location</p>
                                    <p className="font-medium">{auction.location}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Seller</p>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        <p className="font-medium">{auction.sellerName}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bid History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Bid History</CardTitle>
                            <CardDescription>
                                Recent bids on this auction
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingBids ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader size="sm" />
                                </div>
                            ) : bidHistory.length === 0 ? (
                                <EmptyState
                                    icon={Gavel}
                                    title="No bids yet"
                                    description="Be the first to place a bid on this auction"
                                />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bidder</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {bidHistory.map((bid) => (
                                            <TableRow key={bid.id}>
                                                <TableCell className="font-medium">
                                                    {bid.bidder}
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    ${bid.amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {new Date(bid.time).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Bidding Section */}
                <div className="space-y-6">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Place a Bid</CardTitle>
                                <Timer className={`h-5 w-5 ${timeRemaining.isUrgent ? 'text-destructive animate-pulse' : ''}`} />
                            </div>
                            <CardDescription>
                                Time remaining: <span className={timeRemaining.isUrgent ? 'font-bold text-destructive' : ''}>
                                    {timeRemaining.text}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Current Bid</span>
                                    <span className="text-2xl font-bold">
                                        ${auction.currentBid.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Minimum Bid</span>
                                    <span className="font-semibold text-primary">
                                        ${minBid.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Total Bids</span>
                                    <span className="font-medium">
                                        {auction.bidCount}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handlePlaceBid} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bidAmount">Your Bid Amount</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="bidAmount"
                                            type="number"
                                            min={minBid}
                                            step="0.01"
                                            placeholder={minBid.toString()}
                                            value={bidAmount}
                                            onChange={handleBidAmountChange}
                                            className="pl-9"
                                            required
                                            disabled={!isBiddingAllowed}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Enter ${minBid.toLocaleString()} or higher
                                    </p>
                                </div>
                                <Button 
                                    type="submit" 
                                    className="w-full" 
                                    size="lg"
                                    isLoading={isPlacingBid}
                                    disabled={isPlacingBid || !isBiddingAllowed}
                                >
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    {isPlacingBid ? 'Placing Bid...' : !isBiddingAllowed ? (isCreator ? 'Your Auction' : 'Bidding Closed') : 'Place Bid'}
                                </Button>
                                {!isBiddingAllowed && (
                                    <p className="text-xs text-destructive text-center">
                                        {isCreator 
                                            ? 'You cannot bid on your own auction.' 
                                            : auction.status !== 'active' 
                                                ? `This auction is ${auction.status}.` 
                                                : 'This auction has ended.'}
                                    </p>
                                )}
                            </form>

                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Auction ends: {new Date(auction.endTime).toLocaleString()}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

