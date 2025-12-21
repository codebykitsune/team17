import { Calendar, MapPin, Clock } from "lucide-react";

interface Restaurant {
    name: string;
    address: string;
    urls: { pc: string };
    genre?: { name: string };
}

interface FinalResultViewProps {
    confirmedDate: string;
    restaurantInfo: Restaurant[];
    nearestStation: string;
}

export const FinalResultView = ({ confirmedDate, restaurantInfo, nearestStation }: FinalResultViewProps) => {
    const dateObj = new Date(confirmedDate);
    const dateStr = dateObj.toLocaleDateString("ja-JP", {
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
    });
    const timeStr = dateObj.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
    });



    return (
        <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">イベントが確定しました！🎉</h1>

            {/* Date & Time */}
            <div className="flex items-center gap-4 mb-6 w-full p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="p-3 bg-white rounded-full shadow-sm">
                    <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">日付</p>
                    <p className="text-lg font-bold text-gray-800">{dateStr}</p>
                </div>
                <div className="ml-8">
                    <p className="text-sm text-gray-500 font-medium">時間</p>
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <p className="text-lg font-bold text-gray-800">{timeStr}</p>
                    </div>
                </div>
            </div>

            {/* Location / Station */}
            <div className="w-full mb-6 text-left">
                <h2 className="text-sm font-semibold text-gray-500 mb-2">集合場所</h2>
                <div className="flex items-center gap-2 text-lg font-medium text-gray-800">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    {nearestStation}
                </div>
            </div>

            {/* Restaurant Info */}
            {/* Restaurant Info */}
            <div className="w-full border-t border-gray-100 pt-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">お店一覧</h2>
                {restaurantInfo.map((shop, index) => (
                    <div key={index} className="flex flex-col gap-2 mb-6 border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                        <h3 className="text-xl font-bold text-gray-900">{index + 1}. {shop.name}</h3>
                        {shop.genre && <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs w-fit">{shop.genre.name}</span>}
                        <p className="text-gray-600 mt-2 text-sm">{shop.address}</p>

                        {shop.urls?.pc && (
                            <a
                                href={shop.urls.pc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 text-center w-full block bg-orange-500 text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                            >
                                お店の詳細を見る
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
