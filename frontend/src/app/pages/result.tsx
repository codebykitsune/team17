import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import AnswersView from "../components/AnswersView";
import { FinalResultView } from "../components/FinalResultView";
import { supabase } from "../lib/supabaseClient";

type Participant = {
  id: string;
  name: string | null;
  dates: string[];
};

interface EventData {
  amount: number;
  confirmed_date: string | null;
  restaurant_info: any;
  target_station: string | null;
}

export default function Result() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [organizerName, setOrganizerName] = useState<string | null>(null);
  const [organizerDates, setOrganizerDates] = useState<string[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchResultData = async () => {
      if (!eventId) return;

      try {
        // 1. Fetch Event Data
        const { data: event, error: eventError } = await supabase
          .from("events")
          .select("amount, confirmed_date, restaurant_info, target_station")
          .eq("id", eventId)
          .single();

        if (eventError) throw eventError;
        setEventData(event);

        // 2. Fetch Organizer
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, name")
          .eq("event_id", eventId)
          .eq("role", "organizer")
          .single();

        if (userError || !userData) throw userError;
        setOrganizerId(userData.id);
        setOrganizerName(userData.name ?? null);

        const { data: scheduleData, error: schedError } = await supabase
          .from("schedules")
          .select("date")
          .eq("user_id", userData.id);

        if (schedError) throw schedError;
        setOrganizerDates((scheduleData || []).map((s) => s.date));

        // 3. Fetch Participants
        const { data: participantUsers, error: participantsError } = await supabase
          .from("users")
          .select("id, name")
          .eq("event_id", eventId)
          .neq("role", "organizer");

        if (participantsError) throw participantsError;

        const participantIds = (participantUsers ?? []).map((user) => user.id);

        const totalParticipants = 1 + participantIds.length;

        if (!event.confirmed_date && totalParticipants >= event.amount && !isFinalizing) {
          handleFinalizeEvent();
        }

        if (participantIds.length === 0) {
          setParticipants([]);
          return;
        }

        const { data: participantSchedules, error: participantSchedError } = await supabase
          .from("schedules")
          .select("user_id, date")
          .in("user_id", participantIds);

        if (participantSchedError) throw participantSchedError;

        const schedulesByUser = new Map<string, string[]>();
        (participantSchedules ?? []).forEach((schedule) => {
          const dates = schedulesByUser.get(schedule.user_id) ?? [];
          dates.push(schedule.date);
          schedulesByUser.set(schedule.user_id, dates);
        });

        setParticipants(
          participantIds.map((id) => {
            const user = participantUsers?.find((participant) => participant.id === id);
            return {
              id,
              name: user?.name ?? null,
              dates: schedulesByUser.get(id) ?? []
            };
          })
        );
      } catch (err: any) {
        console.error("Error fetching data:", err);
        const msg = err.message || "データの取得に失敗しました";
        setErrorMessage(msg);
        toast.error(msg);
      }
    };

    fetchResultData();
  }, [eventId]);

  const handleFinalizeEvent = async () => {
    if (!eventId || isFinalizing) return;
    setIsFinalizing(true);
    try {
      const { error } = await supabase.functions.invoke('finalize-event', {
        body: { event_id: eventId },
      });

      if (error) throw error;

      window.location.reload();

    } catch (err: any) {
      console.error("Failed to finalize event:", err);
      toast.error(`イベントの確定に失敗しました: ${err.message}`);
      setIsFinalizing(false);
    }
  };

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-gray-50">
        <h1 className="text-xl font-bold text-red-600 mb-4">エラーが発生しました</h1>
        <p className="text-gray-700 mb-6">{errorMessage}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition"
        >
          再読み込み
        </button>
      </div>
    );
  }

  if (!eventData) return <div className="p-10 text-center">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <img src="/meetAndEat_circle.png" alt="Meet and Eat Circle Icon" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl text-gray-900">ミートアンドイート</h1>
              <p className="text-xs text-gray-500">Meet and Eat</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {eventData.confirmed_date ? (
          <div className="w-full px-4 max-w-screen-lg mx-auto mt-20">
            <FinalResultView
              confirmedDate={eventData.confirmed_date}
              restaurantInfo={eventData.restaurant_info}
              nearestStation={eventData.target_station || "不明な駅"}
            />
          </div>
        ) : isFinalizing ? (
          <div className="flex flex-col items-center justify-center mt-20 p-10">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-xl font-semibold text-gray-700">イベントを確定中...</p>
            <p className="text-gray-500">最適なスケジュールとお店を計算しています！</p>
          </div>
        ) : (
          <div className="w-full px-4 max-w-screen-lg mx-auto mt-20">
            <AnswersView
              organizerId={organizerId}
              organizerName={organizerName}
              organizerDates={organizerDates}
              participants={participants}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg mb-4">ミートアンドイート</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                位置情報を使って中間地点のレストランを自動提案する、ログイン不要のイベント調整サービスです。
              </p>
            </div>
            <div>
              <h4 className="text-sm mb-4 text-gray-300">使用技術</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Google Routes API</li>
                <li>ホットペッパーAPI</li>
                <li>Compute Route Matrix Pro</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm mb-4 text-gray-300">サービスについて</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                幹事の負担を減らし、みんなが集まりやすい場所で楽しい時間を過ごすためのツールです。
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            技育CAMPハッカソン vol.16
            © 2025 ノリノリノリノリ. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}