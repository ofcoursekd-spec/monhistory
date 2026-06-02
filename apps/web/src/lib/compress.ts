/**
 * Redimensionne et compresse une image en WebP côté navigateur, avant upload.
 *
 * - Garde le ratio d'origine
 * - Limite la largeur à `maxWidth` (1200 par défaut, suffisant pour BD lue verticalement)
 * - Encode en WebP à `quality` (0.8 par défaut = bon rapport qualité/taille)
 *
 * Retombe sur le fichier original si :
 *  - ce n'est pas une image
 *  - le navigateur ne supporte pas createImageBitmap / WebP
 *  - la compression produit un fichier plus gros que l'original
 */
export async function compressToWebP(
  file: File,
  maxWidth = 1200,
  quality = 0.8,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (typeof createImageBitmap !== 'function') return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/webp', quality),
  );
  if (!blob || blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return new File([blob], newName, { type: 'image/webp', lastModified: Date.now() });
}
