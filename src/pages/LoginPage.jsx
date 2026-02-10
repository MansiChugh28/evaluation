import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, reset } from '../features/auth/authSlice';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});

    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state) => state.auth
    );

    useEffect(() => {
        // Reset only error/success flags when component unmounts
        // Don't clear user/token as they're managed by auth slice
        return () => {
            if (isError || isSuccess) {
                dispatch(reset());
            }
        };
    }, [dispatch, isError, isSuccess]);

    // Redirect only on successful login, not on mount
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

    const validatePassword = (password) => {
        if (!password || password === '') {
            return 'Password is required';
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
    };

    const onSubmit = (e) => {
        e.preventDefault();
        setFieldErrors({});

        // Validate all fields
        const errors = {};
        const emailError = validateEmail(email);
        if (emailError) errors.email = emailError;

        const passwordError = validatePassword(password);
        if (passwordError) errors.password = passwordError;

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        // Clear any previous errors
        if (isError) {
            dispatch(reset());
        }

        const payload = {
            user: { 
                email: email.trim(),
                password: password,
            }
        };

        dispatch(login(payload));
    };

    return (
        <div className="w-full max-w-md">
            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                    Login to your account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isError && (
                        <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                            <div className="font-medium mb-1">Error:</div>
                            <div>{message || 'An error occurred. Please try again.'}</div>
                        </div>
                    )}
                <form className="space-y-4" onSubmit={onSubmit}>
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
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        isLoading={isLoading}
                            disabled={isLoading}
                    >
                            {isLoading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-muted-foreground">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="font-medium text-primary hover:underline"
                    >
                        Register
                    </Link>
            </div>
                </CardFooter>
            </Card>
        </div>
    );
};

export default LoginPage;
