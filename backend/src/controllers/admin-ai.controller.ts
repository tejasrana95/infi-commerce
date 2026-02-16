import { Request, Response } from 'express';
import OpenAI from 'openai';
import Setting from '../models/Setting';
import Store from '../models/Store';
import { asyncHandler, AppError } from '../middleware/validation';

const getOpenAIClient = async () => {
    const settings = await Setting.findOne({ key: 'adminAiSettings' });
    if (!settings || !settings.value.enabled || !settings.value.openaiKey) {
        throw new AppError('AI Assistant is not configured or enabled', 400);
    }
    return {
        client: new OpenAI({ apiKey: settings.value.openaiKey }),
        model: settings.value.model || 'gpt-4o-mini'
    };
};

/**
 * @swagger
 * /api/ai/admin/generate:
 *   post:
 *     summary: Generate content for admin entities
 *     tags: [AI]
 */
export const generateContent = asyncHandler(async (req: Request, res: Response) => {
    const { context, fields, instructions } = req.body;
    const { client, model } = await getOpenAIClient();

    // Get store context if storeId is provided
    let storeContext = '';
    if (context?.storeId) {
        try {
            const store = await Store.findById(context.storeId).select('name domains contact description');
            if (store) {
                storeContext = `
STORE INFORMATION:
- Store Name: ${store.name}
- Store Domain: ${store.domains[0] || ''}
- Store Description: ${store.description || ''}
- Store Contact: ${store.contact?.email || ''} | ${store.contact?.phone || ''}
`;
            }
        } catch (error) {
            console.warn('Failed to fetch store context for AI generation', error);
        }
    }

    const systemPrompt = `You are an expert E-commerce Content Writer, SEO Specialist, and GEO (Generative Engine Optimization) Expert.
Your task is to generate PREMIUM content optimized for BOTH:
1. Traditional Search (Google, Bing, Yahoo)
2. Generative Engines (ChatGPT, Gemini, Copilot, Claude, Perplexity)

Achieve 90-100/100 score on first generation. NO improvements needed later.

CRITICAL BRANDING RULES:
1. STORE INTEGRATION:
   - Naturally mention the store name "${storeContext ? storeContext.match(/Store Name: (.*)/)?.[1] : 'the store'}" in the content
   - Use phrases like "Exclusive at [Store Name]", "Available at [Store Name]"
   - Link brand values to product benefits
   - Reinforce brand authority and trust
${storeContext}

CRITICAL SEO RULES (TRADITIONAL SEARCH):
1. KEYWORD PLACEMENT & DENSITY:
   - Place primary keyword in title (within first 60 chars)
   - Place primary keyword in first 100 chars of description
   - Include 2-3 semantic variations
   - Keyword density: 1-2% (natural, never stuffed)

2. TITLE OPTIMIZATION:
   - Max 60 characters
   - Start with primary keyword or action word
   - Make it compelling and click-worthy
   - Format: [Keyword] + [Benefit] + [Qualifier if applicable]
   - Can include Store Name at end if space permits (e.g., "| [Store Name]")

3. META DESCRIPTION (160 CHAR LIMIT):
   - MUST be under 160 characters
   - Start with primary keyword
   - Include CTA: "Buy", "Explore", "Discover", "Shop"
   - Answer "Why click?" - benefit-driven
   - Mention Store Name naturally if it fits

4. SHORT DESCRIPTION (Plain Text, no HTML):
   - Under 160 characters
   - Lead with most valuable benefit
   - Action-oriented language
   - Include primary keyword

5. LONG DESCRIPTION (HTML, single line):
   - Use proper HTML structure (<h2>, <p>, <ul>, <li>, <strong>)
   - NO newlines (no \n or \\n characters)
   - Structure: Problem → Solution → Benefits → Store Value → CTA
   - 300-500 words minimum
   - Natural keyword placement (1-2%)
   - Scannable with headers and lists

6-7. OG TITLES & DESCRIPTIONS (Social sharing):
   - OG Title: Max 60 chars, include keyword
   - OG Description: Max 160 chars, shareable tone
   - Both optimized for social sharing

8. SEMANTIC KEYWORDS (LSI):
   - Use related terms, not just exact keyword
   - Example: "Green Cardamom" → elaichi, cardamom pods, whole spice, aromatic spice
   - Include benefits, use cases, varieties

9. READABILITY:
   - Flesch Reading Ease: 60-70 (easy to understand)
   - Active voice
   - Short, punchy sentences
   - Power words: Best, Premium, Fresh, Authentic, Quality

CRITICAL GEO RULES (GENERATIVE ENGINES - ChatGPT, Gemini, Copilot, Claude):
10. CITATION-FRIENDLY STRUCTURE:
   - Include specific facts, stats, measurements, prices, dimensions
   - Incorporate ALL provided specifications into the content
   - AI models cite sources with numbers/data
   - Example: "Contains 85% essential oils, dimensions 5x5cm, weight 50g" vs "High quality"
   - Structure for easy extraction
   - Every specification should be naturally integrated into the description

11. QUESTION-ANSWER FORMAT:
   - Think: "What would someone ask ChatGPT about this?"
   - Answer those questions in your content
   - FAQ-style sections work well
   - Include specification-based questions: "What are the dimensions?", "What material is it?", "How heavy is it?"
   - Examples: "Is this organic?", "Where is it sourced?", "How to use?", "What are the specs?"

12. ENTITY RECOGNITION (AI understands entities):
   - Clearly identify: Product name, brand, origin, properties, specifications
   - Use consistent terminology
   - Include product category, type, specifications details
   - List all provided specs: dimensions, weight, material, color, etc.
   - AI extracts entities from well-structured text

13. AUTHORITATIVE & FACTUAL TONE:
   - Avoid marketing fluff
   - Use concrete details from specifications, not vague claims
   - Include certifications, standards, origins
   - Mention ALL product specifications provided
   - AI favors factual, expert-written content with data
   - Example: "Certified organic from Kerala, India, 100g package, 15% discount" vs "Premium quality"

14. STRUCTURED DATA FOR AI:
   - Include reviews, ratings in copy (NOT prices due to multi-currency)
   - Mention certifications (Organic, Fair Trade, etc.)
   - Include ALL specifications (dimensions, weight, material, color, ingredients, etc.)
   - Include usage instructions, ingredients, specifications
   - Create a natural "specs section" in content
   - AI uses this for comprehensive answers
   - NOTE: Do NOT include prices in content (prices handled separately for multi-currency support)

15. COMPARISON-FRIENDLY:
   - Include "vs" comparisons when relevant
   - State advantages over alternatives
   - Include pros/cons naturally
   - AI uses this for comparative queries

16. CONVERSATIONAL KEYWORDS:
   - Use long-tail, natural language
   - Include how-to, why, what, when phrases
   - Example: "How to use green cardamom in cooking"

17. CONTEXT & BACKSTORY:
   - Include origin, history, cultural significance
   - Explain why something matters
   - Include production methods
   - AI loves contextual information

18. CALL-TO-ACTION (Subtle for AI):
   - For humans: Traditional CTA
   - For AI: Information-focused ending
   - Example: "Available at ${storeContext ? storeContext.match(/Store Name: (.*)/)?.[1] : 'our store'} in various quantities"

OUTPUT REQUIREMENTS:
- Return VALID JSON matching requested fields
- SEO-optimized (90-100 Google score)
- GEO-optimized (appears in AI-generated answers)
- Meta descriptions < 160 chars
- Titles < 60 chars
- HTML as single-line strings
- Production-ready, no placeholders
- Do not mention AI Friendly or look like it is generated from AI

SUCCESS CRITERIA:
✓ Optimized for both Google AND ChatGPT/Gemini
✓ Contains specific, factual information
✓ Easy to cite and quote
✓ Clear entity identification
✓ Includes FAQ-style answers
✓ High readability score
✓ Professional, authoritative tone`;

    const userPrompt = `
CONTEXT DATA:
${JSON.stringify(context, null, 2)}
${storeContext}

CUSTOM INSTRUCTIONS:
${instructions || 'Generate content optimized for BOTH Google Search AND AI chatbots (ChatGPT, Gemini, Copilot, Claude). Include specific facts, citations, FAQ-style answers, and clear entity information.'}

CRITICAL REQUIREMENTS (SEO + GEO):
- 'productName': SEO-optimized product name (under 80 characters), should include primary keyword naturally, compelling and SEO-friendly
- 'shortDescription': Plain text, less than 160 chars, benefit-driven with CTA, include key specifications
- 'metaDescription': Less than 160 chars, keyword-first, CTA-driven, citable, mention key specs
- 'ogDescription': Less than 160 chars, shareable tone, can be extracted by AI, include specs
- 'ogTitle': Less than 60 chars, keyword-forward, clear entity name
- 'description': Valid HTML (single line, no newlines), 300-500 words, MUST include:
  • ALL provided specifications (dimensions, weight, material, color, ingredients, etc.)
  • Specific facts, stats, measurements (for AI to cite)
  • FAQ-style answers to common questions
  • Origin, certifications, specifications details
  • How-to or usage instructions
  • Why it matters (context and background)
  • Clear, authoritative, professional tone
  • Natural integration of Store Name (${storeContext ? storeContext.match(/Store Name: (.*)/)?.[1] : 'store'})

SPECIFICATION INTEGRATION RULES:
- MUST include ALL specifications provided in context data
- Integrate specs naturally into paragraphs, don't just list them
- Create a dedicated "Specifications" or "Details" section if context has multiple specs
- Use exact values from specs (dimensions, weights, materials, etc.)
- Mention specifications in short description as key highlights
- Include specs in meta descriptions where they fit

GEO OPTIMIZATION (For AI Chatbots):
- Include specific, quotable facts (not marketing fluff)
- Answer key questions: What is it? Where from? How to use? Why choose it?
- List certifications, origin, properties clearly
- Use concrete details AI can cite and quote
- Include comparisons to alternatives when relevant
- Mention usage instructions or benefits with specifics
- NOTE: Do NOT include prices in descriptions (prices are multi-currency, handled separately)

VALIDATION CHECKLIST (Must pass all):
✓ Product name is SEO-optimized and under 80 characters
✓ ALL specifications from context are included in description
✓ Specifications are integrated naturally, not just listed
✓ Primary keyword in title and first 100 chars of description
✓ Meta description less than 160 chars
✓ OG title less than 60 chars, OG description less than 160 chars
✓ Short description less than 160 chars, action-oriented, mentions key specs
✓ Keyword density 1-2% (natural, not stuffed)
✓ LSI keywords (semantic variations) included
✓ Specific facts and figures included (for AI to cite)
✓ FAQ-style questions answered in description
✓ Certifications and origin clearly stated
✓ Clear entity identification (product name, brand, type)
✓ How-to or usage instructions included
✓ Specifications section or natural integration of all specs
✓ HTML with no newline characters
✓ Authoritative, professional, factual tone
✓ Readable at 60-70 Flesch Reading Ease level
✓ Optimized for BOTH Google AND ChatGPT/Gemini
✓ Store name mentioned naturally in content

Generate content for: ${fields.join(', ')}

Return ONLY valid JSON matching the requested fields. No markdown, no explanations.
`;


    const isReasoningModel = /^o\d/.test(model) || model.startsWith('gpt-5');

    const completion = await client.chat.completions.create({
        model,
        messages: [
            { role: isReasoningModel ? 'developer' : 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        ...(isReasoningModel ? {
            max_completion_tokens: 4096
        } : {
            response_format: { type: 'json_object' },
            temperature: 0.7
        }),
    });

    const content = completion.choices[0].message.content;
    if (!content) {
        throw new AppError('Failed to generate content', 500);
    }

    res.json({
        success: true,
        data: JSON.parse(content)
    });
});

/**
 * @swagger
 * /api/ai/admin/seo-score:
 *   post:
 *     summary: Calculate SEO score for content
 *     tags: [AI]
 */
export const calculateSeoScore = asyncHandler(async (req: Request, res: Response) => {
    const { data } = req.body;
    const { client, model } = await getOpenAIClient();

    const systemPrompt = `You are an expert SEO Auditor.
Analyze the provided content and calculate an SEO score from 0 to 100.
STRICT RULE: Evaluate ONLY the provided text fields (Title, Description, Keywords). 
- DO NOT provide generic suggestions about "Page Speed", "Mobile Responsiveness", "Structured Data", or "Images" unless that data is explicitly provided in the input.
- If the content is high quality, relevant, and well-structured, give it a high score (90-100) and provide positive feedback or minor refinements only.
- Ensure any suggested meta descriptions (if requested) are strictly under 160 characters.
Return JSON format: { "score": number, "suggestions": string[] }`;

    const userPrompt = `
Analyze the following content for SEO:
${JSON.stringify(data, null, 2)}
`;

    const isReasoningModel = /^o\d/.test(model) || model.startsWith('gpt-5');

    const completion = await client.chat.completions.create({
        model,
        messages: [
            { role: isReasoningModel ? 'developer' : 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        ...(isReasoningModel ? {
            max_completion_tokens: 4096
        } : {
            response_format: { type: 'json_object' },
            temperature: 0.3 // Lower temperature for consistent scoring
        }),
    });

    const content = completion.choices[0].message.content;
    if (!content) {
        throw new AppError('Failed to calculate score', 500);
    }

    res.json({
        success: true,
        analysis: JSON.parse(content)
    });
});
