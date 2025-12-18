export default function Header() {
    return (
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="font-bold text-2xl tracking-tighter">MODERN.</div>
                    <nav className="hidden md:flex gap-6">
                        <a href="#" className="text-sm font-medium hover:text-[var(--color-primary)]">Shop</a>
                        <a href="#" className="text-sm font-medium hover:text-[var(--color-primary)]">Collections</a>
                        <a href="#" className="text-sm font-medium hover:text-[var(--color-primary)]">About</a>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-full">Search</button>
                    <button className="p-2 hover:bg-gray-100 rounded-full">Cart (0)</button>
                </div>
            </div>
        </header>
    );
}
