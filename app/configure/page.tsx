'use client';

import { useState, useEffect, useCallback } from 'react';
import { InfoCircledIcon, Cross2Icon } from '@radix-ui/react-icons';
import { LocationSearchParams } from '@/app/types/location-search';
import { useRouter } from 'next/navigation';

interface Configuration {
  location: LocationSuggestion;
  duration: number|string|undefined;
  products: {
    bus: boolean;
    train: boolean;
  };
  direction: LocationSuggestion;
}

interface LocationSuggestion {
  id: string;
  name: string;
  extId: string;
}

interface TooltipProps {
  text: string;
}

const fetchLocationSearch = async (params: LocationSearchParams) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
          queryParams.append(key, String(value));
      }
  });

  const response = await fetch(`/api/location-search?${queryParams}`);
  if (!response.ok) {
      throw new Error('Failed to fetch location search');
  }
  return response.json();
};

const Tooltip = ({ text }: TooltipProps) => (
  <div className="group inline-block ml-1">
    <InfoCircledIcon className="w-4 h-4 text-gray-500 inline-block cursor-help" />
    <div className="opacity-0 bg-black text-white text-sm rounded-lg py-2 px-3 absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 group-hover:opacity-100 transition-opacity">
      {text}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
        <div className="border-8 border-transparent border-t-black" />
      </div>
    </div>
  </div>
);

export default function Configure() {
  const router = useRouter();
  const [config, setConfig] = useState<Configuration>({
    location: {
      id: '',
      name: '',
      extId: '',
    },
    duration: 15,
    products: {
      bus: false,
      train: false,
    },
    direction: {
      id: '',
      name: '',
      extId: '',
    },
  });

  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [shouldSearchLocation, setShouldSearchLocation] = useState(true);


  const debouncedSearch = useCallback(
    (value: string, setLoading: (loading: boolean) => void, setSuggestions: (suggestions: LocationSuggestion[]) => void) => {
      if (value.length < 4) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      fetchLocationSearch({ input: value })
        .then((data) => {
          setSuggestions(data);
        })
        .catch((error) => {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    []
  );

  useEffect(() => {
    if (!shouldSearchLocation || loadingField === null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      debouncedSearch(config[loadingField].name, setIsLoadingLocation, setLocationSuggestions);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [config.location.name, config.direction.name, debouncedSearch, shouldSearchLocation, loadingField]);


  const handleLocationSelect = (field: 'location' | 'direction') => (suggestion: LocationSuggestion) => {
    setShouldSearchLocation(false);
    setConfig(prev => ({ ...prev, [field]: suggestion }));
    setLocationSuggestions([]);
    setLoadingField(null);
  };

  const handleLocationChange = (field: 'location' | 'direction') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setShouldSearchLocation(true);
    setLoadingField(field);
    setConfig(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        name: e.target.value,
      }
    }));
  };


  const clearLocation = (field: 'location' | 'direction') => () => {
    setConfig(prev => ({ ...prev, [field]: {
      id: '',
      name: '',
      extId: '',
    } }));
    setLocationSuggestions([]);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('rejseplanen-config', JSON.stringify(config));
    console.log('Configuration saved to localStorage');
    router.push('/');
  };

  // Load saved configuration on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('rejseplanen-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error loading saved configuration:', error);
      }
    }
  }, []);

  const handleProductChange = (product: 'bus' | 'train') => {
    setConfig(prev => ({
      ...prev,
      products: {
        ...prev.products,
        [product]: !prev.products[product],
      },
    }));
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Configure</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="location" className="block text-sm font-medium mb-1">
            Location
            <Tooltip text="Enter the starting point for your journey (e.g., city name, station, or address)" />
          </label>
          <div className="relative">
            <input
              type="text"
              id="location"
              value={config.location.name}
              onChange={handleLocationChange('location')}
              className="w-full p-2 pr-8 border rounded-md"
              required
            />
            {config.location.name && (
              <button
                type="button"
                onClick={clearLocation('location')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Cross2Icon className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          {isLoadingLocation && (
            <div className="absolute z-10 w-full bg-white border rounded-md mt-1 p-2">
              Loading...
            </div>
          )}
          {!isLoadingLocation && locationSuggestions.length > 0 && loadingField === 'location' && (
            <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-60 overflow-auto">
              {locationSuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleLocationSelect('location')(suggestion)}
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium mb-1">
            Duration (minutes)
            {/* <Tooltip text="Specify how long you're willing to travel (in minutes)" /> */}
          </label>
          <input
            type="number"
            id="duration"
            value={config.duration}
            onChange={(e) => setConfig(prev => ({ ...prev, duration: e.target.value }))}
            className="w-full p-2 border rounded-md"
            min="5"
            max="30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Products
            {/* <Tooltip text="Select which transportation methods you'd like to include in your journey" /> */}
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.products.bus}
                onChange={() => handleProductChange('bus')}
                className="rounded"
              />
              Bus
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.products.train}
                onChange={() => handleProductChange('train')}
                className="rounded"
              />
              Train
            </label>
          </div>
        </div>

        <div className="relative">
          <label htmlFor="direction" className="block text-sm font-medium mb-1">
            Direction
            <Tooltip text="Enter your desired destination or general direction of travel" />
          </label>
          <div className="relative">
            <input
              type="text"
              id="direction"
              value={config.direction.name}
              onChange={handleLocationChange('direction')}
              className="w-full p-2 pr-8 border rounded-md"
            />
            {config.direction && (
              <button
                type="button"
                onClick={clearLocation('direction')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Cross2Icon className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          {isLoadingLocation && (
            <div className="absolute z-10 w-full bg-white border rounded-md mt-1 p-2">
              Loading...
            </div>
          )}
          {!isLoadingLocation && locationSuggestions.length > 0 && loadingField === 'direction' && (
            <ul className="absolute z-10 w-full bg-white border rounded-md mt-1 max-h-60 overflow-auto">
              {locationSuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleLocationSelect('direction')(suggestion)}
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
        >
          Save Configuration
        </button>
      </form>
    </div>
  );
}
