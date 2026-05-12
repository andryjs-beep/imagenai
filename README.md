# AI Studio Personal & Multi-Usuario

Esta es una aplicación completa de Inteligencia Artificial construida con **Next.js 14**, **OpenAI API**, **MongoDB Atlas** y **Cloudinary**. Diseñada para ser escalable, segura y visualmente impresionante con un diseño en **azul marino** profundo.

## 🚀 Características

- 🤖 **Chat con IA**: Soporte para GPT-4o y GPT-4o-mini con streaming de respuestas.
- 🎨 **Generación de Imágenes**: DALL-E 3 integrado con guardado automático en la nube.
- 📁 **Aislamiento de Datos**: Cada usuario tiene su propio historial y galería privada.
- 🔐 **Autenticación Completa**: Sistema de login seguro con roles (Admin y Usuario).
- 🛠️ **Panel de Control**: Los administradores pueden crear y gestionar usuarios para sus clientes.
- ☁️ **Cloudinary**: Gestión optimizada de imágenes en carpetas por usuario.
- 📊 **MongoDB Atlas**: Persistencia de conversaciones y metadatos de imágenes.

## 🛠️ Instalación

1. **Clonar/Descargar**: Extrae el código en tu carpeta local.
2. **Dependencias**:
   ```bash
   npm install
   ```
3. **Variables de Entorno**:
   Crea un archivo `.env.local` basado en `.env.local.example` y completa las claves:
   - `OPENAI_API_KEY`: Desde [OpenAI Platform](https://platform.openai.com/).
   - `MONGODB_URI`: Tu cadena de conexión de [MongoDB Atlas](https://www.mongodb.com/atlas).
   - `NEXTAUTH_SECRET`: Genera uno con `openssl rand -base64 32`.
   - `CLOUDINARY_*`: Desde tu dashboard de [Cloudinary](https://cloudinary.com/).

4. **Primer Usuario (Admin)**:
   La primera vez que despliegues, deberás crear un usuario admin directamente en MongoDB o mediante un script temporal para poder acceder al panel de administración.

## 🚀 Despliegue en Vercel

1. Sube tu código a un repositorio de GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com).
3. Añade todas las variables de entorno del `.env.local`.
4. **Importante**: En MongoDB Atlas, asegúrate de permitir el acceso desde cualquier IP (`0.0.0.0/0`) en **Network Access** para que Vercel pueda conectarse.

## 🎨 Diseño

El diseño utiliza una paleta de colores azul marino personalizada, efectos de desenfoque (glassmorphism) y animaciones fluidas para ofrecer una experiencia premium a tus clientes.
