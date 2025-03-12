'use client';

import { useEffect, useState } from "react";
import { DepartureBoardParams } from "./types/departure-board";
import { useRouter } from "next/navigation";

interface DepartureItem {
  type: string;
  to: string;
  platform: string;
  from: string;
  time: string;
  name: string;
  date: string;
  eta?: string;
}

interface Configuration {
  location: {
    id: string;
    name: string;
    extId: string;
  };
  duration: number;
  products: {
    bus: boolean;
    train: boolean;
  };
  direction: {
    id: string;
    name: string;
    extId: string;
  };
}

const fetchDepartures = async (params: DepartureBoardParams) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
          queryParams.append(key, String(value));
      }
  });

  const response = await fetch(`/api/departure-board?${queryParams}`);
  if (!response.ok) {
      throw new Error('Failed to fetch departures');
  }
  return response.json();
};

const getItems = (res: any): DepartureItem[] => {
  if (!res.Departure) {
    return [];
  }

  const items = res.Departure.map((departure: any) => {
    const {
      direction: to,
      rtTrack: platform,
      stop: from,
      time,
      name,
      date,
      Product: product,
    } = departure;

    return {
      type: product[0].icon,
      to,
      platform,
      from,
      time,
      name,
      date
    }
  })

  return items;
}

export default function Home() {
  const router = useRouter();
  const [items, setItems] = useState<DepartureItem[]>([]);

  const populateDepartureItems = async () => {
    const savedConfig = localStorage.getItem('rejseplanen-config');
    
    if (!savedConfig) {
      router.push('/configure');
      return;
    }

    try {
      const config: Configuration = JSON.parse(savedConfig);
      
      const params: DepartureBoardParams = {
        id: config.location.extId,
        duration: config.duration,
        direction: config.direction.extId,
        products: (config.products.bus ? 4 : 0) | (config.products.train ? 16 : 0)
      };

      const res = await fetchDepartures(params);
      const departureItems = getItems(res);
      console.log('Departure items:', departureItems); // Debug log
      departureItems.sort((a, b) => {
        // First compare by type, ensuring we handle undefined/null cases
        if (!a.type || !b.type) {
          return 0;
        }
        // Convert types to strings to ensure localeCompare works
        const typeA = String(a.type);
        const typeB = String(b.type);
        if (typeA !== typeB) {
          return typeA.localeCompare(typeB);
        }
        // If types are the same, compare by time
        if (!a.time || !b.time) {
          return 0;
        }
        return a.time.localeCompare(b.time);
      });
      setItems(departureItems);
    } catch (error) {
      console.error('Error fetching departures:', error);
      router.push('/configure');
    }
  };

  useEffect(() => {
    populateDepartureItems();
  }, [])

  useEffect(() => {
    const timerId = setInterval(() => {
      const updatedItems = items.map((item) => {
        const { minutes, seconds } = getRemainingTime(item);

        let eta;

        if (minutes === 0 && seconds < 30 && seconds > 0) {
          eta = 'Nu'
        } else if (minutes < 0 && seconds <= 0) {
          eta = 'Rejste'
        } else {
          eta = `${minutes}`
        }

        return {
          ...item,
          eta,
        }
      });

      setItems(updatedItems);
    }, 10000);

    return () => clearInterval(timerId);
  }, [items])

  const getRemainingTime = (item: DepartureItem) => {
    const targetDate = new Date(`${item.date}T${item.time}`);
    const now = new Date();
    const total = targetDate.getTime() - now.getTime();

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return {
      total,
      days,
      hours,
      minutes,
      seconds
    };
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 relative">
      <div className="max-w-4xl mx-auto space-y-4">
        {items.map((item) => (
          <div 
            key={`${item.date}-${item.time}-${item.to}`} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center p-4">
              <div className="flex-shrink-0 w-16 h-16 bg-[rgb(228,148,62)] rounded-lg flex items-center justify-center text-white font-bold">
                {item.name}
              </div>
              
              <div className="ml-4 flex-grow">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{item.to}</h2>
                    <p className="text-gray-600">From: {item.from}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-800">{item.time}</div>
                    <div className={`text-2xl font-bold ${item.eta === 'Nu' ? 'text-green-600' : item.eta === 'Rejste' ? 'text-red-600' : 'text-[rgb(228,148,62)]'}`}>
                      {item.eta}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Platform: {item.platform}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push('/configure')}
        className="fixed bottom-6 right-6 bg-[rgb(228,148,62)] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center"
        aria-label="Configure"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
          />
        </svg>
      </button>
    </div>
  );
}
