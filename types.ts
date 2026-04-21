export type Region = 'INDIA' | 'MEENA' | 'UK' | 'US';
export type Month = string;

export interface TTGLRow {
  region: Region;
  months: Record<string, number | null>;
}

export interface RevRecRegionRow {
  region: Region;
  months: Record<string, number | null>;
}

export interface CohortRow {
  month: string;
  cwValue: number;
  m0: number | null;
  m1: number | null;
  m2: number | null;
  m3: number | null;
  m4: number | null;
  m5: number | null;
  m6plus: number | null;
  revRealised: number;
  pctRealised: number;
}

export interface ProjectCountRow {
  region: Region;
  months: Record<string, number | null>;
}
