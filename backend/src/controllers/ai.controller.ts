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
import { addTimezoneAwareDates } from '../utils/date.utils';

// Maximum iterations for tool call loops to prevent infinite loops
const MAX_TOOL_ITERATIONS = 5;

// ============================================================================
// Types
// ============================================================================

interface ToolResult {
    id: string;
    data: any;
}

interface ChatContext {
    storeId: string;
    userId?: string;
    sessionId?: string;
    baseUrl: string;
    currencySymbol: string;
    exchangeRate: number;
    allCurrencies: any[];
    timezone: string;
}

// ============================================================================
// Tool Definitions
// ============================================================================

function getToolDefinitions(userId?: string): OpenAI.Chat.ChatCompletionTool[] {
    const baseTools: OpenAI.Chat.ChatCompletionTool[] = [
        {
            type: "function",
            function: {
                name: "searchProducts",
                description: "Search for products by name, category, brand, or price range. Use this when user asks about specific products.",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Search query for product name or description" },
                        minPrice: { type: "number", description: "Minimum price filter" },
                        maxPrice: { type: "number", description: "Maximum price filter" },
                        category: { type: "string", description: "Filter by category name" },
                        brand: { type: "string", description: "Filter by brand name" },
                        limit: { type: "number", description: "Number of results to return (default 10, max 20)" }
                    }
                }
            }
        },
        {
            type: "function",
            function: {
                name: "getProductDetails",
                description: "Get detailed information about a specific product by its slug or name",
                parameters: {
                    type: "object",
                    properties: {
                        productSlug: { type: "string", description: "Product slug or name" }
                    },
                    required: ["productSlug"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "searchPages",
                description: "Search static pages (About, Contact, FAQ, etc.) for information",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Search query for page title or content" }
                    }
                }
            }
        },
        {
            type: "function",
            function: {
                name: "searchBlogPosts",
                description: "Search blog posts by title, content, or tags",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "Search query for blog post title or content" },
                        limit: { type: "number", description: "Number of results to return (default 5, max 10)" }
                    }
                }
            }
        },
        {
            type: "function",
            function: {
                name: "getUserCart",
                description: "Get items currently in the user's cart",
                parameters: { type: "object", properties: {} }
            }
        },
        {
            type: "function",
            function: {
                name: "addToCart",
                description: "Add a product to the user's shopping cart",
                parameters: {
                    type: "object",
                    properties: {
                        productSlug: { type: "string", description: "Product slug or exact name" },
                        quantity: { type: "number", description: "Quantity to add (default 1)" },
                        variantId: { type: "string", description: "Optional variant ID if applicable" }
                    },
                    required: ["productSlug"]
                }
            }
        }
    ];

    // Add user-specific tools for logged-in users
    if (userId) {
        baseTools.push(
            {
                type: "function",
                function: {
                    name: "getUserOrders",
                    description: "Get user's order history with optional date filtering",
                    parameters: {
                        type: "object",
                        properties: {
                            startDate: { type: "string", description: "Start date in ISO format (YYYY-MM-DD)" },
                            endDate: { type: "string", description: "End date in ISO format (YYYY-MM-DD)" }
                        }
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "getUserWishlist",
                    description: "Get items in the user's wishlist",
                    parameters: { type: "object", properties: {} }
                }
            }
        );
    }

    return baseTools;
}

// ============================================================================
// Tool Executors
// ============================================================================

