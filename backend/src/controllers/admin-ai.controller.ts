import { Request, Response } from 'express';
import OpenAI from 'openai';
import Setting from '../models/Setting';
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

    const systemPrompt = `You are an expert E-commerce Content Writer and SEO Specialist.
Your task is to generate high-quality, engaging, and SEO-optimized content based on the provided context.
Ensure the content is perfectly aligned with SEO best practices to achieve a 100/100 score.
- Integrate the primary keyword naturally in the title (near the beginning) and description.
- Ensure the description is action-oriented and under 160 characters.
- Avoid keyword stuffing; use natural language.
- Use the 'Focus Keyword' (if generated) as the anchor for all optimization.
Return the response in JSON format matching the requested fields.`;

    const userPrompt = `
Context:
${JSON.stringify(context, null, 2)}

Instructions:
${instructions || 'Generate content based on the context.'}
Important: If 'shortDescription' is requested, it MUST be plain text without any HTML tags.
Important: 'metaDescription' MUST be strictly under 160 characters.
Important: 'ogDescription' MUST be strictly under 160 characters.
Important: 'ogTitle' MUST be strictly under 60 characters.
Important: If 'description' is requested, it MUST be valid HTML formatted as a single line string without any \n or \\n characters.

Fields to Generate:
${fields.join(', ')}

Please provide the output in valid JSON format with keys matching the requested fields.
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
