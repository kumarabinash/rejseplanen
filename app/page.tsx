'use client';

import { useEffect, useState, Suspense } from "react";
import { DepartureBoardParams, DepartureBoardResponse, Departure } from "./types/departure-board";
import { useRouter, useSearchParams } from "next/navigation";

import { FaTrain } from "react-icons/fa6";
import { FaBus } from "react-icons/fa6";
import { IoMapSharp } from "react-icons/io5";
import { fetchAddressLookup } from "@/service/addressLookup";
import { AddressLookupParams } from "./types/address-lookup";

interface DepartureItem {
  type: string;
  to: string;
  platform: string;
  from: string;
  time: string;
  name: string;
  date: string;
  eta?: string;
  lat: string;
  lon: string;
}

interface Configuration {
  location: {
    // id: string;
    name: string;
    extId: string;
  };
  duration: number;
  products: {
    bus: boolean;
    train: boolean;
  };
  direction: {
    // id: string;
    name: string;
    extId: string;
  };
}

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

  const getPosition = (): Promise<{ lat: number, lon: number }> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition((position) => {
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
      }, (error) => {
        reject(error);
      });
    });
  };

  const populateEta = (items: DepartureItem[]) => {
    const updatedItems = items.map((item) => {
        const { minutes, seconds } = getRemainingTime(item);

        let eta;

        if (minutes === 0 && seconds < 30 && seconds > 0) {
          eta = 'Nu'
        } else if (minutes < 0 && seconds <= 0) {
          eta = 'Rejste'
        } else {
          eta = `${minutes}m`
        }

        return {
          ...item,
          eta,
        }
      });

      return updatedItems;
  }

