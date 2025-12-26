import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, MapPin, Search, Navigation } from 'lucide-react';

export interface LocationData {
    name: string;
    lat: number;
    lng: number;
}

export interface LocationSearchProps {
    onSelect: (location: LocationData) => void;
    placeholder?: string;
    defaultValue?: string;
}

type NominatimResult = {
    display_name: string;
    lat: string;
    lon: string;
};

export function LocationSearch({ onSelect, placeholder = "駅名を検索...", defaultValue = "" }: LocationSearchProps) {
    const [query, setQuery] = useState(defaultValue);
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 1 && isOpen) {
                searchLocation(query);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, isOpen]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

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
    }

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

    return (
        <div className="w-full" ref={wrapperRef}>
            <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-2">
                    <TabsTrigger value="search" className="flex items-center gap-2">
                        <Search className="w-4 h-4" /> 検索
                    </TabsTrigger>
                    <TabsTrigger value="current" className="flex items-center gap-2">
                        <Navigation className="w-4 h-4" /> 現在地
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="search" className="relative mt-0">
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder={placeholder}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setDetectedAddress(null); // Clear detection if user types manual query
                                setIsOpen(true);
                            }}
                            onFocus={() => setIsOpen(true)}
                            className="pl-10 h-11 w-full"
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-3">
                                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                            </div>
                        )}
                    </div>

                    {isOpen && results.length > 0 && (
                        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {results.map((result, index) => (
                                <li
                                    key={index}
                                    className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm text-gray-700 border-b last:border-0"
                                    onClick={() => handleSelect(result)}
                                >
                                    {result.display_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </TabsContent>

                <TabsContent value="current" className="mt-0">
                    <Button
                        variant="outline"
                        className="w-full h-11 border-dashed border-2 flex items-center justify-center gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                        onClick={handleGetCurrentLocation}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Navigation className="w-4 h-4" />}
                        現在地を取得して設定
                    </Button>

                    {detectedAddress && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs text-green-800 font-semibold mb-1">取得された位置情報:</p>
                            <div className="flex items-center gap-2 text-green-700">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span className="font-medium text-sm break-all">{detectedAddress}</span>
                            </div>
                            <p className="mt-2 text-xs text-green-600/80">
                                ※意図しない場所の場合は、検索タブから駅や施設名を指定してください
                            </p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
