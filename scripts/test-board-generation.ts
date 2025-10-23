/**
 * Test script for AI board generation
 * Tests the integration between board-ai.service and OpenRouterService
 * Run with: npx tsx scripts/test-board-generation.ts
 */

import { config } from 'dotenv';
import { createOpenRouterService } from '../src/lib/services/openrouter.factory';
import type { Message, JsonSchemaFormat } from '../src/lib/services/openrouter.service';

// Load environment variables from .env file
config();

async function testBoardGeneration() {
  console.log('🧪 Testing AI Board Pair Generation...\n');

  try {
    // Initialize service using factory
    console.log('1️⃣ Initializing OpenRouter service...');
    const service = createOpenRouterService();
    console.log('✅ Service initialized\n');

    // Test data
    const inputText = `
Photosynthesis is the process by which plants use sunlight to convert carbon dioxide and water into glucose and oxygen.
Mitosis is a type of cell division that results in two daughter cells, each having the same number and kind of chromosomes as the parent nucleus.
DNA (Deoxyribonucleic acid) is a molecule that carries genetic instructions for growth, development, functioning, and reproduction.
The cell membrane is a biological membrane that separates the interior of cells from the outside environment.
Ribosomes are molecular machines that synthesize proteins by translating messenger RNA.
`;

    const title = 'Biology Basics';
    const cardCount = 16 as 16 | 24;
    const pairCount = cardCount / 2;

    console.log('2️⃣ Test parameters:');
    console.log(`   Title: ${title}`);
    console.log(`   Card count: ${cardCount} (${pairCount} pairs)`);
    console.log(`   Input text length: ${inputText.length} characters\n`);

    // Build system prompt (same as in board-ai.service.ts)
    const systemPrompt = `You are an expert educational content creator specializing in creating study materials.
Your task is to analyze provided text and extract the most important concepts as term-definition pairs for a memory matching game.

Requirements:
- Extract exactly ${pairCount} pairs
- Terms should be 1-4 words: key concepts, names, or technical terms
- Definitions should be 5-15 words: clear, concise explanations
- Focus on the most important concepts from the text
- Ensure variety - avoid repetitive or overlapping concepts
- Use language that matches the input text (Polish or English)
- Definitions must be self-contained and understandable without context`;

    const userPrompt = `Title: ${title}

Input text:
${inputText}

Generate ${pairCount} term-definition pairs from the above content.`;

    // Define response format schema
    const responseFormat: JsonSchemaFormat = {
      type: 'json_schema',
      json_schema: {
        name: 'GeneratedPairs',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            pairs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  term: { type: 'string' },
                  definition: { type: 'string' },
                },
                required: ['term', 'definition'],
                additionalProperties: false,
              },
              minItems: pairCount,
              maxItems: pairCount,
            },
          },
          required: ['pairs'],
          additionalProperties: false,
        },
      },
    };

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    console.log('3️⃣ Calling OpenRouter API...');
    const startTime = Date.now();

    const completion = await service.chatCompletion(messages, {
      model: 'openai/gpt-4o-mini',
      responseFormat,
      temperature: 0.7,
      top_p: 1.0,
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ API call completed in ${elapsed}ms\n`);

    // Parse and validate response
    console.log('4️⃣ Validating response...');
    const result = completion.json as { pairs: Array<{ term: string; definition: string }> };

    if (!result.pairs || !Array.isArray(result.pairs)) {
      throw new Error('Invalid response format: no pairs array');
    }

    if (result.pairs.length !== pairCount) {
      throw new Error(`Expected ${pairCount} pairs, got ${result.pairs.length}`);
    }

    console.log(`✅ Received ${result.pairs.length} pairs\n`);

    // Display generated pairs
    console.log('📚 Generated Pairs:');
    console.log('='.repeat(80));
    result.pairs.forEach((pair, idx) => {
      console.log(`\n${idx + 1}. TERM: ${pair.term}`);
      console.log(`   DEF:  ${pair.definition}`);
    });
    console.log('\n' + '='.repeat(80));

    // Display metrics
    console.log('\n📊 Metrics:');
    console.log(`   Prompt tokens:     ${completion.usage.promptTokens}`);
    console.log(`   Completion tokens: ${completion.usage.completionTokens}`);
    console.log(`   Total tokens:      ${completion.usage.totalTokens}`);

    // Calculate cost (same as in board-ai.service.ts)
    const INPUT_COST_PER_1M = 0.15;
    const OUTPUT_COST_PER_1M = 0.60;
    const inputCost = (completion.usage.promptTokens / 1_000_000) * INPUT_COST_PER_1M;
    const outputCost = (completion.usage.completionTokens / 1_000_000) * OUTPUT_COST_PER_1M;
    const totalCost = inputCost + outputCost;

    console.log(`   Estimated cost:    $${totalCost.toFixed(6)}`);
    console.log(`   Time elapsed:      ${elapsed}ms\n`);

    console.log('🎉 Board generation test completed successfully!');
    console.log('✨ AI service is ready to generate educational content');

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run test
testBoardGeneration();

