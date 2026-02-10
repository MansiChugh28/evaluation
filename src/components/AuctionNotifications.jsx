import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import websocketService from '../services/websocketService';
import { Clock } from 'lucide-react';

/**
 * AuctionNotifications component
 * 
 * Listens to WebSocket events for auction notifications and displays toast notifications
 */
export default function AuctionNotifications() {
    const navigate = useNavigate();

    useEffect(() => {
        // Subscribe to auction ending soon events
        const unsubscribeEndingSoon = websocketService.subscribe('auctionEndingSoon', (data) => {
            const auction = data.auction || data;
            const auctionId = data.auctionId || data.auction_id || auction?.id;
            const hoursRemaining = data.hoursRemaining || data.hours_remaining || 2;
            const title = auction?.title || 'An auction';
            
            // Show toast notification
            toast.warning(`Auction Ending Soon! ⏰`, {
                description: `"${title}" is closing in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}. Place your bid now!`,
                duration: 8000,
                action: {
                    label: 'View Auction',
                    onClick: () => {
                        if (auctionId) {
                            navigate(`/auctions/${auctionId}`);
                        }
                    },
                },
                icon: <Clock className="h-4 w-4" />,
            });
        });

        // Also subscribe to the snake_case version
        const unsubscribeEndingSoonSnake = websocketService.subscribe('auction_ending_soon', (data) => {
            const auction = data.auction || data;
            const auctionId = data.auctionId || data.auction_id || auction?.id;
            const hoursRemaining = data.hoursRemaining || data.hours_remaining || 2;
            const title = auction?.title || 'An auction';
            
            // Show toast notification
            toast.warning(`Auction Ending Soon! ⏰`, {
                description: `"${title}" is closing in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}. Place your bid now!`,
                duration: 8000,
                action: {
                    label: 'View Auction',
                    onClick: () => {
                        if (auctionId) {
                            navigate(`/auctions/${auctionId}`);
                        }
                    },
                },
                icon: <Clock className="h-4 w-4" />,
            });
        });

        // Cleanup subscriptions on unmount
        return () => {
            unsubscribeEndingSoon();
            unsubscribeEndingSoonSnake();
        };
    }, [navigate]);

    // This component doesn't render anything
    return null;
}

