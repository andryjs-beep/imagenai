import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import GeneratedImage from '@/models/GeneratedImage';
import { deleteImage } from '@/lib/cloudinary';

// GET — Imágenes generadas del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await connectDB();
    const images = await GeneratedImage.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ images });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// DELETE — Eliminar imagen
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { imageId } = await req.json();

    await connectDB();
    // Busca SOLO la imagen del usuario actual
    const image = await GeneratedImage.findOne({ _id: imageId, userId: session.user.id });
    if (!image) {
      return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });
    }

    // Eliminar de Cloudinary
    await deleteImage(image.cloudinaryPublicId);

    // Eliminar de MongoDB
    await GeneratedImage.deleteOne({ _id: imageId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
