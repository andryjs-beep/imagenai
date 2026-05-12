import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || 'dummy_key_for_build';

const openai = new OpenAI({
  apiKey: apiKey,
});

export default openai;
