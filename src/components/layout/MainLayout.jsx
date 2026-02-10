import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout({ children }) {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64 transition-all duration-300">
                    <div className="container mx-auto px-4 py-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

