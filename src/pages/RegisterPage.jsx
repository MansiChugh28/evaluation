import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, reset } from '../features/auth/authSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [localError, setLocalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const { name, email, password, confirmPassword } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        return () => {
            if (isError || isSuccess) {
                dispatch(reset());
            }
        };
    }, [dispatch, isError, isSuccess]);

    // Redirect only on successful registration, not on mount
    // PublicRoute will handle redirect if already authenticated
    useEffect(() => {
        if (isSuccess && user) {
            navigate('/', { replace: true });
        }
    }, [isSuccess, user, navigate]);

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

    const validateName = (name) => {
        if (!name || name.trim() === '') {
            return 'Name is required';
        }
        if (name.trim().length < 2) {
            return 'Name must be at least 2 characters long';
        }
        if (name.trim().length > 100) {
            return 'Name must be less than 100 characters';
        }
        return '';
    };

    const validatePassword = (password) => {
        if (!password || password === '') {
            return 'Password is required';
        }
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (password.length > 128) {
            return 'Password must be less than 128 characters';
        }
        return '';
    };

    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
        
        // Clear errors for this field when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        if (localError) {
            setLocalError('');
        }
    };

    const onSubmit = (e) => {
        e.preventDefault();
        setLocalError('');
        setFieldErrors({});

        // Clear any previous API errors
        if (isError) {
            dispatch(reset());
        }

        // Validate all fields
        const errors = {};
        const nameError = validateName(name);
        if (nameError) errors.name = nameError;

        const emailError = validateEmail(email);
        if (emailError) errors.email = emailError;

        const passwordError = validatePassword(password);
        if (passwordError) errors.password = passwordError;

        // Validate password match
        if (password && confirmPassword && password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        // Backend expects: { user: { email, password, password_confirmation, name } }
        const payload = {
            user: {
                email: email.trim(),
            password,
                password_confirmation: confirmPassword,
                name: name.trim(),
            },
        };

        dispatch(register(payload));
    };

    return (
        <div className="w-full max-w-md">
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                    Create an account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your information to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {(isError || localError) && (
                        <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                            <div className="font-medium mb-1">Error:</div>
                            <div>{localError || message || 'An error occurred. Please try again.'}</div>
                        </div>
                    )}
                <form className="space-y-4" onSubmit={onSubmit}>
                        <div className="space-y-2">
                        <label
                            htmlFor="name"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Name
                        </label>
                        <Input
                            type="text"
                            id="name"
                            name="name"
                            value={name}
                            onChange={onChange}
                            placeholder="Enter your name"
                            required
                                className={fieldErrors.name ? 'border-destructive' : ''}
                        />
                            {fieldErrors.name && (
                                <p className="text-sm text-destructive">{fieldErrors.name}</p>
                            )}
                    </div>
                        <div className="space-y-2">
                        <label
                            htmlFor="email"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Email Address
                        </label>
                        <Input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="Enter your email"
                            required
                                className={fieldErrors.email ? 'border-destructive' : ''}
                        />
                            {fieldErrors.email && (
                                <p className="text-sm text-destructive">{fieldErrors.email}</p>
                            )}
                    </div>
                        <div className="space-y-2">
                        <label
                            htmlFor="password"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Password
                        </label>
                        <Input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            placeholder="Enter your password"
                            required
                                className={fieldErrors.password ? 'border-destructive' : ''}
                            />
                            {fieldErrors.password && (
                                <p className="text-sm text-destructive">{fieldErrors.password}</p>
                            )}
                            {!fieldErrors.password && (
                                <p className="text-xs text-muted-foreground">
                                    Must be at least 6 characters long
                                </p>
                            )}
                    </div>
                        <div className="space-y-2">
                        <label
                            htmlFor="confirmPassword"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Confirm Password
                        </label>
                        <Input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={onChange}
                            placeholder="Confirm your password"
                            required
                                className={fieldErrors.confirmPassword ? 'border-destructive' : ''}
                        />
                            {fieldErrors.confirmPassword && (
                                <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
                            )}
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        isLoading={isLoading}
                            disabled={isLoading}
                    >
                            {isLoading ? 'Creating account...' : 'Register'}
                    </Button>
                </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-muted-foreground">
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        className="font-medium text-primary hover:underline"
                    >
                        Login
                    </Link>
            </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RegisterPage;
