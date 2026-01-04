import { Response } from 'express';
import OpenAI from 'openai';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, AppError } from '../middleware/validation';
import Product from '../models/Product';
import Store from '../models/Store';
import Page from '../models/Page';
import BlogPost from '../models/BlogPost';
import Currency from '../models/Currency';
import ChatHistory from '../models/ChatHistory';
import Cart from '../models/Cart';
import Order from '../models/Order';
import UserInterest from '../models/UserInterest';
import Customer from '../models/Customer';

/**
 * Get chat history for a user or session
 * GET /api/ai/history
 */
export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { storeId, sessionId } = req.query;
    const userId = req.user?.id;

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    if (!userId && !sessionId) {
        throw new AppError('Either userId or sessionId is required', 400);
    }

    const chatHistory = await ChatHistory.findOne(
        userId ? { storeId, userId } : { storeId, sessionId }
    ).lean();

    if (!chatHistory) {
        return res.json({
            success: true,
            messages: []
        });
    }

    return res.json({
        success: true,
        messages: chatHistory.messages
    });
});

/**
 * Handle AI Chat requests
 * POST /api/ai/chat
 */
export const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { message, storeId, sessionId } = req.body;
    const selectedCurrencyCode = req.headers['x-currency'] as string || 'USD';
    const userId = req.user?.id; // From auth middleware if logged in

    if (!message) {
        throw new AppError('Message is required', 400);
    }

    if (!storeId) {
        throw new AppError('storeId is required', 400);
    }

    if (!userId && !sessionId) {
        throw new AppError('Either userId or sessionId is required', 400);
    }

    // Fetch store info
    const store = await Store.findById(storeId);
    if (!store) {
        throw new AppError('Store not found', 404);
    }

    // Check if AI is enabled for this store
    const aiEnabled = store.settings?.aiSettings?.enabled || false;
    const storeApiKey = store.settings?.aiSettings?.openaiKey;

    if (!aiEnabled || !storeApiKey) {
        throw new AppError('AI Assistant is not enabled or configured for this store', 403);
    }

    // Get store domain for absolute URLs
    const domain = store.domain || 'demostore.com';
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${domain}`;

    // Get currency info
    const allCurrencies = await Currency.find({ isActive: true }).lean();
    const selectedCurrency = allCurrencies.find(c => c.code === selectedCurrencyCode) || allCurrencies.find(c => c.isBaseCurrency);
    const currencySymbol = selectedCurrency?.symbol || '$';
    const exchangeRate = selectedCurrency?.exchangeRate || 1;

    // Load or create chat history
    let chatHistory = await ChatHistory.findOne(
        userId ? { storeId, userId } : { storeId, sessionId }
    );

    if (!chatHistory) {
        chatHistory = new ChatHistory({
            storeId,
            userId,
            sessionId,
            messages: []
        });
    }

    // Fetch User Interests for personalization
    const userInterestsData = await UserInterest.findOne(
        userId ? { storeId, userId } : { storeId, sessionId }
    ).populate('viewedProducts.categoryIds', 'title');

    let interestSummary = '';
    if (userInterestsData) {
        const categories = new Set<string>();
        userInterestsData.viewedProducts.forEach(vp => {
            vp.categoryIds.forEach((cat: any) => categories.add(cat.title));
        });

        const recentSearches = userInterestsData.searchQueries
            .sort((a, b) => b.searchedAt.getTime() - a.searchedAt.getTime())
            .slice(0, 5)
            .map(s => s.query);

        interestSummary = `
