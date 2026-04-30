export function fileUrl(filePath: string): string {
  return `waveon://local/?path=${encodeURIComponent(filePath)}`;
}
