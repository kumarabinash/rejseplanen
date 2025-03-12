'use server';

import { DepartureBoardParams } from "@/app/types/departure-board";


export const fetchDepartureBoard = async (params: DepartureBoardParams) => {
    // Set default values
    const defaultParams: DepartureBoardParams = {
        format: 'json',
        lang: 'en',
        id: params.id,
        direction: params.direction,
        date: params.date,
        time: params.time,
        duration: params.duration,
        maxJourneys: -1,
        products: params.products,
        passlist: 0,
        baim: 0,
        rtMode: 'SERVER_DEFAULT',
        type: 'DEP',
        // accessId: accessToken,
    };

    // Merge default values with provided params
    const mergedParams = { ...defaultParams };

    const accessToken = process.env.ACCESS_TOKEN;

    // Build URL with query parameters
    const url = new URL(`https://www.rejseplanen.dk/api/departureBoard?accessId=${accessToken}`);

    // Add parameters to URL
    Object.entries(mergedParams).forEach(([key, value]) => {
        if (value !== undefined) {
            // Handle time format specifically to encode the colon
            // if (key === 'time' && typeof value === 'string') {
            //     url.searchParams.append(key, value.replace(':', '%3A'));
            // } else {
                url.searchParams.append(key, String(value));
            // }
        }
    });

    // Make the request
    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    return json;
};
