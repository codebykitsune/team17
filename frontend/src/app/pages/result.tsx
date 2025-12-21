import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AnswersView from "../components/AnswersView";
import { supabase } from "../lib/supabaseClient";

type Participant = {
  id: string;
  name: string | null;
  dates: string[];
};

export default function Result() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId");
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [organizerName, setOrganizerName] = useState<string | null>(null);
  const [organizerDates, setOrganizerDates] = useState<string[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    const fetchResultData = async () => {
      if (!eventId) {
        setOrganizerId(null);
        setOrganizerName(null);
        setOrganizerDates([]);
        setParticipants([]);
        return;
      }
      try {
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

        if (schedError || !scheduleData) throw schedError;

        setOrganizerDates(scheduleData.map((s) => s.date));

        const { data: participantUsers, error: participantsError } = await supabase
          .from("users")
          .select("id, name")
          .eq("event_id", eventId)
          .neq("role", "organizer");

        if (participantsError) throw participantsError;

        const participantIds = (participantUsers ?? []).map((user) => user.id);
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
        console.error("Error fetching organizer schedules:", err);
      }
    };

    fetchResultData();
  }, [eventId]);

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