async function executeToolCall(
    toolCall: any,
    context: ChatContext
): Promise<ToolResult> {
    const { storeId, userId, sessionId, baseUrl, currencySymbol, exchangeRate, allCurrencies, timezone } = context;
    const functionName = toolCall.function?.name || '';
    const args = JSON.parse(toolCall.function?.arguments || '{}');

    let data: any = null;

    switch (functionName) {
        case 'searchProducts': {
            const query: any = { storeId, isActive: true };
            const limit = Math.min(args.limit || 10, 20);

            if (args.query) {
                query.$or = [
                    { name: { $regex: args.query, $options: 'i' } },
                    { description: { $regex: args.query, $options: 'i' } }
                ];
            }

            if (args.minPrice || args.maxPrice) {
                query.price = {};
                if (args.minPrice) query.price.$gte = args.minPrice / exchangeRate;
                if (args.maxPrice) query.price.$lte = args.maxPrice / exchangeRate;
            }

            const products = await Product.find(query)
                .populate('brand', 'name')
                .limit(limit)
                .select('name slug price salePrice stockStatus brand description')
                .lean();

            data = products.map(p => ({
                name: p.name,
                price: `${currencySymbol}${((p.salePrice || p.price) * exchangeRate).toLocaleString()}`,
                brand: (p.brand as any)?.name,
                status: p.stockStatus,
                url: `${baseUrl}/product/${p.slug}`,
                description: p.description?.substring(0, 150) + '...'
            }));
            break;
        }

        case 'getProductDetails': {
            const product = await Product.findOne({
                storeId,
                $or: [
                    { slug: args.productSlug },
                    { name: { $regex: args.productSlug, $options: 'i' } }
                ]
            })
                .populate('brand', 'name')
                .populate('categoryIds', 'name')
                .lean();

            if (product) {
                data = {
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
            }
            break;
        }

        case 'searchPages': {
            const query: any = { storeId, status: 'published' };
            if (args.query) {
                query.$or = [
                    { title: { $regex: args.query, $options: 'i' } },
                    { content: { $regex: args.query, $options: 'i' } }
                ];
            }
            const pages = await Page.find(query)
                .limit(5)
                .select('title slug content')
                .lean();

            data = pages.map(p => ({
                title: p.title,
                url: `${baseUrl}/page/${p.slug}`,
                content: p.content?.replace(/<[^>]*>/g, '').substring(0, 300) + '...'
            }));
            break;
        }

        case 'searchBlogPosts': {
            const query: any = { storeId, status: 'published' };
            const limit = Math.min(args.limit || 5, 10);
            if (args.query) {
                query.$or = [
                    { title: { $regex: args.query, $options: 'i' } },
                    { content: { $regex: args.query, $options: 'i' } },
                    { tags: { $regex: args.query, $options: 'i' } }
                ];
            }
            const blogs = await BlogPost.find(query)
                .sort({ publishedAt: -1 })
                .limit(limit)
                .select('title slug excerpt publishedAt')
                .lean();

            data = blogs.map(b => ({
                title: b.title,
                url: `${baseUrl}/blog/${b.slug}`,
                excerpt: b.excerpt,
                publishedAt: b.publishedAt
            }));
            break;
        }

        case 'addToCart': {
            const product = await Product.findOne({
                storeId,
                $or: [
                    { slug: args.productSlug },
                    { name: { $regex: args.productSlug, $options: 'i' } }
                ]
            });

            if (!product) {
                data = { error: 'Product not found' };
                break;
            }

            if (product.type === 'variable') {
                data = {
                    success: false,
                    message: 'This is a variable product with multiple options. Please visit the product page to select your options.',
                    productUrl: `${baseUrl}/product/${product.slug}`,
                    isVariable: true
                };
                break;
            }

            const cartFilter: any = userId ? { userId, storeId } : { sessionId, storeId };
            let cart = await Cart.findOne(cartFilter);

            if (!cart) {
                cart = new Cart({
                    storeId,
                    userId: userId || undefined,
                    sessionId: userId ? undefined : sessionId,
                    items: []
                });
            }

            const quantity = args.quantity || 1;
            const existingItem = cart.items.find(i =>
                i.productId.toString() === product._id.toString() &&
                (!args.variantId || i.variantId === args.variantId)
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({
                    productId: product._id as any,
                    variantId: args.variantId,
                    name: product.name,
                    sku: product.sku,
                    price: product.salePrice || product.price,
                    quantity,
                    image: product.images?.[0]
                });
            }

            await cart.save();

            data = {
                success: true,
                message: `Added ${quantity} x ${product.name} to cart`,
                cartItemCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
                total: `${currencySymbol}${((cart.total || 0) * exchangeRate).toLocaleString()}`
            };
            break;
        }

        case 'getUserCart': {
            const cartFilter: any = userId ? { userId, storeId } : { sessionId, storeId };
            const cart = await Cart.findOne(cartFilter)
                .populate('items.productId', 'name slug price salePrice')
                .lean();

            data = cart?.items.map(item => ({
                product: (item.productId as any)?.name || item.name,
                quantity: item.quantity,
                price: `${currencySymbol}${((item.productId as any)?.salePrice || (item.productId as any)?.price || item.price || 0) * exchangeRate}`
            })) || [];
            break;
        }

        case 'getUserOrders': {
            const query: any = { customerId: userId, storeId };
            if (args.startDate || args.endDate) {
                query.createdAt = {};
                if (args.startDate) query.createdAt.$gte = new Date(args.startDate);
                if (args.endDate) query.createdAt.$lte = new Date(args.endDate);
            }
            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .limit(10)
                .select('orderNumber total status createdAt updatedAt currency exchangeRate')
                .lean();

            data = orders.map(o => {
                // Apply timezone conversion
                const localizedOrder = addTimezoneAwareDates(o, timezone, ['createdAt', 'updatedAt']);

                const orderCurrency = allCurrencies.find(c => c.code === o.currency);
                const orderSymbol = orderCurrency?.symbol || o.currency || '$';
                const orderTotal = (o.total * (o.exchangeRate || 1)).toFixed(2);

                return {
                    orderNumber: o.orderNumber,
                    total: `${orderSymbol}${orderTotal.toLocaleString()}`,
                    status: o.status,
                    date: o.createdAt,
                    orderedAt: localizedOrder.createdAtLocal,
                    lastUpdated: localizedOrder.updatedAtLocal,
                    timezone: localizedOrder.createdAtTimezone,
                    offset: localizedOrder.createdAtOffset,
                    currency: o.currency
                };
            });
            break;
        }

        case 'getUserWishlist': {
            const customer = await Customer.findById(userId)
                .populate('wishlist', 'name slug price salePrice')
                .lean();

            data = customer?.wishlist?.map((p: any) => ({
                product: p.name,
                price: `${currencySymbol}${((p.salePrice || p.price) * exchangeRate).toLocaleString()}`,
                url: `${baseUrl}/product/${p.slug}`
            })) || [];
            break;
        }

        default:
            data = { error: `Unknown function: ${functionName}` };
    }

    return { id: toolCall.id, data };
}

// ============================================================================
// Message Formatting Helpers
// ============================================================================

function buildSystemPrompt(store: any, baseUrl: string, currencyCode: string, currencySymbol: string, interestSummary: string, userId?: string): string {
    return `You are a helpful, senior AI shopping assistant for "${store.name}".
Your goal is to provide a premium, concierge-like experience for customers.

Current Store URL: ${baseUrl}
Current Currency: ${currencyCode} (${currencySymbol})

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
- Login: ${baseUrl}/login
- Sign Up: ${baseUrl}/register
- Forgot Password: ${baseUrl}/forgot-password
- Cart: ${baseUrl}/cart
- Account: ${baseUrl}/account
- Orders: ${baseUrl}/account/orders
- Profile: ${baseUrl}/account/profile
- Addresses: ${baseUrl}/account/addresses
- Wishlist: ${baseUrl}/wishlist
- Products: ${baseUrl}/product/[product-slug]
- Categories: ${baseUrl}/category/[category-slug]
- Static Pages: ${baseUrl}/page/[page-slug]
- Blog Posts: ${baseUrl}/blog/[post-slug]
- Blog Categories: ${baseUrl}/blog/category/[category-slug]
- Checkout: ${baseUrl}/checkout

GUIDELINES:
1. Always use absolute URLs by prefixing relative paths with ${baseUrl}.
2. Return responses using Markdown for better readability.
3. When suggesting products, categories, pages, or blog posts, use their absolute URLs in markdown format: [Name](URL).
4. Be proactive and polite. If a search returns no results, suggest similar categories or broader criteria.
5. Use the provided user interests to make your service feel tailored and insightful.
6. IMPORTANT: When using functions, always wait for the results before giving your final answer.
7. Don't mention that you are an AI or that you're using functions unless it's necessary for clarity.
8. CHECKOUT: You CANNOT perform checkout, shipping, or payment entry. If the user wants to checkout, provide the [Checkout Link](${baseUrl}/checkout) and wish them a smooth process. Do NOT ask for address or payment details instead say since this is important and for your privacy and data protect I can not perform checkout, shipping, or payment entry. It is always better to do it by yourself for your security and data protection.
9. CATEGORIES: Do not guess category URLs. If the user asks for a category (e.g. "Accessories"), use searchProducts or category search to find relevant items or category instead of guessing a /category/accessories link that might not exist.
10. When you add anything in cart on behalf of user then just say after successful addition "Added to cart successfully. Please refresh the page to see the cart items." and suggest some more product related to what you add in cart or from userinterests but not the same which already added in cart.
11. If variable product then do not add to cart instead give the link of product page and say that please feel free to explore product option and then add to cart by clicking on add to cart button.
12. CRITICAL: Do NOT use paths like /page/login, /page/register, /page/cart, etc. incorrectly. Use exactly /login, /register, /cart, /account as defined in URL PATTERNS.
13. TIMEZONES: When providing order status, always use the 'orderedAt' and 'lastUpdated' fields (which are in the store's local timezone) instead of the raw UTC 'date' field. Mention the timezone/offset (e.g., EST, IST) if helpful for clarity. Similarly, for products, use the localized date fields if available.`;
}

function formatHistoryForOpenAI(messages: any[]): OpenAI.Chat.ChatCompletionMessageParam[] {
    const recentMessages = messages.slice(-20);

    // Ensure we don't start with a 'tool' message (orphan) which causes OpenAI 400 error
    // This happens if the slice cuts off the preceding assistant message requesting the tool
    while (recentMessages.length > 0 && recentMessages[0].role === 'tool') {
        recentMessages.shift();
    }

    return recentMessages.map(m => {
        if (m.role === 'tool') {
            return {
                role: 'tool' as const,
                content: m.content || '',
                tool_call_id: m.tool_call_id || ''
            };
        }

        const msg: any = {
            role: m.role,
            content: m.content || ''
        };

        // Only include tool_calls if it's a non-empty array
        if (m.tool_calls && Array.isArray(m.tool_calls) && m.tool_calls.length > 0) {
            msg.tool_calls = m.tool_calls;
            // When tool_calls are present, content should be null per OpenAI spec
            msg.content = null;
        }

        return msg;
    });
}

// ============================================================================
// API Endpoints
// ============================================================================

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

    // Filter out tool messages and assistant messages with tool calls (internal steps)
    const messages = chatHistory.messages.filter((m: any) =>
        m.role !== 'tool' &&
        !(m.role === 'assistant' && (m.tool_calls?.length > 0 || !m.content))
    );

    return res.json({
        success: true,
        messages
    });
});

