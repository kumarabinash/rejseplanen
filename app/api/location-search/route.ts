import { NextResponse } from 'next/server';
import { fetchLocationSearch } from '@/service/locationSearch';
import { LocationSearchParams } from "../../types/location-search";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const input = searchParams.get('input')

    if(!input) {
        return NextResponse.json(
            { error: 'Input is required' },
            { status: 400 }
        );
    }

    const params: LocationSearchParams = {
        input: input,
    };

    
    try {
        const data = await fetchLocationSearch(params);
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to fetch location search' },
            { status: 500 }
        );
    }
} 