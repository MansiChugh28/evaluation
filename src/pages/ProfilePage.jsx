import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { User, Mail, Phone, MapPin, Edit, Save, X, DollarSign, Wallet } from 'lucide-react';
import authApi from '../api/authApi';
import { extractErrorMessage } from '../utils/errorHandler';
import { Loader } from '../components/ui/loader';
import { updateUser } from '../features/auth/authSlice';

export default function ProfilePage() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        bio: '',
        location: '',
    });
    const [errors, setErrors] = useState({});
    const [balance, setBalance] = useState(0);
    const [isLoadingBalance, setIsLoadingBalance] = useState(true);
    const [isEditingBalance, setIsEditingBalance] = useState(false);
    const [balanceAmount, setBalanceAmount] = useState('');
    const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);
    const [balanceError, setBalanceError] = useState('');
    
    // Validation functions
    const validateEmail = (email) => {
        if (!email || email.trim() === '') {
            return 'Email is required';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return 'Please enter a valid email address';
        }
        return '';
    };
    
    const validatePhone = (phone) => {
        if (!phone || phone.trim() === '') {
            return ''; // Phone is optional
        }
        // Allow various phone formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
        const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
        if (!phoneRegex.test(phone.trim())) {
            return 'Please enter a valid phone number';
        }
        return '';
    };
    
    // Fetch user profile from API
    useEffect(() => {
        const fetchUserProfile = async () => {
            setIsLoading(true);
            try {
                const data = await authApi.getMe();
                const userData = data?.user || data || {};
                
                setFormData({
                    name: userData.name || user?.name || '',
                    email: userData.email || user?.email || '',
                    phone: userData.phone || '',
                    address: userData.address || '',
                    bio: userData.bio || '',
                    location: userData.location || '',
                });
            } catch (error) {
                const message = extractErrorMessage(error);
                toast.error('Failed to load profile', {
                    description: message,
                });
                // Fallback to Redux user data
                setFormData({
                    name: user?.name || '',
                    email: user?.email || '',
                    phone: '',
                    address: '',
                    bio: '',
                    location: '',
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [user]);

    // Fetch user balance
    useEffect(() => {
        const fetchBalance = async () => {
            setIsLoadingBalance(true);
            try {
                const data = await authApi.getBalance();
                const balanceValue = data?.balance ?? data?.user?.balance ?? data ?? 0;
                setBalance(typeof balanceValue === 'number' ? balanceValue : parseFloat(balanceValue) || 0);
            } catch (error) {
                const message = extractErrorMessage(error);
                toast.error('Failed to load balance', {
                    description: message,
                });
                setBalance(0);
            } finally {
                setIsLoadingBalance(false);
            }
        };

        fetchBalance();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        // Validate email
        const emailError = validateEmail(formData.email);
        if (emailError) {
            newErrors.email = emailError;
        }
        
        // Validate phone
        const phoneError = validatePhone(formData.phone);
        if (phoneError) {
            newErrors.phone = phoneError;
        }
        
        // Validate name
        if (!formData.name || formData.name.trim() === '') {
            newErrors.name = 'Name is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        // Validate form before submitting
        if (!validateForm()) {
            toast.error('Please fix the validation errors', {
                description: 'Check the highlighted fields and try again.',
            });
            return;
        }
        
        setIsSaving(true);
        
        try {
            // Prepare payload - format as { user: { ... } } if backend expects it
            const payload = {
                user: {
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone.trim() || undefined,
                    address: formData.address.trim() || undefined,
                    bio: formData.bio.trim() || undefined,
                    location: formData.location.trim() || undefined,
                },
            };
            
            const data = await authApi.updateMe(payload);
            const updatedUser = data?.user || data || {};
            
            // Update form data with response
            setFormData({
                name: updatedUser.name || formData.name,
                email: updatedUser.email || formData.email,
                phone: updatedUser.phone || formData.phone,
                address: updatedUser.address || formData.address,
                bio: updatedUser.bio || formData.bio,
                location: updatedUser.location || formData.location,
            });
            
            // Update Redux auth state with new user data
            if (updatedUser.name || updatedUser.email) {
                dispatch(updateUser(updatedUser));
            }
            
            toast.success('Profile updated successfully!', {
                description: 'Your profile information has been saved.',
            });
            
            setIsEditing(false);
        } catch (error) {
            const message = extractErrorMessage(error);
            toast.error('Failed to update profile', {
                description: message || 'An error occurred. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset to original values by fetching again
        const resetFormData = async () => {
            try {
                const data = await authApi.getMe();
                const userData = data?.user || data || {};
                
                setFormData({
                    name: userData.name || user?.name || '',
                    email: userData.email || user?.email || '',
                    phone: userData.phone || '',
                    address: userData.address || '',
                    bio: userData.bio || '',
                    location: userData.location || '',
                });
            } catch (error) {
                // Fallback to current formData or user data
                setFormData({
                    name: user?.name || formData.name || '',
                    email: user?.email || formData.email || '',
                    phone: formData.phone || '',
                    address: formData.address || '',
                    bio: formData.bio || '',
                    location: formData.location || '',
                });
            }
        };
        
        resetFormData();
        setIsEditing(false);
        setErrors({}); // Clear errors when canceling
    };

    const handleEditBalance = () => {
        setIsEditingBalance(true);
        setBalanceAmount(balance.toString());
        setBalanceError('');
    };

    const handleCancelBalance = () => {
        setIsEditingBalance(false);
        setBalanceAmount('');
        setBalanceError('');
    };

    const handleUpdateBalance = async () => {
        setBalanceError('');
        
        // Validate balance amount
        if (!balanceAmount || balanceAmount.trim() === '') {
            setBalanceError('Balance amount is required');
            return;
        }

        const amount = parseFloat(balanceAmount);
        
        if (isNaN(amount) || !isFinite(amount)) {
            setBalanceError('Please enter a valid number');
            return;
        }

        if (amount < 0) {
            setBalanceError('Balance cannot be negative');
            return;
        }

        // Check decimal places (max 2)
        const decimalPlaces = (balanceAmount.toString().split('.')[1] || '').length;
        if (decimalPlaces > 2) {
            setBalanceError('Balance can have maximum 2 decimal places');
            return;
        }

        setIsUpdatingBalance(true);

        try {
            // Prepare payload - format as { balance: amount } or { user: { balance: amount } }
            const payload = {
                balance: amount,
            };
            
            const data = await authApi.updateBalance(payload);
            const updatedBalance = data?.balance ?? data?.user?.balance ?? data ?? amount;
            
            setBalance(typeof updatedBalance === 'number' ? updatedBalance : parseFloat(updatedBalance) || 0);
            
            toast.success('Balance updated successfully!', {
                description: `Your balance has been updated to $${updatedBalance.toLocaleString()}`,
            });
            
            setIsEditingBalance(false);
            setBalanceAmount('');
        } catch (error) {
            const message = extractErrorMessage(error);
            setBalanceError(message);
            toast.error('Failed to update balance', {
                description: message || 'An error occurred. Please try again.',
            });
        } finally {
            setIsUpdatingBalance(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader size="lg" />
                    <p className="text-sm text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 shadow-lg">
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            Profile 👤
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Manage your account information and preferences
                        </p>
                    </div>
                    {!isEditing && (
                        <Button 
                            onClick={() => {
                                setIsEditing(true);
                                setErrors({}); // Clear any previous errors
                            }}
                            size="lg"
                            className="rounded-full shadow-lg hover:shadow-xl transition-all"
                        >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Button>
                    )}
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Information */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>
                                Update your personal details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                {isEditing ? (
                                    <>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className={errors.name ? 'border-destructive' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm py-2 px-3 bg-muted rounded-md">
                                        {formData.name || 'Not set'}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                {isEditing ? (
                                    <>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className={errors.email ? 'border-destructive' : ''}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-destructive">{errors.email}</p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm py-2 px-3 bg-muted rounded-md flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {formData.email || 'Not set'}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                {isEditing ? (
                                    <>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+1 (555) 123-4567"
                                            className={errors.phone ? 'border-destructive' : ''}
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-destructive">{errors.phone}</p>
                                        )}
                                        {!errors.phone && (
                                            <p className="text-xs text-muted-foreground">
                                                Optional. Format: +1234567890, (123) 456-7890, or 123-456-7890
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm py-2 px-3 bg-muted rounded-md flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {formData.phone || 'Not set'}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                {isEditing ? (
                                    <Input
                                        id="location"
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="City, State"
                                    />
                                ) : (
                                    <p className="text-sm py-2 px-3 bg-muted rounded-md flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        {formData.location || 'Not set'}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio</Label>
                                {isEditing ? (
                                    <Textarea
                                        id="bio"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Tell us about yourself..."
                                        rows={4}
                                    />
                                ) : (
                                    <p className="text-sm py-2 px-3 bg-muted rounded-md min-h-[100px]">
                                        {formData.bio || 'No bio added'}
                                    </p>
                                )}
                            </div>
                            {isEditing && (
                                <div className="flex gap-2 pt-4">
                                    <Button 
                                        onClick={handleSave}
                                        isLoading={isSaving}
                                        disabled={isSaving}
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Profile Summary */}
                <div className="space-y-6">
                    <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
                            <CardTitle className="text-xl">Account Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-center p-8">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-12 w-12 text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-semibold text-lg">{formData.name}</p>
                                        <p className="text-sm text-muted-foreground">{formData.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Member Since</span>
                                    <span className="text-sm font-medium">Dec 2024</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Auctions</span>
                                    <span className="text-sm font-medium">0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Total Bids</span>
                                    <span className="text-sm font-medium">0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Rating</span>
                                    <span className="text-sm font-medium">-</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Balance Card */}
                    <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                        {/* Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 opacity-50"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -ml-12 -mb-12"></div>
                        
                        <div className="relative z-10">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                                            <Wallet className="h-6 w-6 text-primary-foreground" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold">Balance</CardTitle>
                                            <p className="text-xs text-muted-foreground">Your account balance</p>
                                        </div>
                                    </div>
                                    {!isEditingBalance && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleEditBalance}
                                            className="rounded-full border-2 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all"
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isEditingBalance ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="balance" className="text-sm font-semibold">Balance Amount ($)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    id="balance"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={balanceAmount}
                                                    onChange={(e) => {
                                                        setBalanceAmount(e.target.value);
                                                        if (balanceError) setBalanceError('');
                                                    }}
                                                    className={`pl-12 h-12 rounded-xl border-2 ${balanceError ? 'border-destructive' : 'border-primary/20 focus:border-primary'}`}
                                                    required
                                                />
                                            </div>
                                            {balanceError && (
                                                <p className="text-sm text-destructive font-medium">{balanceError}</p>
                                            )}
                                            {!balanceError && (
                                                <p className="text-xs text-muted-foreground">
                                                    Enter the balance amount (minimum 0, max 2 decimal places)
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1 rounded-full border-2"
                                                onClick={handleCancelBalance}
                                                disabled={isUpdatingBalance}
                                            >
                                                <X className="mr-2 h-4 w-4" />
                                                Cancel
                                            </Button>
                                            <Button
                                                className="flex-1 rounded-full shadow-lg hover:shadow-xl transition-all"
                                                onClick={handleUpdateBalance}
                                                isLoading={isUpdatingBalance}
                                                disabled={isUpdatingBalance}
                                            >
                                                <Save className="mr-2 h-4 w-4" />
                                                {isUpdatingBalance ? 'Updating...' : 'Save'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {isLoadingBalance ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader size="sm" />
                                            </div>
                                        ) : (
                                            <>
                                                {/* Main Balance Display */}
                                                <div className="relative p-8 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-2xl border-2 border-primary/30 shadow-inner overflow-hidden">
                                                    {/* Decorative circles */}
                                                    <div className="absolute top-4 right-4 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
                                                    <div className="absolute bottom-4 left-4 w-16 h-16 bg-primary/10 rounded-full blur-xl"></div>
                                                    
                                                    <div className="relative z-10">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Current Balance</span>
                                                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                                <DollarSign className="h-4 w-4 text-primary" />
                                                            </div>
                                                        </div>
                                                        <div className="mt-4">
                                                            <span className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                                                                ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Quick Info */}
                                                <div className="flex items-center justify-center gap-6 pt-2">
                                                    <div className="text-center">
                                                        <p className="text-xs text-muted-foreground">Available</p>
                                                        <p className="text-sm font-semibold text-foreground">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                    </div>
                                                    <div className="h-8 w-px bg-border"></div>
                                                    <div className="text-center">
                                                        <p className="text-xs text-muted-foreground">Status</p>
                                                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">Active</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

