/**
 * Loads data from either Tasklet or web deployment
 * Supports both Tasklet's file system and web-based HTTP fetch
 */

export async function loadData(filename: string): Promise<any> {
  // Check if we're in Tasklet environment
  if (typeof window !== 'undefined' && (window as any).tasklet?.readFileFromDisk) {
    try {
      const raw = await (window as any).tasklet.readFileFromDisk(`/agent/home/${filename}`);
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (error) {
      console.warn(`Tasklet file read failed for ${filename}, falling back to HTTP`, error);
    }
  }

  // Fall back to HTTP fetch (web deployment)
  try {
    const response = await fetch(`/${filename}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to load ${filename}:`, error);
    throw error;
  }
}