const fetchDepartures = async (params: DepartureBoardParams): Promise<DepartureBoardResponse> => {
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

const getItems = (res: DepartureBoardResponse): DepartureItem[] => {
  if (!res.Departure) {
    return [];
  }

  const items = res.Departure.map((departure: Departure) => {
    const {
      direction: to,
      rtTrack: platform,
      stop: from,
      time,
      name,
      date,
      Product: product,
      lat,
      lon,
    } = departure;

    return {
      type: product[0].icon.res,
      to,
      platform,
      from,
      time,
      name,
      date,
      lat,
      lon,
    }
  })

  return items;
}

function DepartureBoard() {
  const router = useRouter();
  const [items, setItems] = useState<DepartureItem[]>([]);
  const [config, setConfig] = useState<Configuration | null>(null);
  const searchParams = useSearchParams();

  const populateDepartureItems = async () => {
    // get query params
    const locationExtId = searchParams.get('locationExtId');
    const locationName = searchParams.get('locationName');
    const duration = searchParams.get('duration');
    const bus = searchParams.get('bus');
    const train = searchParams.get('train');
    const directionExtId = searchParams.get('directionExtId');
    const directionName = searchParams.get('directionName');

    let config: Configuration;

    if (!locationExtId) {
      const savedConfig = localStorage.getItem('rejseplanen-config');

      if (!savedConfig) {
        router.push('/configure');
        return;
      }

      config = JSON.parse(savedConfig);
    } else {
      config = {
        location: {
          extId: locationExtId || '',
          name: locationName || '',
        },
        duration: parseInt(duration || '0'),
        products: {
          bus: bus === 'true',
          train: train === 'true',
        },
        direction: {
          extId: directionExtId || '',
          name: directionName || '',
        },
      }
    }

    if (config.location.extId === 'current') {
      const position = await getPosition();

      const params: AddressLookupParams = {
          originCoordLat: position.lat.toString(),
          originCoordLong: position.lon.toString(),
        };

        try {
          const data = await fetchAddressLookup(params);

          const location = data.stopLocationOrCoordLocation[0].CoordLocation;

          console.log({ location });

          config.location.extId = location.extId;
          config.location.name = location.name;
        } catch (error) {
          console.error('Error fetching address lookup:', error);
          router.push('/configure');
          return;
        }
    }

    if (!config?.location.extId) {
      router.push('/configure');
      return;
    }

    setConfig(config);

    console.log({ config });

    try {
      const params: DepartureBoardParams = {
        id: config.location.extId,
        duration: config.duration,
        direction: config.direction.extId,
        products: (config.products.bus ? 32 : 0) | (config.products.train ? 16 : 0)
      };

      const res = await fetchDepartures(params);
      const departureItems = getItems(res);
      departureItems.sort((a, b) => {
        // First compare by type, ensuring we handle undefined/null cases
        if (!a.type || !b.type) {
          return 0;
        }
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }
        
        return a.time.localeCompare(b.time);
      });

      const updatedItems = populateEta(departureItems);
      setItems(updatedItems);
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
      const updatedItems = populateEta(items);
      setItems(updatedItems);
    }, 10000);

    return () => clearInterval(timerId);
  }, [items])

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-2 sm:p-4 relative">
      <div className="max-w-4xl mx-auto space-y-2 sm:space-y-4">
        {items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">No upcoming departures available at</h2>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4">{config?.location.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Please check back later or try a different time.</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={`${item.date}-${item.time}-${item.to}`} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 relative"
            >

              {item.type === 'prod_bus' ? (
                <FaBus className="absolute -top-16 h-38 w-38 right-5 opacity-3 text-black dark:text-white overflow-hidden" />
              ) : item.type === 'prod_comm' ? (
                <FaTrain className="absolute -top-16 h-38 w-38 right-5 opacity-3 text-black dark:text-white overflow-hidden" />
              ) : null}
              <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4">
                <div className="w-full sm:w-auto flex items-center gap-2 mb-2 sm:mb-0 justify-between sm:flex-row">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[rgb(228,148,62)] dark:bg-[rgb(228,148,62)] rounded-lg flex flex-col items-center justify-center text-white text-center">
                    <span className="font-bold text-xs sm:text-sm">
                      {item.name}
                      </span>
                  </div>
                  <div className="flex-col items-center text-right gap-2 sm:hidden">
                    <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{formatTime(item.time)}</div>
                    <div className={`text-lg font-bold ${
                      item.eta === 'Nu' ? 'text-green-600 dark:text-green-400' : 
                      item.eta === 'Rejste' ? 'text-red-600 dark:text-red-400' : 
                      (() => {
                        const minutes = parseInt(item.eta || '0');
                        if (minutes < 5) return 'text-red-900 dark:text-red-300';
                        if (minutes < 10) return 'text-red-600 dark:text-red-400';
                        if (minutes < 15) return 'text-orange-500 dark:text-orange-400';
                        if (minutes < 20) return 'text-yellow-500 dark:text-yellow-400';
                        if (minutes < 25) return 'text-green-400 dark:text-green-300';
                        if (minutes < 30) return 'text-green-600 dark:text-green-400';
                        return 'text-[rgb(228,148,62)] dark:text-[rgb(228,148,62)]';
                      })()
                    }`}>
                      {item.eta}
                    </div>
                  </div>
                </div>
                
                <div className="ml-0 sm:ml-4 flex-grow w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                      {item.type === 'prod_bus' ? (
                          <FaBus className="w-4 h-4 sm:w-5 sm:h-5 text-[rgb(228,148,62)]" />
                        ) : item.type === 'prod_comm' ? (
                          <FaTrain className="w-4 h-4 sm:w-5 sm:h-5 text-[rgb(228,148,62)]" />
                        ) : null} 
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate">{item.to}</h2>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">From: 
                        <a href={`https://www.google.com/maps?q=${item.lat},${item.lon}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400">
                          {item.from}
                          <IoMapSharp className="w-4 h-4 sm:w-4 sm:h-4 text-blue-500 dark:text-blue-400 ml-1 inline-block" />
                        </a>
                      </p>
                    </div>
                    <div className="hidden sm:block text-right w-full sm:w-auto">
                      <div className="text-xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">{formatTime(item.time)}</div>
                      <div className={`text-lg sm:text-2xl font-bold ${
                        item.eta === 'Nu' ? 'text-green-600 dark:text-green-400' : 
                        item.eta === 'Rejste' ? 'text-red-600 dark:text-red-400' : 
                        (() => {
                          const minutes = parseInt(item.eta || '0');
                          if (minutes < 5) return 'text-red-900 dark:text-red-300';
                          if (minutes < 10) return 'text-red-600 dark:text-red-400';
                          if (minutes < 15) return 'text-orange-500 dark:text-orange-400';
                          if (minutes < 20) return 'text-yellow-500 dark:text-yellow-400';
                          if (minutes < 25) return 'text-green-400 dark:text-green-300';
                          if (minutes < 30) return 'text-green-600 dark:text-green-400';
                          return 'text-[rgb(228,148,62)] dark:text-[rgb(228,148,62)]';
                        })()
                      }`}>
                        {item.eta}
                      </div>
                    </div>
                  </div>

                  {item.platform && ( 
                    <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Platform: {item.platform}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button
        onClick={() => router.push('/configure')}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-[rgb(228,148,62)] dark:bg-[rgb(228,148,62)] text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-200 flex items-center justify-center"
        aria-label="Configure"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 sm:h-6 sm:w-6" 
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

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-2 sm:p-4 flex items-center justify-center">
        <div className="text-xl text-gray-800 dark:text-gray-200">Loading...</div>
      </div>
    }>
      <DepartureBoard />
    </Suspense>
  );
}
