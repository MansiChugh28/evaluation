import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { PlusCircle, Upload, X } from 'lucide-react';
import { createAuction, reset } from '../features/auctions/auctionSlice';

export default function CreateAuctionPage() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { isLoading, isError, isSuccess, message } = useSelector((state) => state.auctions);

    // Form fields are focused on user input only.
    // The full auction payload (id, startingPrice, currentPrice, status, etc.)
    // is derived in handleSubmit to match backend requirements.
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
    const [images, setImages] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
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
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const errors = [];
        
        files.forEach((file, index) => {
            // Check file size
            if (file.size > maxFileSize) {
                errors.push(`${file.name} is too large. Maximum size is 5MB.`);
                return;
            }
            
            // Check file type
            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name} is not a valid image format. Allowed: JPG, PNG, GIF, WEBP.`);
                return;
            }
        });
        
        if (errors.length > 0) {
            toast.error('Image upload error', {
                description: errors.join(' '),
            });
            return;
        }
        
        // Check total image count
        if (images.length + files.length > 10) {
            toast.error('Too many images', {
                description: 'Maximum 10 images allowed. Please remove some images first.',
            });
            return;
        }
        
        // In real app, these would be uploaded to a server
        setImages(prev => [...prev, ...files.map(file => ({
            id: Date.now() + Math.random(),
            file,
            preview: URL.createObjectURL(file)
        }))]);
    };

    const removeImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    // Reset state when component unmounts or on success
    useEffect(() => {
        if (isSuccess) {
            toast.success('Auction created successfully!', {
                description: 'Your auction has been created.',
            });
            dispatch(reset());
            navigate('/my-auctions');
        }
    }, [isSuccess, navigate, dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error('Failed to create auction', {
                description: message || 'An error occurred. Please try again.',
            });
            dispatch(reset());
        }
    }, [isError, message, dispatch]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFieldErrors({});

        // Clear any previous errors
        if (isError) {
            dispatch(reset());
        }

        // Build endsAt from date + time
        const { endDate, endTime, startingPrice, status, location } = formData;
        const endsAt =
            endDate && endTime ? new Date(`${endDate}T${endTime}:00`) : null;

        const startingPriceNumber = parseFloat(startingPrice);

        // Validation
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
        if (!startingPrice || startingPrice.trim() === '') {
            errors.startingPrice = 'Starting price is required';
        } else if (Number.isNaN(startingPriceNumber)) {
            errors.startingPrice = 'Starting price must be a valid number';
        } else if (startingPriceNumber <= 0) {
            errors.startingPrice = 'Starting price must be greater than 0';
        } else if (startingPriceNumber > 1000000000) {
            errors.startingPrice = 'Starting price must be less than $1,000,000,000';
        } else {
            // Check decimal places (max 2)
            const decimalPlaces = (startingPrice.toString().split('.')[1] || '').length;
            if (decimalPlaces > 2) {
                errors.startingPrice = 'Starting price can have maximum 2 decimal places';
            }
        }

        // End date validation
        if (!endDate) {
            errors.endDate = 'End date is required';
        } else {
            const selectedDate = new Date(endDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
                errors.endDate = 'End date cannot be in the past';
            }
        }

        // End time validation
        if (!endTime) {
            errors.endTime = 'End time is required';
        }

        // Combined date/time validation
        if (endDate && endTime && !errors.endDate && !errors.endTime) {
            if (endsAt <= new Date()) {
                errors.endTime = 'End date and time must be in the future';
            }
        }

        // Location validation (optional but if provided, should be valid)
        if (location.trim() && location.trim().length > 200) {
            errors.location = 'Location must be less than 200 characters';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            toast.error('Please fix the validation errors', {
                description: 'Check the highlighted fields and try again.',
            });
            return;
        }

        // Create FormData for multipart/form-data submission
        const formDataToSend = new FormData();
        
        // Add auction data as nested object (backend expects auction[field] format)
        formDataToSend.append('auction[title]', formData.title.trim());
        formDataToSend.append('auction[description]', formData.description.trim());
        formDataToSend.append('auction[starting_price]', startingPriceNumber);
        formDataToSend.append('auction[ends_at]', endsAt.toISOString());
        formDataToSend.append('auction[status]', status);
        formDataToSend.append('auction[category]', formData.category.trim());
        formDataToSend.append('auction[condition]', formData.condition);
        
        if (location.trim()) {
            formDataToSend.append('auction[location]', location.trim());
        }
        
        // Add images as files
        images.forEach((image, index) => {
            if (image.file) {
                formDataToSend.append(`auction[images][]`, image.file);
            }
        });

        // Dispatch the create auction action with FormData
        dispatch(createAuction(formDataToSend));
    };

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 shadow-lg">
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Create New Auction ✨
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        List your item and start receiving bids
                    </p>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>
                                    Provide details about your item
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Item Title *</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Vintage Rolex Submariner"
                                        required
                                        className={fieldErrors.title ? 'border-destructive' : ''}
                                    />
                                    {fieldErrors.title && (
                                        <p className="text-sm text-destructive">{fieldErrors.title}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
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
                                        <Label htmlFor="category">Category *</Label>
                                        <Input
                                            id="category"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            placeholder="e.g., Watches, Electronics"
                                            required
                                            className={fieldErrors.category ? 'border-destructive' : ''}
                                        />
                                        {fieldErrors.category && (
                                            <p className="text-sm text-destructive">{fieldErrors.category}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="condition">Condition *</Label>
                                        <select
                                            id="condition"
                                            name="condition"
                                            value={formData.condition}
                                            onChange={handleChange}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            required
                                        >
                                            <option value="excellent">Excellent</option>
                                            <option value="good">Good</option>
                                            <option value="poor">Poor</option>
                                        </select>
                                    </div>
                                </div>
                                
                            </CardContent>
                        </Card>

                        {/* Images */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Images</CardTitle>
                                <CardDescription>
                                    Upload photos of your item (up to 10 images)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {images.map((image) => (
                                        <div key={image.id} className="relative aspect-square group">
                                            <img
                                                src={image.preview}
                                                alt="Preview"
                                                className="w-full h-full object-cover rounded-lg border"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeImage(image.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {images.length < 10 && (
                                        <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                            <span className="text-sm text-muted-foreground">Upload</span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Auction Settings */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Auction Settings</CardTitle>
                                <CardDescription>
                                    Configure your auction parameters
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
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
                                    <Label htmlFor="startingBid">Starting Bid ($) *</Label>
                                    <Input
                                        id="startingPrice"
                                        name="startingPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.startingPrice}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        required
                                        className={fieldErrors.startingPrice ? 'border-destructive' : ''}
                                    />
                                    {fieldErrors.startingPrice && (
                                        <p className="text-sm text-destructive">{fieldErrors.startingPrice}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date *</Label>
                                    <Input
                                        id="endDate"
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                        className={fieldErrors.endDate ? 'border-destructive' : ''}
                                    />
                                    {fieldErrors.endDate && (
                                        <p className="text-sm text-destructive">{fieldErrors.endDate}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time *</Label>
                                    <Input
                                        id="endTime"
                                        name="endTime"
                                        type="time"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        required
                                        className={fieldErrors.endTime ? 'border-destructive' : ''}
                                    />
                                    {fieldErrors.endTime && (
                                        <p className="text-sm text-destructive">{fieldErrors.endTime}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="City, State"
                                        className={fieldErrors.location ? 'border-destructive' : ''}
                                    />
                                    {fieldErrors.location && (
                                        <p className="text-sm text-destructive">{fieldErrors.location}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => navigate('/auctions')}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1" isLoading={isLoading}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Auction
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