User Interests context:
- Interested categories: ${Array.from(categories).join(', ') || 'General'}
- Recent searches: ${recentSearches.join(', ') || 'None'}
`;
    }

    // Instantiate OpenAI with store-specific key
    const openai = new OpenAI({
        apiKey: storeApiKey,
    });

    // Define functions for dynamic data access
    const functions = [
        // Search products dynamically
        {
            name: "searchProducts",
            description: "Search for products by name, category, brand, or price range. Use this when user asks about specific products.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Search query for product name or description"
                    },
                    minPrice: {
                        type: "number",
                        description: "Minimum price filter"
                    },
                    maxPrice: {
                        type: "number",
                        description: "Maximum price filter"
                    },
                    category: {
                        type: "string",
                        description: "Filter by category name"
                    },
                    brand: {
                        type: "string",
                        description: "Filter by brand name"
                    },
                    limit: {
                        type: "number",
                        description: "Number of results to return (default 10, max 20)"
                    }
                }
            }
        },
        {
            name: "getProductDetails",
            description: "Get detailed information about a specific product by its slug or name",
            parameters: {
                type: "object",
                properties: {
                    productSlug: {
                        type: "string",
                        description: "Product slug or name"
                    }
                },
                required: ["productSlug"]
            }
        },
        {
            name: "searchPages",
            description: "Search static pages (About, Contact, FAQ, etc.) for information",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Search query for page title or content"
                    }
                }
            }
        },
        {
            name: "searchBlogPosts",
            description: "Search blog posts by title, content, or tags",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Search query for blog post title or content"
                    },
                    limit: {
                        type: "number",
                        description: "Number of results to return (default 5, max 10)"
                    }
                }
            }
        },
        // User-specific functions (only if logged in)
        ...(userId ? [
            {
                name: "getUserCart",
                description: "Get items currently in the user's cart",
                parameters: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "getUserOrders",
                description: "Get user's order history with optional date filtering",
                parameters: {
                    type: "object",
                    properties: {
                        startDate: {
                            type: "string",
                            description: "Start date in ISO format (YYYY-MM-DD)"
                        },
                        endDate: {
                            type: "string",
                            description: "End date in ISO format (YYYY-MM-DD)"
                        }
                    }
                }
            },
            {
                name: "getUserWishlist",
                description: "Get items in the user's wishlist",
                parameters: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        ] : [])
    ];

    const systemPrompt = `You are a helpful, senior AI shopping assistant for "${store.name}".
Your goal is to provide a premium, concierge-like experience for customers.

Current Store URL: ${baseUrl}
Current Currency: ${selectedCurrencyCode} (${currencySymbol})

${interestSummary}

INTEREST GUIDANCE:
If "User Interests context" is provided above, use it to proactively suggest relevant products or offer help in those categories, even if the user hasn't explicitly asked for them yet. 
For example, if they were looking at "Smartphones" and say "hi", you might reply "Hi! I noticed you were exploring our smartphone collection recently. We have some great new deals in that category. How can I help you today?".

${userId ? 'The user is logged in.' : 'The user is a guest. Remind them gently that logging in allows for more personalized recommendations and access to their cart/orders if they ask for advice.'}

CORE CAPABILITIES:
1. Product Discovery: Use searchProducts to find items based on any criteria.
2. Product Details: Use getProductDetails to get full information for a specific product.
3. User Data: Use getUserCart, getUserOrders, and getUserWishlist to provide personalized service for logged-in users.
4. Information: Use searchPages and searchBlogPosts to answer general questions about store policies, news, or advice.

URL PATTERNS (Use these exact formats when providing links):
- Products: ${baseUrl}/product/[product-slug]
- Categories: ${baseUrl}/category/[category-slug]
- Static Pages: ${baseUrl}/page/[page-slug]
- Blog Posts: ${baseUrl}/blog/[post-slug]
- Blog Categories: ${baseUrl}/blog/category/[category-slug]

