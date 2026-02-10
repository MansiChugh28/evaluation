import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Gavel, Clock, Eye, Edit, Trash2, X, Save } from 'lucide-react';
import { EmptyState } from '../components/ui/empty-state';
import { toast } from 'sonner';
import auctionApi from '../api/auctionApi';
import { extractErrorMessage } from '../utils/errorHandler';
import { updateAuction } from '../features/auctions/auctionSlice';
import { Loader } from '../components/ui/loader';

export default function MyAuctionsPage() {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('active');
    // Dummy data as initial fallback
    const [activeAuctions, setActiveAuctions] = useState([]);
    const [endedAuctions, setEndedAuctions] = useState([]);
    
    // Edit modal state
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAuction, setEditingAuction] = useState(null);
    const [isLoadingAuction, setIsLoadingAuction] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startingPrice: '',
        status: 'draft',
        endDate: '',
        endTime: '',
        location: '',
        category: '',
        condition: 'excellent',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [apiError, setApiError] = useState('');
    const [deletingAuctionId, setDeletingAuctionId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [auctionToDelete, setAuctionToDelete] = useState(null);

    useEffect(() => {
        const fetchMyAuctions = async () => {
            try {
                const data = await auctionApi.getMyAuctions();

                // Allow both { auctions: [...] } and [...] shapes
                const auctions = data?.auctions || data || [];

                if (!Array.isArray(auctions) || auctions.length === 0) {
                    return; 
                }

                const now = new Date();
                const apiActive = [];
                const apiEnded = [];

                auctions.forEach((a) => {
                    const endTime = a.ends_at || a.endTime;
                    const status = a.status;
                    const endDate = endTime ? new Date(endTime) : null;
                    const isEnded =
                        status === 'sold' ||
                        status === 'expired' ||
                        (endDate && endDate <= now);

                    const baseAuction = {
                        id: a.id,
                        title: a.title,
                        currentBid:
                            a.current_price ??
                            a.currentBid ??
                            a.starting_price ??
                            a.startingBid ??
                            0,
                        startingBid: a.starting_price ?? a.startingBid ?? 0,
                        finalBid:
                            a.final_bid ??
                            a.finalBid ??
                            a.current_price ??
                            a.currentBid ??
                            0,
                        endTime: endTime,
                        bidCount: a.bid_count ?? a.bidCount ?? 0,
                        views: a.views ?? 0,
                        status: status || (isEnded ? 'ended' : 'active'),
                        image: Array.isArray(a.images) && a.images.length > 0 
                            ? a.images[0] 
                            : a.image || null,
                    };

                    if (isEnded) {
                        apiEnded.push(baseAuction);
                    } else {
                        apiActive.push(baseAuction);
                    }
                });

                setActiveAuctions(apiActive);
                setEndedAuctions(apiEnded);
            } catch (error) {
                const message = extractErrorMessage(error);
                toast.error('Failed to load your auctions', {
                    description: message,
                });
                // On error, keep dummy data
            }
        };

        fetchMyAuctions();
    }, []);

    // Fetch auction details for editing
    const handleEditClick = async (auctionId) => {
        setIsLoadingAuction(true);
        setIsEditModalOpen(true);
        setEditingAuction(auctionId);
        setFieldErrors({});
        setApiError('');
        
        try {
            const data = await auctionApi.getById(auctionId);
            const auction = data?.auction || data || {};
            
            // Parse end date and time from ends_at
            let endDate = '';
            let endTime = '';
            if (auction.ends_at) {
                const endDateObj = new Date(auction.ends_at);
                endDate = endDateObj.toISOString().split('T')[0];
                endTime = endDateObj.toTimeString().slice(0, 5); // HH:MM format
            }
            
            setFormData({
                title: auction.title || '',
                description: auction.description || '',
                startingPrice: auction.starting_price?.toString() || '',
                status: auction.status || 'draft',
                endDate: endDate,
                endTime: endTime,
                location: auction.location || '',
                category: auction.category || '',
                condition: auction.condition || 'excellent',
            });
        } catch (error) {
            const message = extractErrorMessage(error);
            setApiError(message);
            toast.error('Failed to load auction details', {
                description: message,
            });
            // Keep modal open to show error
        } finally {
            setIsLoadingAuction(false);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear errors for this field when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        
        // Clear API error when user starts typing
        if (apiError) {
            setApiError('');
        }
    };

    const validateForm = () => {
        const errors = {};
        
        // Title validation
        if (!formData.title.trim()) {
            errors.title = 'Title is required';
        } else if (formData.title.trim().length < 3) {
            errors.title = 'Title must be at least 3 characters long';
        } else if (formData.title.trim().length > 200) {
            errors.title = 'Title must be less than 200 characters';
        }

        // Description validation
        if (!formData.description.trim()) {
            errors.description = 'Description is required';
        } else if (formData.description.trim().length < 10) {
            errors.description = 'Description must be at least 10 characters long';
        } else if (formData.description.trim().length > 5000) {
            errors.description = 'Description must be less than 5000 characters';
        }

        // Category validation
        if (!formData.category.trim()) {
            errors.category = 'Category is required';
        } else if (formData.category.trim().length < 2) {
            errors.category = 'Category must be at least 2 characters long';
        } else if (formData.category.trim().length > 100) {
            errors.category = 'Category must be less than 100 characters';
        }

        // Starting price validation
        const startingPriceNumber = parseFloat(formData.startingPrice);
        if (!formData.startingPrice || formData.startingPrice.trim() === '') {
            errors.startingPrice = 'Starting price is required';
        } else if (Number.isNaN(startingPriceNumber)) {
            errors.startingPrice = 'Starting price must be a valid number';
        } else if (startingPriceNumber <= 0) {
            errors.startingPrice = 'Starting price must be greater than 0';
        } else if (startingPriceNumber > 1000000000) {
            errors.startingPrice = 'Starting price must be less than $1,000,000,000';
        } else {
            const decimalPlaces = (formData.startingPrice.toString().split('.')[1] || '').length;
            if (decimalPlaces > 2) {
                errors.startingPrice = 'Starting price can have maximum 2 decimal places';
            }
        }

        // End date validation
        if (!formData.endDate) {
            errors.endDate = 'End date is required';
        } else {
            const selectedDate = new Date(formData.endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                errors.endDate = 'End date cannot be in the past';
            }
        }

        // End time validation
        if (!formData.endTime) {
            errors.endTime = 'End time is required';
        }

        // Combined date/time validation
        if (formData.endDate && formData.endTime && !errors.endDate && !errors.endTime) {
            const endsAt = new Date(`${formData.endDate}T${formData.endTime}:00`);
            if (endsAt <= new Date()) {
                errors.endTime = 'End date and time must be in the future';
            }
        }

        // Location validation (optional but if provided, should be valid)
        if (formData.location.trim() && formData.location.trim().length > 200) {
            errors.location = 'Location must be less than 200 characters';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            toast.error('Please fix the validation errors', {
                description: 'Check the highlighted fields and try again.',
            });
            return;
        }

        setIsSaving(true);
        setApiError(''); // Clear previous API errors
        
        try {
            const { endDate, endTime, startingPrice, status, location } = formData;
            const endsAt = new Date(`${endDate}T${endTime}:00`);
            const startingPriceNumber = parseFloat(startingPrice);

            // Prepare payload - format as { auction: { ... } }
            const payload = {
                auction: {
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    starting_price: startingPriceNumber,
                    ends_at: endsAt.toISOString(),
                    status: status,
                    category: formData.category.trim(),
                    condition: formData.condition,
                    location: location.trim() || undefined,
                },
            };

            await dispatch(updateAuction({ id: editingAuction, auctionData: payload })).unwrap();
            
            toast.success('Auction updated successfully!', {
                description: 'Your auction has been updated.',
            });
            
            setIsEditModalOpen(false);
            setEditingAuction(null);
            setFormData({
                title: '',
                description: '',
                startingPrice: '',
                status: 'draft',
                endDate: '',
                endTime: '',
                location: '',
                category: '',
                condition: 'excellent',
            });
            
            // Refresh the auction list
            const fetchMyAuctions = async () => {
                try {
                    const data = await auctionApi.getMyAuctions();
                    const auctions = data?.auctions || data || [];
                    
                    if (!Array.isArray(auctions) || auctions.length === 0) {
                        return;
                    }

                    const now = new Date();
                    const apiActive = [];
                    const apiEnded = [];

                    auctions.forEach((a) => {
                        const endTime = a.ends_at || a.endTime;
                        const status = a.status;
                        const endDate = endTime ? new Date(endTime) : null;
                        const isEnded =
                            status === 'sold' ||
                            status === 'expired' ||
                            (endDate && endDate <= now);

                        const baseAuction = {
                            id: a.id,
                            title: a.title,
                            currentBid:
                                a.current_price ??
                                a.currentBid ??
                                a.starting_price ??
                                a.startingBid ??
                                0,
                            startingBid: a.starting_price ?? a.startingBid ?? 0,
                            finalBid:
                                a.final_bid ??
                                a.finalBid ??
                                a.current_price ??
                                a.currentBid ??
                                0,
                            endTime: endTime,
                            bidCount: a.bid_count ?? a.bidCount ?? 0,
                            views: a.views ?? 0,
                            status: status || (isEnded ? 'ended' : 'active'),
                            image: Array.isArray(a.images) && a.images.length > 0 
                                ? a.images[0] 
                                : a.image || null,
                        };

                        if (isEnded) {
                            apiEnded.push(baseAuction);
                        } else {
                            apiActive.push(baseAuction);
                        }
                    });

                    setActiveAuctions(apiActive);
                    setEndedAuctions(apiEnded);
                } catch (error) {
                    console.error('Error refreshing auctions:', error);
                }
            };
            
            fetchMyAuctions();
        } catch (error) {
            const message = extractErrorMessage(error);
            setApiError(message);
            
            // Check if there are field-specific errors from the API
            if (error?.response?.data?.errors) {
                const apiErrors = error.response.data.errors;
                const fieldSpecificErrors = {};
                
                // Map API field errors to form fields
                Object.keys(apiErrors).forEach((key) => {
                    const fieldName = key.replace(/_/g, ''); // Convert snake_case to camelCase
                    if (apiErrors[key] && Array.isArray(apiErrors[key])) {
                        fieldSpecificErrors[fieldName] = apiErrors[key][0];
                    } else if (apiErrors[key]) {
                        fieldSpecificErrors[fieldName] = apiErrors[key];
                    }
                });
                
                if (Object.keys(fieldSpecificErrors).length > 0) {
                    setFieldErrors(prev => ({ ...prev, ...fieldSpecificErrors }));
                }
            }
            
            toast.error('Failed to update auction', {
                description: message || 'An error occurred. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

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

    const handleDeleteClick = (auctionId, auctionTitle) => {
        setAuctionToDelete({ id: auctionId, title: auctionTitle });
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!auctionToDelete) return;
        
        setDeletingAuctionId(auctionToDelete.id);
        
        try {
            await auctionApi.delete(auctionToDelete.id);
            
            toast.success('Auction deleted successfully', {
                description: `"${auctionToDelete.title}" has been deleted.`,
            });
            
            setIsDeleteModalOpen(false);
            setAuctionToDelete(null);
            
            // Refresh the auction list
            const fetchMyAuctions = async () => {
                try {
                    const data = await auctionApi.getMyAuctions();
                    const auctions = data?.auctions || data || [];
                    
                    if (!Array.isArray(auctions) || auctions.length === 0) {
                        setActiveAuctions([]);
                        setEndedAuctions([]);
                        return;
                    }

                    const now = new Date();
                    const apiActive = [];
                    const apiEnded = [];

                    auctions.forEach((a) => {
                        const endTime = a.ends_at || a.endTime;
                        const status = a.status;
                        const endDate = endTime ? new Date(endTime) : null;
                        const isEnded =
                            status === 'sold' ||
                            status === 'expired' ||
                            (endDate && endDate <= now);

                        const baseAuction = {
                            id: a.id,
                            title: a.title,
                            currentBid:
                                a.current_price ??
                                a.currentBid ??
                                a.starting_price ??
                                a.startingBid ??
                                0,
                            startingBid: a.starting_price ?? a.startingBid ?? 0,
                            finalBid:
                                a.final_bid ??
                                a.finalBid ??
                                a.current_price ??
                                a.currentBid ??
                                0,
                            endTime: endTime,
                            bidCount: a.bid_count ?? a.bidCount ?? 0,
                            views: a.views ?? 0,
                            status: status || (isEnded ? 'ended' : 'active'),
                            image: Array.isArray(a.images) && a.images.length > 0 
                                ? a.images[0] 
                                : a.image || null,
                        };

                        if (isEnded) {
                            apiEnded.push(baseAuction);
                        } else {
                            apiActive.push(baseAuction);
                        }
                    });

                    setActiveAuctions(apiActive);
                    setEndedAuctions(apiEnded);
                } catch (error) {
                    console.error('Error refreshing auctions:', error);
                }
            };
            
            fetchMyAuctions();
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error('Failed to delete auction', {
                description: message || 'An error occurred. Please try again.',
            });
        } finally {
            setDeletingAuctionId(null);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setAuctionToDelete(null);
    };

    const AuctionCard = ({ auction, isEnded = false }) => (
        <Card className="hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-2 hover:border-primary/30 overflow-hidden group">
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
                <CardTitle className="line-clamp-2">{auction.title}</CardTitle>
                <CardDescription>
                    {isEnded ? 'Ended' : formatTimeRemaining(auction.endTime)} remaining
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                            {isEnded ? 'Final Bid' : 'Current Bid'}
                        </span>
                        <span className="text-xl font-bold">
                            ${(isEnded ? auction.finalBid : auction.currentBid).toLocaleString()}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                            <span>{auction.bidCount} bids</span>
                            <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {auction.views}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2">
                <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to={`/auctions/${auction.id}`}>
                        View
                    </Link>
                </Button>
                {!isEnded && (
                    <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditClick(auction.id)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteClick(auction.id, auction.title)}
                    disabled={deletingAuctionId === auction.id}
                >
                    {deletingAuctionId === auction.id ? (
                        <Loader size="sm" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                </Button>
            </CardFooter>
        </Card>
    );

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 shadow-lg">
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            My Auctions 📦
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Manage your active and completed auctions
                        </p>
                    </div>
                    <Button asChild size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
                        <Link to="/create-auction">
                            Create New Auction
                        </Link>
                    </Button>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
            </div>

            <div className="flex gap-2 border-2 rounded-xl p-1 bg-muted/30">
                <button 
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        activeTab === 'active' 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                    Active ({activeAuctions.length})
                </button>
                <button 
                    onClick={() => setActiveTab('ended')}
                    className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                        activeTab === 'ended' 
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                    Ended ({endedAuctions.length})
                </button>
            </div>

            {/* Active Auctions */}
            {activeTab === 'active' && (
                <div>
                    {activeAuctions.length === 0 ? (
                        <EmptyState
                            icon={Gavel}
                            title="No active auctions"
                            description="Create your first auction to get started"
                            action={
                                <Button asChild>
                                    <Link to="/create-auction">Create Auction</Link>
                                </Button>
                            }
                        />
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {activeAuctions.map((auction) => (
                                <AuctionCard key={auction.id} auction={auction} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Ended Auctions */}
            {activeTab === 'ended' && (
                <div>
                    {endedAuctions.length === 0 ? (
                        <EmptyState
                            icon={Clock}
                            title="No ended auctions"
                            description="Your completed auctions will appear here"
                        />
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {endedAuctions.map((auction) => (
                                <AuctionCard key={auction.id} auction={auction} isEnded={true} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-2xl">Edit Auction</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingAuction(null);
                                    setFieldErrors({});
                                    setApiError('');
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isLoadingAuction ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader size="lg" />
                                        <p className="text-sm text-muted-foreground">Loading auction details...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {apiError && (
                                        <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                                            <div className="font-medium mb-1">Error:</div>
                                            <div>{apiError}</div>
                                        </div>
                                    )}
                                    <div className="grid gap-6 lg:grid-cols-3">
                                    {/* Main Form */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-title">Item Title *</Label>
                                                <Input
                                                    id="edit-title"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleFormChange}
                                                    placeholder="e.g., Vintage Rolex Submariner"
                                                    required
                                                    className={fieldErrors.title ? 'border-destructive' : ''}
                                                />
                                                {fieldErrors.title && (
                                                    <p className="text-sm text-destructive">{fieldErrors.title}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-description">Description *</Label>
                                                <Textarea
                                                    id="edit-description"
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleFormChange}
                                                    placeholder="Describe your item in detail..."
                                                    rows={6}
                                                    required
                                                    className={fieldErrors.description ? 'border-destructive' : ''}
                                                />
                                                {fieldErrors.description && (
                                                    <p className="text-sm text-destructive">{fieldErrors.description}</p>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-category">Category *</Label>
                                                    <Input
                                                        id="edit-category"
                                                        name="category"
                                                        value={formData.category}
                                                        onChange={handleFormChange}
                                                        placeholder="e.g., Watches, Electronics"
                                                        required
                                                        className={fieldErrors.category ? 'border-destructive' : ''}
                                                    />
                                                    {fieldErrors.category && (
                                                        <p className="text-sm text-destructive">{fieldErrors.category}</p>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="edit-condition">Condition *</Label>
                                                    <select
                                                        id="edit-condition"
                                                        name="condition"
                                                        value={formData.condition}
                                                        onChange={handleFormChange}
                                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                        required
                                                    >
                                                        <option value="excellent">Excellent</option>
                                                        <option value="good">Good</option>
                                                        <option value="poor">Poor</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar */}
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-status">Status *</Label>
                                                <select
                                                    id="edit-status"
                                                    name="status"
                                                    value={formData.status}
                                                    onChange={handleFormChange}
                                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    required
                                                >
                                                    <option value="draft">Draft</option>
                                                    <option value="active">Active</option>
                                                    <option value="sold">Sold</option>
                                                    <option value="expired">Expired</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-startingPrice">Starting Bid ($) *</Label>
                                                <Input
                                                    id="edit-startingPrice"
                                                    name="startingPrice"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.startingPrice}
                                                    onChange={handleFormChange}
                                                    placeholder="0.00"
                                                    required
                                                    className={fieldErrors.startingPrice ? 'border-destructive' : ''}
                                                />
                                                {fieldErrors.startingPrice && (
                                                    <p className="text-sm text-destructive">{fieldErrors.startingPrice}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-endDate">End Date *</Label>
                                                <Input
                                                    id="edit-endDate"
                                                    name="endDate"
                                                    type="date"
                                                    value={formData.endDate}
                                                    onChange={handleFormChange}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    required
                                                    className={fieldErrors.endDate ? 'border-destructive' : ''}
                                                />
                                                {fieldErrors.endDate && (
                                                    <p className="text-sm text-destructive">{fieldErrors.endDate}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-endTime">End Time *</Label>
                                                <Input
                                                    id="edit-endTime"
                                                    name="endTime"
                                                    type="time"
                                                    value={formData.endTime}
                                                    onChange={handleFormChange}
                                                    required
                                                    className={fieldErrors.endTime ? 'border-destructive' : ''}
                                                />
                                                {fieldErrors.endTime && (
                                                    <p className="text-sm text-destructive">{fieldErrors.endTime}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-location">Location</Label>
                                                <Input
                                                    id="edit-location"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleFormChange}
                                                    placeholder="City, State"
                                                    className={fieldErrors.location ? 'border-destructive' : ''}
                                                />
                                                {fieldErrors.location && (
                                                    <p className="text-sm text-destructive">{fieldErrors.location}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-4 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setIsEditModalOpen(false);
                                                    setEditingAuction(null);
                                                    setFieldErrors({});
                                                }}
                                                disabled={isSaving}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                className="flex-1"
                                                onClick={handleSave}
                                                isLoading={isSaving}
                                                disabled={isSaving}
                                            >
                                                <Save className="mr-2 h-4 w-4" />
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-2xl text-destructive">Delete Auction</CardTitle>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelDelete}
                                disabled={deletingAuctionId !== null}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Are you sure you want to delete this auction?
                                </p>
                                {auctionToDelete && (
                                    <div className="p-4 bg-muted rounded-lg border border-destructive/20">
                                        <p className="font-semibold text-lg">{auctionToDelete.title}</p>
                                    </div>
                                )}
                                <p className="text-sm text-destructive font-medium">
                                    This action cannot be undone. All bids and data associated with this auction will be permanently deleted.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={handleCancelDelete}
                                disabled={deletingAuctionId !== null}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                className="flex-1"
                                onClick={handleConfirmDelete}
                                isLoading={deletingAuctionId !== null}
                                disabled={deletingAuctionId !== null}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deletingAuctionId !== null ? 'Deleting...' : 'Delete Auction'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}

