import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

// GET — Listar conversaciones del usuario
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await connectDB();
    const conversations = await Conversation.find({ userId: session.user.id })
      .select('_id title model createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// DELETE — Borrar conversación
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { conversationId } = await req.json();

    await connectDB();
    // IMPORTANTE: filtra por userId para que un usuario no pueda borrar conversaciones de otro
    await Conversation.deleteOne({ _id: conversationId, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