/**
 * Handle AI Chat requests
 * POST /api/ai/chat
 * 
 * Uses a hybrid approach:
 * - Non-streaming for tool call detection and execution
 * - Streaming for final content delivery
 */
export const chat = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { message, storeId, sessionId } = req.body;
    const selectedCurrencyCode = req.headers['x-currency'] as string || 'USD';
    const userId = req.user?.id;

    // Validate inputs
    if (!message) throw new AppError('Message is required', 400);
    if (!storeId) throw new AppError('storeId is required', 400);
    if (!userId && !sessionId) throw new AppError('Either userId or sessionId is required', 400);

    // Fetch store and validate AI settings
    const store = await Store.findById(storeId);
    if (!store) throw new AppError('Store not found', 404);

    const aiEnabled = store.settings?.aiSettings?.enabled || false;
    const storeApiKey = store.settings?.aiSettings?.openaiKey;
    if (!aiEnabled || !storeApiKey) {
        throw new AppError('AI Assistant is not enabled or configured for this store', 403);
    }

    // Build context
    const domain = store.domains?.[0] || 'demostore.com';
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${domain}`;

    const allCurrencies = await Currency.find({ isActive: true }).lean();
    const selectedCurrency = allCurrencies.find(c => c.code === selectedCurrencyCode) || allCurrencies.find(c => c.isBaseCurrency);
    const currencySymbol = selectedCurrency?.symbol || '$';
    const exchangeRate = selectedCurrency?.exchangeRate || 1;

    const context: ChatContext = {
        storeId,
        userId,
        sessionId,
        baseUrl,
        currencySymbol,
        exchangeRate,
        allCurrencies,
        timezone: store.timezone || 'UTC'
    };

    // Load or create chat history
    let chatHistory = await ChatHistory.findOne(
        userId ? { storeId, userId } : { storeId, sessionId }
    );

    if (!chatHistory) {
        chatHistory = new ChatHistory({ storeId, userId, sessionId, messages: [] });
    }

    // Fetch user interests for personalization
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

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: storeApiKey });
    const model = store.settings?.aiSettings?.model || 'gpt-4o-mini';
    const isReasoningModel = model.startsWith('o1') || model.startsWith('o3') || model.startsWith('gpt-5');
    const tools = getToolDefinitions(userId);
    const systemPrompt = buildSystemPrompt(store, baseUrl, selectedCurrencyCode, currencySymbol, interestSummary, userId);

    // Add user message to history
    chatHistory.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date()
    });

    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
        // Build messages for OpenAI
        let currentMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            { role: isReasoningModel ? 'developer' : 'system', content: systemPrompt } as any,
            ...formatHistoryForOpenAI(chatHistory.messages)
        ];

        // Tool call loop - iterate until we get a final response or hit max iterations
        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
            let response;
            try {
                // Make non-streaming call to detect tool calls
                response = await openai.chat.completions.create({
                    model,
                    messages: currentMessages,
                    tools: tools.length > 0 ? tools : undefined,
                    tool_choice: tools.length > 0 ? 'auto' : undefined,
                    ...(isReasoningModel ? { max_completion_tokens: 4096 } : { max_tokens: 4096, temperature: 0.7 })
                });
            } catch (apiError: any) {
                console.error('OpenAI API call failed:', apiError.message);
                res.write(`data: ${JSON.stringify({ type: 'error', message: apiError.message })}\n\n`);
                res.end();
                return;
            }

            const choice = response.choices[0];
            const assistantMessage = choice.message;

            // Check if we need to execute tool calls
            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
                // Notify client about function calls
                for (const tc of assistantMessage.tool_calls) {
                    res.write(`data: ${JSON.stringify({ type: 'function_call', name: (tc as any).function?.name })}\n\n`);
                    if ((res as any).flush) (res as any).flush();
                }

                // Execute all tool calls in parallel
                const toolResults = await Promise.all(
                    assistantMessage.tool_calls.map(tc => executeToolCall(tc, context))
                );

                // Add assistant message with tool_calls to conversation
                currentMessages.push({
                    role: 'assistant',
                    content: null,
                    tool_calls: assistantMessage.tool_calls
                } as any);

                // Save to history
                chatHistory.messages.push({
                    role: 'assistant',
                    content: '',
                    timestamp: new Date(),
                    tool_calls: assistantMessage.tool_calls
                });

                // Add tool results to conversation
                for (const result of toolResults) {
                    const toolMessage: OpenAI.Chat.ChatCompletionToolMessageParam = {
                        role: 'tool',
                        tool_call_id: result.id,
                        content: JSON.stringify(result.data)
                    };
                    currentMessages.push(toolMessage);

                    // Save to history
                    chatHistory.messages.push({
                        role: 'tool',
                        tool_call_id: result.id,
                        content: JSON.stringify(result.data),
                        timestamp: new Date()
                    });
                }

                // Continue loop to get next response
                continue;
            }

            // No tool calls - stream the final response
            const finalContent = assistantMessage.content || '';

            // Stream content in chunks for better UX
            const chunkSize = 10;
            for (let i = 0; i < finalContent.length; i += chunkSize) {
                const chunk = finalContent.substring(i, i + chunkSize);
                res.write(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`);
                if ((res as any).flush) (res as any).flush();
                // Small delay to simulate streaming effect
                await new Promise(resolve => setTimeout(resolve, 20));
            }

            // Save final assistant response to history
            chatHistory.messages.push({
                role: 'assistant',
                content: finalContent,
                timestamp: new Date()
            });

            // Exit the loop
            break;
        }

        // Save chat history
        await chatHistory.save();

        // Send done signal
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        if ((res as any).flush) (res as any).flush();
        res.end();

    } catch (error: any) {
        console.error('OpenAI API Error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || 'Failed to get response from AI' })}\n\n`);
        res.end();
    }
});