GUIDELINES:
1. Always use absolute URLs by prefixing relative paths with ${baseUrl}.
2. Return responses using Markdown for better readability.
3. When suggesting products, categories, pages, or blog posts, use their absolute URLs in markdown format: [Name](URL).
4. Be proactive and polite. If a search returns no results, suggest similar categories or broader criteria.
5. Use the provided user interests to make your service feel tailored and insightful.
6. IMPORTANT: When using functions, always wait for the results before giving your final answer.
7. Don't mention that you are an AI or that you're using functions unless it's necessary for clarity.`;

    // Add user message to history
    chatHistory.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
    });

    // Prepare conversation messages (last 20 for context)
    const conversationHistory = chatHistory.messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content
    }));

    try {
        // Enable streaming for better UX
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                ...conversationHistory
            ],
            functions: functions.length > 0 ? functions : undefined,
            function_call: functions.length > 0 ? "auto" : undefined,
            temperature: 0.7,
            max_tokens: 500,
            stream: true, // Enable streaming
        });

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

        let fullContent = '';
        let functionCallData: any = null;

        // Stream the response
        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;

            // Check for function call
            if (delta.function_call) {
                if (!functionCallData) {
                    functionCallData = {
                        name: delta.function_call.name || '',
                        arguments: delta.function_call.arguments || ''
                    };
                } else {
                    functionCallData.arguments += delta.function_call.arguments || '';
                }
            }

            // Stream content
            if (delta.content) {
                fullContent += delta.content;
                res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
                // Flush the response to ensure it's sent immediately (needed for compression middleware)
                if ((res as any).flush) {
                    (res as any).flush();
                }
            }
        }

        // Handle function call if detected
        if (functionCallData && functionCallData.name) {
            // Send function call indicator to frontend
            res.write(`data: ${JSON.stringify({ type: 'function_call', name: functionCallData.name })}\n\n`);
            if ((res as any).flush) {
                (res as any).flush();
            }

            const functionName = functionCallData.name;
            const functionArgs = JSON.parse(functionCallData.arguments || '{}');

            let functionResult: any = null;

            // Execute the requested function
            if (functionName === 'searchProducts') {
                const query: any = { storeId, isActive: true };
                const limit = Math.min(functionArgs.limit || 10, 20);

                // Build search query
                if (functionArgs.query) {
                    query.$or = [
                        { name: { $regex: functionArgs.query, $options: 'i' } },
                        { description: { $regex: functionArgs.query, $options: 'i' } }
                    ];
                }

                if (functionArgs.minPrice || functionArgs.maxPrice) {
                    query.price = {};
                    if (functionArgs.minPrice) query.price.$gte = functionArgs.minPrice / exchangeRate;
                    if (functionArgs.maxPrice) query.price.$lte = functionArgs.maxPrice / exchangeRate;
                }

                const products = await Product.find(query)
                    .populate('brand', 'name')
                    .limit(limit)
                    .select('name slug price salePrice stockStatus brand description')
                    .lean();

                functionResult = products.map(p => ({
                    name: p.name,
                    price: `${currencySymbol}${((p.salePrice || p.price) * exchangeRate).toLocaleString()}`,
                    brand: (p.brand as any)?.name,
                    status: p.stockStatus,
                    url: `${baseUrl}/product/${p.slug}`,
                    description: p.description?.substring(0, 150) + '...'
                }));

            } else if (functionName === 'getProductDetails') {
                const product = await Product.findOne({
                    storeId,
                    $or: [
                        { slug: functionArgs.productSlug },
                        { name: { $regex: functionArgs.productSlug, $options: 'i' } }
                    ]
                })
                    .populate('brand', 'name')
                    .populate('categoryIds', 'name')
                    .lean();

                if (product) {
                    functionResult = {
                        name: product.name,
                        price: `${currencySymbol}${((product.salePrice || product.price) * exchangeRate).toLocaleString()}`,
                        brand: (product.brand as any)?.name,
                        categories: (product.categoryIds as any[])?.map(c => c.name).join(', '),
                        status: product.stockStatus,
                        description: product.description,
                        url: `${baseUrl}/product/${product.slug}`,
                        sku: product.sku,
                        images: product.images
                    };
                } else {
                    functionResult = null;
                }

            } else if (functionName === 'searchPages') {
                const query: any = { storeId, status: 'published' };

                if (functionArgs.query) {
                    query.$or = [
                        { title: { $regex: functionArgs.query, $options: 'i' } },
                        { content: { $regex: functionArgs.query, $options: 'i' } }
                    ];
                }

                const pages = await Page.find(query)
                    .limit(5)
                    .select('title slug content')
                    .lean();

                functionResult = pages.map(p => ({
                    title: p.title,
                    url: `${baseUrl}/page/${p.slug}`,
                    content: p.content?.replace(/<[^>]*>/g, '').substring(0, 300) + '...'
                }));

            } else if (functionName === 'searchBlogPosts') {
                const query: any = { storeId, status: 'published' };
                const limit = Math.min(functionArgs.limit || 5, 10);

                if (functionArgs.query) {
                    query.$or = [
                        { title: { $regex: functionArgs.query, $options: 'i' } },
                        { content: { $regex: functionArgs.query, $options: 'i' } },
                        { tags: { $regex: functionArgs.query, $options: 'i' } }
                    ];
                }

                const blogs = await BlogPost.find(query)
                    .sort({ publishedAt: -1 })
                    .limit(limit)
                    .select('title slug excerpt publishedAt')
                    .lean();

                functionResult = blogs.map(b => ({
                    title: b.title,
                    url: `${baseUrl}/blog/${b.slug}`,
                    excerpt: b.excerpt,
                    publishedAt: b.publishedAt
                }));

            } else if (functionName === 'getUserCart') {
                const cartFilter: any = userId ? { userId, storeId } : { sessionId, storeId };
                const cart = await Cart.findOne(cartFilter)
                    .populate('items.productId', 'name slug price salePrice')
                    .lean();
                functionResult = cart?.items.map(item => ({
                    product: (item.productId as any)?.name || item.name,
                    quantity: item.quantity,
                    price: `${currencySymbol}${((item.productId as any)?.salePrice || (item.productId as any)?.price || item.price || 0) * exchangeRate}`
                })) || [];
            } else if (functionName === 'getUserOrders') {
                const query: any = { customerId: userId, storeId };
                if (functionArgs.startDate || functionArgs.endDate) {
                    query.createdAt = {};
                    if (functionArgs.startDate) query.createdAt.$gte = new Date(functionArgs.startDate);
                    if (functionArgs.endDate) query.createdAt.$lte = new Date(functionArgs.endDate);
                }
                const orders = await Order.find(query)
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .select('orderNumber total status createdAt currency exchangeRate')
                    .lean();
                functionResult = orders.map(o => {
                    const orderCurrency = allCurrencies.find(c => c.code === o.currency);
                    const orderSymbol = orderCurrency?.symbol || o.currency || '$';
                    return {
                        orderNumber: o.orderNumber,
                        total: `${orderSymbol}${o.total.toFixed(2)}`,
                        status: o.status,
                        date: o.createdAt,
                        currency: o.currency
                    };
                });
            } else if (functionName === 'getUserWishlist') {
                // Assuming wishlist is stored in Customer model
                const customer = await Customer.findById(userId)
                    .populate('wishlist', 'name slug price salePrice')
                    .lean();
                functionResult = customer?.wishlist?.map((p: any) => ({
                    product: p.name,
                    price: `${currencySymbol}${((p.salePrice || p.price) * exchangeRate).toLocaleString()}`,
                    url: `${baseUrl}/product/${p.slug}`
                })) || [];
            }

            // Make a second call with the function result, also with streaming
            const secondStream = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    ...conversationHistory,
                    {
                        role: "assistant",
                        content: null,
                        function_call: {
                            name: functionName,
                            arguments: functionCallData.arguments
                        }
                    },
                    {
                        role: "function",
                        name: functionName,
                        content: JSON.stringify(functionResult)
                    }
                ],
                temperature: 0.7,
                max_tokens: 500,
                stream: true,
            });

            let finalContent = '';
            // Stream the second response
            for await (const chunk of secondStream) {
                const delta = chunk.choices[0]?.delta;
                if (delta.content) {
                    finalContent += delta.content;
                    res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
                    if ((res as any).flush) {
                        (res as any).flush();
                    }
                }
            }

            // Save AI response to history
            chatHistory.messages.push({
                role: 'assistant',
                content: finalContent,
                timestamp: new Date()
            });

            await chatHistory.save();

            // Send done signal
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            if ((res as any).flush) {
                (res as any).flush();
            }
            res.end();
        } else {
            // No function call - fullContent already contains the message
            // Save AI response to history
            chatHistory.messages.push({
                role: 'assistant',
                content: fullContent,
                timestamp: new Date()
            });

            await chatHistory.save();

            // Send done signal
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            if ((res as any).flush) {
                (res as any).flush();
            }
            res.end();
        }
    } catch (error: any) {
        console.error('OpenAI API Error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to get response from AI' })}\n\n`);
        res.end();
    }
});
