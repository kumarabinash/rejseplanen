'use server';

import { AddressLookupParams } from "@/app/types/address-lookup";


export const fetchAddressLookup = async (params: AddressLookupParams) => {
    // Set default values
    const defaultParams: AddressLookupParams = {
        format: 'json',
        originCoordLat: params.originCoordLat,
        originCoordLong: params.originCoordLong,
    };

    // Merge default values with provided params
    const mergedParams = { ...defaultParams };

    const accessToken = process.env.ACCESS_TOKEN;

    // Build URL with query parameters
    const url = new URL(`https://www.rejseplanen.dk/api/addresslookup?accessId=${accessToken}`);

    // Add parameters to URL
    Object.entries(mergedParams).forEach(([key, value]) => {
        if (value !== undefined) {
            url.searchParams.append(key, String(value));
        }
    });

    console.log(url.toString());

    // Make the request
    const response = await fetch(url.toString());

    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    return json;
};
