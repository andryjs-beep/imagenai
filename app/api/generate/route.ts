import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import openai from '@/lib/openai';
import { uploadFromUrl } from '@/lib/cloudinary';
import connectDB from '@/lib/mongodb';
import GeneratedImage from '@/models/GeneratedImage';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { prompt, size = '1024x1024', quality = 'standard', imageUrl: inputImageUrl } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'El prompt es requerido' }, { status: 400 });
    }

    let finalPrompt = prompt;

    // Si el usuario subió una imagen guía, la analizamos primero
    if (inputImageUrl) {
      console.log('👁️ Analizando imagen guía en Generador...');
      try {
        const visionResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Describe esta imagen de forma técnica y artística para un generador de imágenes. Evita nombres de personajes con copyright (usa descripciones genéricas). Enfócate en la composición, colores y formas."
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Describe la composición y elementos de esta imagen." },
                { type: "image_url", image_url: { url: inputImageUrl } }
              ]
            }
          ]
        });
        const description = visionResponse.choices[0].message.content;
        finalPrompt = `Basado en esta composición: ${description}. Aplica este estilo: ${prompt}`;
        console.log('✅ Prompt híbrido generado.');
      } catch (visionErr) {
        console.error('Error en análisis de visión:', visionErr);
        // Si falla la visión, seguimos con el prompt original
      }
    }

    // Generar imagen con DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: finalPrompt.slice(0, 3900),
      n: 1,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
      response_format: 'url',
    });

    if (!response.data || response.data.length === 0 || !response.data[0].url) {
      throw new Error('No se pudo obtener la URL de la imagen generada');
    }

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    // Subir a Cloudinary en carpeta del usuario
    const cloudinaryResult = await uploadFromUrl(imageUrl, session.user.id, 'generated');

    // Guardar registro en MongoDB
    await connectDB();
    const savedImage = await GeneratedImage.create({
      userId: session.user.id,
      prompt,
      revisedPrompt,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      aiModel: 'dall-e-3',
      size,
    });

    return NextResponse.json({
      success: true,
      imageUrl: cloudinaryResult.secure_url,
      revisedPrompt,
      imageId: savedImage._id,
    });
  } catch (error: unknown) {
    console.error('Error en /api/generate:', error);
    const errMsg = error instanceof Error ? error.message : 'Error al generar imagen';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
