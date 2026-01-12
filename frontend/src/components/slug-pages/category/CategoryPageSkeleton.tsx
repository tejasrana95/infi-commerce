'use client';

// Loading skeleton for Category Page
// Separated into Client Component because styled-jsx requires it

export default function CategoryPageSkeleton() {
    return (
        <div className="category-skeleton">
            <style jsx>{`
                .category-skeleton {
                    min-height: 100vh;
                    background: #f8fafc;
                }
                .skeleton-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 3rem 2rem;
                }
                .skeleton-breadcrumb {
                    height: 1rem;
                    width: 200px;
                    background: rgba(255,255,255,0.3);
                    border-radius: 4px;
                    margin-bottom: 1rem;
                }
                .skeleton-title {
                    height: 2.5rem;
                    width: 300px;
                    background: rgba(255,255,255,0.5);
                    border-radius: 8px;
                }
                .skeleton-content {
                    display: flex;
                    gap: 2rem;
                    max-width: 1440px;
                    margin: 0 auto;
                    padding: 2rem;
                }
                .skeleton-sidebar {
                    width: 280px;
                    flex-shrink: 0;
                }
                .skeleton-filter {
                    background: white;
                    border-radius: 12px;
                    padding: 1rem;
                    margin-bottom: 1rem;
                    height: 150px;
                }
                .skeleton-main {
                    flex: 1;
                }
                .skeleton-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1.5rem;
                }
                .skeleton-card {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                }
                .skeleton-image {
                    aspect-ratio: 3/4;
                    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                .skeleton-text {
                    padding: 1rem;
                }
                .skeleton-line {
                    height: 1rem;
                    background: #e2e8f0;
                    border-radius: 4px;
                    margin-bottom: 0.5rem;
                }
                .skeleton-line:last-child {
                    width: 60%;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                @media (max-width: 1024px) {
                    .skeleton-sidebar { display: none; }
                    .skeleton-grid { grid-template-columns: repeat(3, 1fr); }
                }
                @media (max-width: 640px) {
                    .skeleton-grid { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
            <div className="skeleton-header">
                <div className="skeleton-breadcrumb" />
                <div className="skeleton-title" />
            </div>
            <div className="skeleton-content">
                <aside className="skeleton-sidebar">
                    <div className="skeleton-filter" />
                    <div className="skeleton-filter" />
                    <div className="skeleton-filter" />
                </aside>
                <main className="skeleton-main">
                    <div className="skeleton-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="skeleton-card">
                                <div className="skeleton-image" />
                                <div className="skeleton-text">
                                    <div className="skeleton-line" />
                                    <div className="skeleton-line" />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
