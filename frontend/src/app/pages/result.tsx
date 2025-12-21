import { useEffect, useState } from "react";
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

        // If already confirmed, we can skip fetching participants if we only want to show the result
        // But let's fetch everything for now just in case we need it or to handle the transition smoothly

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

        // Check for Finalization Condition
        // Total users = Organizer (1) + Participants
        // If event.amount includes organizer, then total count is 1 + participantIds.length
        // Assuming event.amount is the total target number of people.
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
      } catch (err) {
        console.error("Error fetching data:", err);
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

      // Reload page or re-fetch data to show results
      window.location.reload();

    } catch (err) {
      console.error("Failed to finalize event:", err);
      setIsFinalizing(false);
    }
  };

  if (!eventData) return <div className="p-10 text-center">読み込み中...</div>;

  if (eventData.confirmed_date) {
    return (
      <div className="w-full px-4 max-w-screen-lg mx-auto mt-20">
        <FinalResultView
          confirmedDate={eventData.confirmed_date}
          restaurantInfo={eventData.restaurant_info}
          nearestStation={eventData.target_station || "不明な駅"}
        />
      </div>
    );
  }

  if (isFinalizing) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 p-10">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-xl font-semibold text-gray-700">イベントを確定中...</p>
        <p className="text-gray-500">最適なスケジュールとお店を計算しています！</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 max-w-screen-lg mx-auto mt-20">
      <AnswersView
        organizerId={organizerId}
        organizerName={organizerName}
        organizerDates={organizerDates}
        participants={participants}
      />
    </div>
  );
}
