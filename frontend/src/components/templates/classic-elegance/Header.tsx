export default function Header() {
    return (
        <header className="bg-white">
            <div className="bg-[var(--color-primary)] text-white py-2 text-center text-xs uppercase tracking-widest">
                Classic Elegance Store
            </div>
            <div className="container mx-auto px-4 py-8 flex flex-col items-center">
                <div className="font-serif text-4xl mb-6">CLASSIC</div>
                <nav className="flex gap-8 border-t border-b border-gray-100 w-full justify-center py-4">
                    <a href="#" className="text-xs uppercase tracking-widest hover:text-[var(--color-accent)]">Home</a>
                    <a href="#" className="text-xs uppercase tracking-widest hover:text-[var(--color-accent)]">Catalog</a>
                    <a href="#" className="text-xs uppercase tracking-widest hover:text-[var(--color-accent)]">Journal</a>
                    <a href="#" className="text-xs uppercase tracking-widest hover:text-[var(--color-accent)]">Contact</a>
                </nav>
            </div>
        </header>
    );
}
