export interface LocationSearchParams {
    format?: string;
    lang?: string;
    input: string; // Required parameter - the search term
    maxNo?: number;
    type?: 'S' | 'A' | 'P' | 'POI' | 'ADR' | 'ALL';
    withEquivalentLocations?: number;
    restrictSelection?: string;
    withProducts?: number;
    r?: number;
    filterMode?: string;
    withMastNames?: number;
}