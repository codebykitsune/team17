import { useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, MapPin, Search, Navigation } from 'lucide-react';
import { useLocationSearch, NominatimResult } from '../hooks/useLocationSearch';

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

export function LocationSearch({ onSelect, placeholder = "駅名を検索...", defaultValue = "" }: LocationSearchProps) {
    const {
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
    } = useLocationSearch(onSelect, defaultValue);

    const wrapperRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, setIsOpen]);

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
                            {results.map((result: NominatimResult, index) => (
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
