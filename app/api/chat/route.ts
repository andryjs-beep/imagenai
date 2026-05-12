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

    const { messages, model = 'gpt-4o-mini', conversationId, title } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mensajes inválidos' }, { status: 400 });
    }

    // Formatear mensajes para OpenAI
    const formattedMessages = messages.map((msg: { role: string; content: string; imageUrl?: string }) => {
      if (msg.imageUrl) {
        return {
          role: msg.role as 'user' | 'assistant',
          content: [
            { type: 'text', text: msg.content },
            { type: 'image_url', image_url: { url: msg.imageUrl } },
          ],
        };
      }
      return { role: msg.role as 'user' | 'assistant', content: msg.content };
    });

    // Streaming response de OpenAI
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'Eres un asistente de IA útil y amigable. Responde siempre en el idioma del usuario.',
        },
        ...formattedMessages,
      ],
      max_tokens: 2048,
      stream: true,
    });

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
                model,
              }
            );
          } else {
            // Crear nueva conversación
            const autoTitle = title || lastUserMessage.content.slice(0, 60);
            await Conversation.create({
              userId: session.user.id,
              title: autoTitle,
              model,
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
