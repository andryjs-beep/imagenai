import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import openai from '@/lib/openai';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { messages, model: aiModel = 'gpt-4o-mini', conversationId, title } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 });
    }

    // Formatear mensajes para OpenAI
    const formattedMessages = messages.map((msg: any) => {
      if (msg.role === 'user' && msg.imageUrl) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: msg.content },
            { type: 'image_url', image_url: { url: msg.imageUrl } },
          ],
        };
      }
      return { 
        role: msg.role as 'user' | 'assistant' | 'system', 
        content: msg.content 
      };
    });

    // 1. Detectar si el usuario quiere generar una imagen
    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    const hasImage = messages.some((msg: any) => msg.imageUrl);
    const isImageRequest = lastMessage.includes('genera') || 
                          lastMessage.includes('crea') || 
                          lastMessage.includes('dibuja') ||
                          lastMessage.includes('imagen');

    if (isImageRequest) {
      console.log('🎨 Detectada solicitud de imagen compleja.');
      let finalPrompt = lastMessage;

      // Si hay una imagen, primero le pedimos a GPT-4o que la describa para DALL-E
      if (hasImage) {
        console.log('👁️ Analizando imagen para guiar a DALL-E...');
        const visionResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Describe esta imagen de forma técnica y artística para un generador de imágenes. Evita nombres de personajes con copyright, usa descripciones genéricas como 'princesa de cuento', 'niña con lazo'. Enfócate en la composición, colores y formas."
            },
            ...formattedMessages
          ] as any[]
        });
        const description = visionResponse.choices[0].message.content;
        finalPrompt = `Basado en esta composición: ${description}. Aplica este estilo: ${lastMessage}`;
      }

      // Llamada a DALL-E 3 con el prompt "curado"
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt.slice(0, 3800), // Limitar longitud
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = imageResponse.data[0]?.url;
      if (!imageUrl) throw new Error('No se pudo generar la imagen');

      return NextResponse.json({ 
        role: 'assistant', 
        content: `He analizado tu imagen y he aplicado tu Prompt Maestro para generar esta nueva versión técnica en 3D:`,
        generatedImage: imageUrl 
      });
    }

    // 2. Respuesta normal si no es solicitud de imagen
    let stream;
    try {
      stream = await openai.chat.completions.create({
        model: aiModel,
        messages: [
          {
            role: 'system',
            content: 'Eres un asistente de IA útil y amigable. Si el usuario te envía una imagen, analízala con detalle.',
          },
          ...formattedMessages,
        ] as any[],
        max_tokens: 2048,
        stream: true,
      });
    } catch (openAiError: any) {
      console.error('❌ Error de OpenAI:', openAiError.message || openAiError);
      return NextResponse.json({ 
        error: openAiError.message || 'Error en la comunicación con OpenAI',
        type: 'openai_error' 
      }, { status: openAiError.status || 500 });
    }

    // Recolectar respuesta completa para guardar
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            fullResponse += text;
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          // Guardar conversación en MongoDB
          await connectDB();
          const lastUserMessage = messages[messages.length - 1];
          
          if (conversationId) {
            // Añadir mensajes a conversación existente (SOLO del usuario actual)
            await Conversation.findOneAndUpdate(
              { _id: conversationId, userId: session.user.id },
              {
                $push: {
                  messages: {
                    $each: [
                      { role: 'user', content: lastUserMessage.content, imageUrl: lastUserMessage.imageUrl, timestamp: new Date() },
                      { role: 'assistant', content: fullResponse, timestamp: new Date() },
                    ],
                  },
                },
                aiModel,
              }
            );
          } else {
            // Crear nueva conversación
            const autoTitle = title || lastUserMessage.content.slice(0, 60);
            await Conversation.create({
              userId: session.user.id,
              title: autoTitle,
              aiModel,
              messages: [
                { role: 'user', content: lastUserMessage.content, imageUrl: lastUserMessage.imageUrl, timestamp: new Date() },
                { role: 'assistant', content: fullResponse, timestamp: new Date() },
              ],
            });
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error en /api/chat:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
