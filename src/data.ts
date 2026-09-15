import content from "../content/archives.json" with { type: "json" };

export interface ArchiveRecord {
  id: string;
  title: string;
  en: string;
  department: string;
  category: string;
  date: string;
  lead: string;
  clearance: string;
  abstract: string;
  findings: string[];
  source: string;
  bookmarkId?: string;
  bookmarkUrl?: string;
  bookmarkFolder?: string;
  empty?: boolean;
}

export let records: ArchiveRecord[] = content.records;
export const categories = ["全部档案", ...content.categories];
export const archiveColumns = content.columns;
let filesByColumn: number[][] = [];
let locations: { lane: number; row: number; slot: number }[] = [];
function indexCatalog() {
  filesByColumn = archiveColumns.map(() => []);
  locations = [];
  const lanes = new Map(archiveColumns.map((name, lane) => [name, lane]));
  records.forEach((record, index) => {
    const lane = lanes.get(record.category)!;
    const row = 12 + filesByColumn[lane].length;
    filesByColumn[lane].push(index);
    locations[index] = { lane, row, slot: lane * 32 + row };
  });
}
indexCatalog();
export let bookmarkCatalog = false;
export function installBookmarkCatalog(next: ArchiveRecord[], columns: string[]) {
  records = next;
  archiveColumns.splice(0, archiveColumns.length, ...columns);
  categories.splice(0, categories.length, "全部档案", ...columns);
  bookmarkCatalog = true;
  indexCatalog();
}

export function columnFiles(lane: number) {
  return filesByColumn[lane] ?? [];
}
export function fileLocation(index: number) {
  return locations[index];
}
export function fileAtSlot(slot: number) {
  const files = columnFiles(Math.floor(slot / 32));
  return files[Math.max(0, Math.min(files.length - 1, (slot % 32) - 12))];
}
