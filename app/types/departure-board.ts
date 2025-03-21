export interface DepartureBoardParams {
    format?: string;
    lang?: string;
    id?: string;
    direction?: string;
    date?: string;
    time?: string;
    duration?: number;
    maxJourneys?: number;
    products?: number;
    passlist?: number;
    baim?: number;
    rtMode?: string;
    type?: string;
    // accessId?: string; // Required parameter
}

export interface Product {
    icon: {
        res: string;
    };
}

export interface Departure {
    direction: string;
    rtTrack: string;
    stop: string;
    time: string;
    name: string;
    date: string;
    Product: Product[];
    lat: string;
    lon: string;
}

export interface DepartureBoardResponse {
    Departure?: Departure[];
}