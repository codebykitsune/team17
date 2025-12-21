// @ts-ignore: Deno types
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// --- Types ---
interface LatLng {
    lat: number;
    lng: number;
}

interface User {
    id: string;
    lat: number | null;
    lng: number | null;
}

interface RouteMatrixElement {
    originIndex: number;
    destinationIndex: number;
    duration?: string; // "3600s"
    distanceMeters?: number;
    status?: { code: number; message: string };
    condition?: string;
}

// --- Configuration ---
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Helper Functions ---

function calculateCentroid(locations: LatLng[]): LatLng {
    if (locations.length === 0) return { lat: 0, lng: 0 };
    const sum = locations.reduce(
        (acc, curr) => ({ lat: acc.lat + curr.lat, lng: acc.lng + curr.lng }),
        { lat: 0, lng: 0 }
    );
    return { lat: sum.lat / locations.length, lng: sum.lng / locations.length };
}

async function searchNearbyStations(center: LatLng, apiKey: string): Promise<{ name: string; location: LatLng }[]> {
    const url = 'https://places.googleapis.com/v1/places:searchNearby';
    const body = {
        includedTypes: ['train_station', 'subway_station', 'light_rail_station'],
        maxResultCount: 5,
        rankPreference: 'POPULARITY',
        locationRestriction: {
            circle: {
                center: { latitude: center.lat, longitude: center.lng },
                radius: 2000.0
            }
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.displayName,places.location'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    // @ts-ignore
    if (!data.places) return [];

    // @ts-ignore
    return data.places.map((p: any) => ({
        name: p.displayName.text,
        location: {
            lat: p.location.latitude,
            lng: p.location.longitude
        }
    }));
}

async function computeTransitMatrix(
    origins: LatLng[],
    destinations: LatLng[],
    arrivalTime: string,
    apiKey: string
): Promise<RouteMatrixElement[]> {
    const url = `https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix`;
    const body = {
        origins: origins.map(o => ({ waypoint: { location: { latLng: { latitude: o.lat, longitude: o.lng } } } })),
        destinations: destinations.map(d => ({ waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } } })),
        travelMode: 'TRANSIT',
        arrivalTime: arrivalTime
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status,condition'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const txt = await response.text();
        console.error('Routes API Error:', txt);
        return [];
    }

    return await response.json();
}

async function searchRestaurants(location: LatLng, apiKey: string): Promise<any[]> {
    const range = 3;
    const url = `http://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=${apiKey}&lat=${location.lat}&lng=${location.lng}&range=${range}&format=json&count=5`;

    // Note: Use a proxy if blocking CORS, but server-to-server usually fine for HTTP
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    if (data.results && data.results.shop && data.results.shop.length > 0) {
        return data.results.shop;
    }
    return [];
}

// --- Main Handler ---

// @ts-ignore: Deno global
Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { event_id } = await req.json();
        if (!event_id) throw new Error('Event ID is required');

        // @ts-ignore: Deno global
        const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
        // @ts-ignore: Deno global
        const HOTPEPPER_KEY = Deno.env.get('HOTPEPPER_KEY');
        // @ts-ignore: Deno global
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
        // @ts-ignore: Deno global
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        if (!GOOGLE_MAPS_API_KEY || !HOTPEPPER_KEY) {
            throw new Error('Missing API Config');
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id, lat, lng')
            .eq('event_id', event_id);

        if (fetchError || !users || users.length === 0) throw new Error('No users found');

        const validUsers = users.filter((u: any) => u.lat != null && u.lng != null && u.lat !== 0 && u.lng !== 0) as User[];
        if (validUsers.length === 0) throw new Error('No valid user locations');

        const centroid = calculateCentroid(validUsers.map(u => ({ lat: u.lat!, lng: u.lng! })));

        let stations = await searchNearbyStations(centroid, GOOGLE_MAPS_API_KEY);

        // Fallback
        if (stations.length === 0) {
            stations.push({ name: "Middle Point", location: centroid });
        }

        // --- Determine Arrival Time from Schedules ---
        // 1. Fetch all schedules for these users
        const userIds = users.map((u: any) => u.id);
        const { data: schedules, error: schedError } = await supabase
            .from('schedules')
            .select('date')
            .in('user_id', userIds);

        let arrivalTime = "";

        if (!schedError && schedules && schedules.length > 0) {
            // 2. Count availability per date
            const counts: Record<string, number> = {};
            schedules.forEach((s: any) => {
                counts[s.date] = (counts[s.date] || 0) + 1;
            });

            // 3. Find Max
            let bestDate = "";
            let maxCount = -1;
            Object.keys(counts).forEach(date => {
                if (counts[date] > maxCount) {
                    maxCount = counts[date];
                    bestDate = date;
                } else if (counts[date] === maxCount) {
                    // Break tie: pick earliest?
                    if (new Date(date) < new Date(bestDate)) {
                        bestDate = date;
                    }
                }
            });
            arrivalTime = bestDate;
        }

        // Fallback if no schedules: Next Friday 19:00
        if (!arrivalTime) {
            const futureDate = new Date();
            const daysUntilFriday = (5 - futureDate.getDay() + 7) % 7;
            futureDate.setDate(futureDate.getDate() + (daysUntilFriday || 7));
            futureDate.setHours(19, 0, 0, 0);
            arrivalTime = futureDate.toISOString();
        }

        console.log("Using Arrival Time:", arrivalTime);

        const matrix = await computeTransitMatrix(
            validUsers.map(u => ({ lat: u.lat!, lng: u.lng! })),
            stations.map(s => s.location),
            arrivalTime,
            GOOGLE_MAPS_API_KEY
        );

        let bestStation = stations[0];
        let minMaxDuration = Infinity;
        const stationDurations: Record<number, number[]> = {};

        matrix.forEach(m => {
            if (!m.duration) return;
            const seconds = parseInt(m.duration.replace('s', ''));
            if (!stationDurations[m.destinationIndex]) stationDurations[m.destinationIndex] = [];
            stationDurations[m.destinationIndex].push(seconds);
        });

        stations.forEach((station, idx) => {
            const durations = stationDurations[idx] || [];
            if (durations.length === 0) return;
            const maxDuration = Math.max(...durations);
            if (maxDuration < minMaxDuration) {
                minMaxDuration = maxDuration;
                bestStation = station;
            }
        });

        const restaurant = await searchRestaurants(bestStation.location, HOTPEPPER_KEY);

        const { error: updateError } = await supabase
            .from('events')
            .update({
                restaurant_info: (restaurant && restaurant.length > 0) ? restaurant : [{ name: "Restaurant not found", text: "Please search manually nearby." }],
                target_station: bestStation.name,
                target_lat: bestStation.location.lat,
                target_lng: bestStation.location.lng,
                confirmed_date: arrivalTime,
            })
            .eq('id', event_id);

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({
                success: true,
                station: bestStation,
                restaurant: restaurant,
                center: centroid
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }
});
