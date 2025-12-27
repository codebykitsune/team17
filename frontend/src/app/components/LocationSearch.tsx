import { useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Loader2, MapPin, Search, Navigation, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
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
        handleSelect,
        formatAddress,
        error
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

                    {error && (
                        <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>検索結果なし</AlertTitle>
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {isOpen && results.length > 0 && (
                        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {results.map((result: NominatimResult, index) => (
                                <li
                                    key={index}
                                    className="px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm text-gray-700 border-b last:border-0"
                                    onClick={() => handleSelect(result)}
                                >
                                    {(() => {
                                        const formatted = formatAddress(result);
                                        return (
                                            <div className="flex flex-col">
                                                <div className="font-medium text-gray-900">
                                                    {formatted.name}
                                                    {formatted.region && <span className="ml-2 font-normal text-gray-700">({formatted.region})</span>}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5 truncate">
                                                    {result.display_name}
                                                </div>
                                            </div>
                                        );
                                    })()}
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
                        <Alert className="mt-4 border-green-200 bg-green-50/50 text-green-900">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">位置情報を取得しました</AlertTitle>
                            <AlertDescription className="text-green-700">
                                <div className="flex items-center gap-1 mt-1 font-medium">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {detectedAddress}
                                </div>
                                <div className="text-xs text-green-600/80 mt-1">
                                    ※意図しない場所の場合は、検索タブから駅や施設名を指定してください
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>取得エラー</AlertTitle>
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
