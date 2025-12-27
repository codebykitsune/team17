import { useState, useEffect } from 'react';
import { LocationData } from '../components/LocationSearch';

export type NominatimAddress = {
    province?: string;
    city?: string;
    town?: string;
    village?: string;
    ward?: string;
    city_district?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
    house_number?: string;
    amenity?: string;
    building?: string;
    shop?: string;
    office?: string;
    tourism?: string;
    historic?: string;
    [key: string]: string | undefined;
};

export type NominatimResult = {
    display_name: string;
    lat: string;
    lon: string;
    address?: NominatimAddress;
};

export function useLocationSearch(onSelect: (location: LocationData) => void, defaultValue = "") {
    const [query, setQuery] = useState(defaultValue);
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 1 && isOpen) {
                searchLocation(query);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, isOpen]);

    const formatAddress = (result: NominatimResult): { name: string; region: string } => {
        if (!result.address) {
            const parts = result.display_name.split(',');
            return {
                name: parts[0],
                region: parts.slice(1).join(',').trim()
            };
        }

        const { address } = result;
        // 都道府県: state, province, regionなどの揺らぎに対応
        const prefecture = address.state || address.province || address.region || "";
        // 市区町村 (Municipality): city, ward, town, village
        const city = address.city || address.ward || address.town || address.village || "";
        const region = `${prefecture}${city}`;

        // 名前: display_nameの先頭部分を使用し、セミコロンで区切られた詳細情報（出口番号など）を除去
        let namePart = result.display_name.split(',')[0];
        namePart = namePart.split(';')[0]; // "新宿駅;3番出口" -> "新宿駅"

        return { name: namePart, region };
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

    const searchLocation = async (q: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // ... keys ...
            const params = new URLSearchParams({
                q: q,
                format: 'json',
                addressdetails: '1',
                limit: '5',
                countrycodes: 'jp'
            });
            // accept-language header for ensure Japanese
            const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
                headers: { 'Accept-Language': 'ja' }
            });
            const data = await res.json();
            setResults(data);
            if (data.length === 0) {
                setError("検索結果が見つかりませんでした");
            }
        } catch (error) {
            console.error("Search failed", error);
            setError("検索に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    // ... fetchNearestStation ...

    const reverseGeocode = async (lat: number, lon: number) => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Try HeartRails first
            // ...
            // (Keep existing logic but replace alerts)

            const stationData = await fetchNearestStation(lat, lon);
            let name = "";
            let targetLat = lat;
            let targetLng = lon;

            if (stationData) {
                name = stationData.name;
                if (!name.endsWith('駅')) {
                    name = `${name}駅`;
                }
                targetLat = stationData.lat;
                targetLng = stationData.lng;
            } else {
                // 2. Fallback to Nominatim
                const params = new URLSearchParams({
                    lat: lat.toString(),
                    lon: lon.toString(),
                    format: 'json',
                    addressdetails: '1' // Ensure we get address details
                });
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
                    headers: { 'Accept-Language': 'ja' }
                });
                const data = await res.json();

                if (data) {
                    if (data.address) {
                        const tempResult: NominatimResult = {
                            display_name: data.display_name,
                            lat: data.lat,
                            lon: data.lon,
                            address: data.address
                        };
                        const formatted = formatAddress(tempResult);
                        name = formatted.region ? `${formatted.name} ${formatted.region}` : formatted.name;
                    } else if (data.display_name) {
                        name = data.display_name.split(',')[0];
                    }
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
                setError("場所を特定できませんでした");
            }
        } catch (error) {
            console.error("Reverse geocode failed", error);
            setError("場所の特定に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetCurrentLocation = () => {
        setError(null);
        if (!navigator.geolocation) {
            setError("お使いのブラウザは位置情報をサポートしていません");
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
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError("位置情報の利用が許可されていません。ブラウザの設定をご確認ください。");
                        break;
                    case error.POSITION_UNAVAILABLE:
                        setError("位置情報を取得できませんでした。");
                        break;
                    case error.TIMEOUT:
                        setError("位置情報の取得がタイムアウトしました。");
                        break;
                    default:
                        setError("位置情報の取得に失敗しました。");
                }
            }
        );
    };

    const handleSelect = (result: NominatimResult) => {
        setError(null);
        const formatted = formatAddress(result);
        const displayName = formatted.region ? `${formatted.name} ${formatted.region}` : formatted.name;

        setQuery(displayName);
        setDetectedAddress(null);
        setIsOpen(false);
        onSelect({
            name: displayName,
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
        error, // Expose error
        handleGetCurrentLocation,
        handleSelect,
        formatAddress
    };
}
