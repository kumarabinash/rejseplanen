'use client';

import { useState, useEffect, useCallback } from 'react';
import { LocationSearchParams } from '@/app/types/location-search';
import { useRouter } from 'next/navigation';
import { FaCopy, FaSave, FaTimes, FaInfoCircle } from "react-icons/fa";
import { toast } from 'react-hot-toast';
import Tooltip from '@mui/material/Tooltip';

interface Configuration {
  location: LocationSuggestion;
  duration: number | string | undefined;
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

  const hasSavedConfig = Boolean(localStorage.getItem('rejseplanen-config'));

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
      if (loadingField === 'location' || loadingField === 'direction') {
        debouncedSearch(config[loadingField].name, setIsLoadingLocation, setLocationSuggestions);
      }
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
    setConfig(prev => ({
      ...prev, [field]: {
        id: '',
        name: '',
        extId: '',
      }
    }));
    setLocationSuggestions([]);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('rejseplanen-config', JSON.stringify(config));
    toast.success('Configuration saved');
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

  const handleCopy = () => {
    const url = encodeURI(`${window.location.origin}/?locationExtId=${config.location.extId}&locationName=${config.location.name}&duration=${config.duration}${config.products.bus ? '&bus=true' : ''}${config.products.train ? '&train=true' : ''}&directionExtId=${config.direction.extId}&directionName=${config.direction.name}`);
    navigator.clipboard.writeText(url);
    toast.success('Copied to clipboard');
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-md mx-auto dark:bg-gray-900">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Configure</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <label htmlFor="location" className="block text-sm font-medium mb-1 dark:text-gray-200">
            Location
            <Tooltip title="Enter the starting point for your journey (e.g., city name, station, or address)" className="font-martian-mono">
              <FaInfoCircle className="ml-1 w-4 h-4 text-gray-500 dark:text-gray-400 inline-block cursor-help" />
            </Tooltip>
          </label>
          <div className="relative">
            <input
              type="text"
              id="location"
              value={config.location.name}
              onChange={handleLocationChange('location')}
              className="w-full p-2 pr-8 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              required
            />
            {config.location.name && (
              <button
                type="button"
                onClick={clearLocation('location')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <FaTimes className="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
              </button>
            )}
          </div>
          {isLoadingLocation && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md mt-1 p-2 dark:text-white">
              Loading...
            </div>
          )}
          {!isLoadingLocation && locationSuggestions.length > 0 && loadingField === 'location' && (
            <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md mt-1 max-h-60 overflow-auto">
              {locationSuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer dark:text-white"
                  onClick={() => handleLocationSelect('location')(suggestion)}
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label htmlFor="duration" className="block text-sm font-medium mb-1 dark:text-gray-200">
            Duration (minutes)
            <Tooltip title="Specify how long you're willing to travel (in minutes)" className="font-martian-mono">
              <FaInfoCircle className="ml-1 w-4 h-4 text-gray-500 dark:text-gray-400 inline-block cursor-help" />
            </Tooltip>
          </label>
          <input
            type="number"
            id="duration"
            value={config.duration}
            onChange={(e) => setConfig(prev => ({ ...prev, duration: e.target.value }))}
            className="w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            min="5"
            max="30"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">
            Products
            {/* <Tooltip text="Select which transportation methods you'd like to include in your journey" /> */}
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 dark:text-gray-200">
              <input
                type="checkbox"
                checked={config.products.bus}
                onChange={() => handleProductChange('bus')}
                className="rounded dark:bg-gray-800 dark:border-gray-700"
              />
              Bus
            </label>
            <label className="flex items-center gap-2 dark:text-gray-200">
              <input
                type="checkbox"
                checked={config.products.train}
                onChange={() => handleProductChange('train')}
                className="rounded dark:bg-gray-800 dark:border-gray-700"
              />
              Train
            </label>
          </div>
        </div>

        <div className="relative">
          <label htmlFor="direction" className="block text-sm font-medium mb-1 dark:text-gray-200">
            Direction
            <Tooltip title="Enter your desired destination or general direction of travel" className="font-martian-mono">
              <FaInfoCircle className="ml-1 w-4 h-4 text-gray-500 dark:text-gray-400 inline-block cursor-help" />
            </Tooltip>
          </label>
          <div className="relative">
            <input
              type="text"
              id="direction"
              value={config.direction.name}
              onChange={handleLocationChange('direction')}
              className="w-full p-2 pr-8 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            {config.direction.name && (
              <button
                type="button"
                onClick={clearLocation('direction')}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <FaTimes className="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-pointer" />
              </button>
            )}
          </div>
          {isLoadingLocation && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md mt-1 p-2 dark:text-white">
              Loading...
            </div>
          )}
          {!isLoadingLocation && locationSuggestions.length > 0 && loadingField === 'direction' && (
            <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md mt-1 max-h-60 overflow-auto">
              {locationSuggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer dark:text-white"
                  onClick={() => handleLocationSelect('direction')(suggestion)}
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex gap-2">
          {hasSavedConfig ? (
            <button
              type="button"
              onClick={() => {
                router.push('/');
              }}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-md hover:bg-red-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          ) : null}

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <FaSave className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <FaCopy className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
