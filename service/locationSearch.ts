import { LocationSearchParams } from "../app/types/location-search";

export const fetchLocationSearch = async (params: LocationSearchParams) => {
    // Set default values based on the provided URL
    const defaultParams: Partial<LocationSearchParams> = {
        format: 'json',
        lang: 'en',
        maxNo: 10,
        type: 'ALL',
        withEquivalentLocations: 0,
        restrictSelection: 'S',
        withProducts: 1,
        r: 1000,
        filterMode: 'DIST_PERI',
        withMastNames: 1
    };

    // Ensure required parameters are provided
    if (!params.input) {
        throw new Error('Input parameter is required');
    }

    const accessId = process.env.ACCESS_TOKEN;

    const mergedParams = { ...defaultParams, ...params, accessId };

    const url = new URL('https://www.rejseplanen.dk/api/location.name');

    Object.entries(mergedParams).forEach(([key, value]) => {
        if (value !== undefined) {
            url.searchParams.append(key, String(value));
        }
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();

    const {stopLocationOrCoordLocation} = json;

    return stopLocationOrCoordLocation.filter((location:any) => location.StopLocation).map((location:any) => {

        return ({
            id: location.StopLocation.id,
            extId: location.StopLocation.extId,
            isMainMast: location.StopLocation.isMainMast,
            name: location.StopLocation.name,
            lon: location.StopLocation.lon,
            lat: location.StopLocation.lat,
            weight: location.StopLocation.weight,
            products: location.StopLocation.products,
        })
    })
};
