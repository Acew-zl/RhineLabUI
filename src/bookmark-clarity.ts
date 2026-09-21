import { matchingPreset, type RenderQuality } from './render-quality.ts';
import { qualityPresets } from './render-quality.ts';

export const bookmarkClearQuality: RenderQuality = { ...qualityPresets.original, pixelRatio: 3, depthOfField: 0 };
export const isBookmarkClearQuality = (quality: RenderQuality) =>
  Object.entries(bookmarkClearQuality).every(([key, value]) => quality[key as keyof RenderQuality] === value);
export function migrateBookmarkQuality(quality: RenderQuality, version: unknown) {
  return version !== 1 && matchingPreset(quality) === 'original' ? { ...bookmarkClearQuality } : quality;
}
