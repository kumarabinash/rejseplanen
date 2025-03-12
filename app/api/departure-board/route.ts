import { NextResponse } from 'next/server';
import { fetchDepartureBoard } from '@/service/departureBoard';
import { DepartureBoardParams } from "../../types/departure-board";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    
    // Convert searchParams to DepartureBoardParams
    const params: DepartureBoardParams = {
        date: searchParams.get('date') || undefined,
        time: searchParams.get('time') || '07:00',
        duration: Number(searchParams.get('duration')) || 10,
        id: searchParams.get('id') || undefined,
        direction: searchParams.get('direction') || undefined,
        products: 16, // todo train
        // ... add other parameters as needed
    };

    try {
        const data = await fetchDepartureBoard(params);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching departure board:', error);
        return NextResponse.json(
            { error: 'Failed to fetch departure board' },
            { status: 500 }
        );
    }
} 