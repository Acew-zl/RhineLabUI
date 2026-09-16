/** Decode browser favicon responses into owned pixels before uploading to WebGL.
 * Smaller cached sizes and the site's root are tried after a failed page icon.
 */
export async function loadBookmarkIcon<T>(sources: readonly string[], read: (url: string) => Promise<Blob>, decode: (blob: Blob) => Promise<T>) {
  let failure: unknown = new Error('图标接口不可用');
  for (const source of sources) {
    try { return await decode(await read(source)); }
    catch (error) { failure = error; }
  }
  throw failure;
}
