import { Header } from './Header';

export function AuthLayout({ children }) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center p-4">
                {children}
            </div>
        </div>
    );
}

