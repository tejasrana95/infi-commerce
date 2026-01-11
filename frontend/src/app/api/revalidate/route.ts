import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * On-Demand Revalidation API
 * Allows backend to purge Next.js cache when content is updated
 * 
 * Usage:
 * POST /api/revalidate?secret=YOUR_SECRET
 * Body: { type: 'product', slug: 'product-slug' }
 */
export async function POST(request: NextRequest) {
    const secret = request.nextUrl.searchParams.get('secret');

    // Verify secret token
    if (secret !== process.env.REVALIDATION_SECRET) {
        return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { type, slug, path, tag } = body;

        switch (type) {
            case 'product':
                // Revalidate specific product
                if (slug) {
                    revalidateTag(`product-${slug}`, 'page');
                    revalidatePath(`/product/${slug}`, 'page');
                }
                // Revalidate product listings (homepage, categories)
                revalidatePath('/', 'page');
                revalidatePath('/category/[slug]', 'page');
                break;

            case 'category':
                if (slug) {
                    revalidatePath(`/category/${slug}`, 'page');
                }
                revalidatePath('/', 'page');
                break;

            case 'page':
                if (slug) {
                    revalidatePath(`/page/${slug}`, 'page');
                }
                break;

            case 'blog':
                if (slug) {
                    revalidatePath(`/blog/${slug}`, 'page');
                }
                revalidatePath('/blog', 'page');
                break;

            case 'homepage':
                revalidatePath('/', 'page');
                break;

            case 'layout':
                // Revalidate all pages using this layout
                if (path) {
                    revalidatePath(path, 'page');
                }
                break;

            default:
                // Generic revalidation by tag or path
                if (tag) {
                    revalidateTag(tag, 'page');
                }
                if (path) {
                    revalidatePath(path, 'page');
                }
        }

        return NextResponse.json({
            revalidated: true,
            timestamp: Date.now(),
            type,
            slug
        });
    } catch (err: any) {
        return NextResponse.json(
            { message: 'Error revalidating', error: err.message },
            { status: 500 }
        );
    }
}
