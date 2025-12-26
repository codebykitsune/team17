import { useState, useEffect } from 'react';
import { LocationData } from '../components/LocationSearch';

export type NominatimResult = {
    display_name: string;
    lat: string;
    lon: string;
};

export function useLocationSearch(onSelect: (location: LocationData) => void, defaultValue = "") {
    const [query, setQuery] = useState(defaultValue);
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [detectedAddress, setDetectedAddress] = useState<string | null>(null);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 1 && isOpen) {
                searchLocation(query);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, isOpen]);

    const searchLocation = async (q: string) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                q: q,
                format: 'json',
                addressdetails: '1',
                limit: '5',
                countrycodes: 'jp'
            });
            const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
            const data = await res.json();
            setResults(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchNearestStation = async (lat: number, lon: number): Promise<{ name: string, lat: number, lng: number } | null> => {
        try {
            const res = await fetch(`https://express.heartrails.com/api/json?method=getStations&x=${lon}&y=${lat}`);
            const data = await res.json();
            // HeartRails returns response.station as an array. The first one is nearest.
            if (data?.response?.station?.[0]) {
                const station = data.response.station[0];
                return {
                    name: station.name,
                    lat: parseFloat(station.y), // y is latitude
                    lng: parseFloat(station.x)  // x is longitude
                };
            }
        } catch (error) {
            console.error("HeartRails API failed", error);
        }
        return null;
    };

    const reverseGeocode = async (lat: number, lon: number) => {
        setIsLoading(true);
        try {
            // 1. Try HeartRails first (Best for Japanese stations)
            const stationData = await fetchNearestStation(lat, lon);
            let name = "";
            let targetLat = lat;
            let targetLng = lon;

            if (stationData) {
                name = stationData.name;
                // HeartRails returns just the name e.g. "新宿". Append "駅" if likely a station.
                if (!name.endsWith('駅')) {
                    name = `${name}駅`;
                }
                // Use station coordinates instead of browser GPS
                targetLat = stationData.lat;
                targetLng = stationData.lng;
            } else {
                // 2. Fallback to Nominatim if no station found
                const params = new URLSearchParams({
                    lat: lat.toString(),
                    lon: lon.toString(),
                    format: 'json',
                });
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);
                const data = await res.json();

                if (data && data.display_name) {
                    // Use the first part of the address
                    name = data.display_name.split(',')[0];
                }
            }

            if (name) {
                setQuery(name);
                setDetectedAddress(name); // Set specific GPS address for display
                onSelect({
                    name: name,
                    lat: targetLat,
                    lng: targetLng
                });
            } else {
                alert("場所を特定できませんでした");
            }
        } catch (error) {
            console.error("Reverse geocode failed", error);
            alert("場所の特定に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert("お使いのブラウザは位置情報をサポートしていません");
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                reverseGeocode(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error("Geolocation error", error);
                setIsLoading(false);
                alert("位置情報の取得に失敗しました。権限を確認してください。");
            }
        );
    };

    const handleSelect = (result: NominatimResult) => {
        const name = result.display_name.split(',')[0];
        setQuery(name);
        setDetectedAddress(null); // Clear manual detection if picking from list
        setIsOpen(false);
        onSelect({
            name: name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        });
    };

    return {
        query,
        setQuery,
        results,
        isLoading,
        isOpen,
        setIsOpen,
        detectedAddress,
        setDetectedAddress,
        handleGetCurrentLocation,
        handleSelect
    };
}
