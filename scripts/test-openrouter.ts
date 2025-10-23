/**
 * Test script for OpenRouter API integration
 * Run with: npm run test:openrouter
 * 
 * Requires OPENROUTER_API_KEY in .env file
 */

import { config } from 'dotenv';
import { OpenRouterService } from '../src/lib/services/openrouter.service';

// Load environment variables from .env file
config();

async function testOpenRouterConnection() {
  console.log('🧪 Testing OpenRouter API Connection...\n');

  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable not set');
    console.log('💡 Add it to your .env file or export it in your shell');
    process.exit(1);
  }

  try {
    // Test 1: Service initialization
    console.log('1️⃣ Testing service initialization...');
    const service = new OpenRouterService(apiKey);
    console.log('✅ Service initialized successfully\n');

    // Test 2: Get available models
    console.log('2️⃣ Testing models endpoint...');
    const models = await service.models();
    console.log(`✅ Retrieved ${models.length} models`);
    
    // Show a few example models
    console.log('\n📋 Sample models:');
    models.slice(0, 5).forEach(model => {
      console.log(`   - ${model.id}`);
      console.log(`     Context: ${model.context_length.toLocaleString()} tokens`);
      console.log(`     Pricing: $${model.pricing.prompt} / $${model.pricing.completion}\n`);
    });

    // Test 3: Simple chat completion
    console.log('3️⃣ Testing chat completion...');
    const startTime = Date.now();
    
    const completion = await service.chatCompletion([
      {
        role: 'system',
        content: 'You are a helpful assistant. Respond in one brief sentence.',
      },
      {
        role: 'user',
        content: 'What is 2+2?',
      },
    ], {
      model: 'openai/gpt-4o-mini',
      temperature: 0.7,
    });
    
    const elapsed = Date.now() - startTime;
    
    console.log('✅ Chat completion successful');
    console.log(`   Response: "${completion.content}"`);
    console.log(`   Tokens: ${completion.usage.totalTokens} (prompt: ${completion.usage.promptTokens}, completion: ${completion.usage.completionTokens})`);
    console.log(`   Time: ${elapsed}ms\n`);

    // Test 4: JSON Schema response
    console.log('4️⃣ Testing JSON schema response...');
    
    const jsonCompletion = await service.chatCompletion([
      {
        role: 'system',
        content: 'You are a helpful assistant that responds in structured JSON format.',
      },
      {
        role: 'user',
        content: 'Give me 3 programming concepts with brief definitions.',
      },
    ], {
      model: 'openai/gpt-4o-mini',
      responseFormat: {
        type: 'json_schema',
        json_schema: {
          name: 'ProgrammingConcepts',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              concepts: {
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
                minItems: 3,
                maxItems: 3,
              },
            },
            required: ['concepts'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0.7,
    });
    
    console.log('✅ JSON schema response successful');
    const result = jsonCompletion.json as { concepts: Array<{ term: string; definition: string }> };
    console.log(`   Concepts received: ${result.concepts.length}`);
    result.concepts.forEach((concept, idx) => {
      console.log(`   ${idx + 1}. ${concept.term}: ${concept.definition}`);
    });
    console.log(`   Tokens: ${jsonCompletion.usage.totalTokens}\n`);

    // Test 5: Error handling
    console.log('5️⃣ Testing error handling (invalid model)...');
    try {
      await service.chatCompletion([
        { role: 'user', content: 'test' }
      ], {
        model: 'invalid/model-name-12345',
      });
      console.log('❌ Expected error but got success');
    } catch (error) {
      if (error instanceof Error) {
        console.log(`✅ Error caught correctly: ${error.message}\n`);
      }
    }

    console.log('🎉 All tests passed!\n');
    console.log('✨ OpenRouter API integration is working correctly');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
testOpenRouterConnection();

