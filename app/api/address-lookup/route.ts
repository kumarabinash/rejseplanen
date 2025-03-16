import { NextResponse } from 'next/server';
import { fetchAddressLookup } from '@/service/addressLookup';
import { AddressLookupParams } from "../../types/address-lookup";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')

    if(!latitude || !longitude) {
        return NextResponse.json(
            { error: 'Latitude and longitude are required' },
            { status: 400 }
        );
    }

    const params: AddressLookupParams = {
        originCoordLat: latitude,
        originCoordLong: longitude,
    };

    
    try {
        const data = await fetchAddressLookup(params);
        console.log(data);
        return NextResponse.json(data);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: 'Failed to fetch address lookup' },
            { status: 500 }
        );
    }
} 