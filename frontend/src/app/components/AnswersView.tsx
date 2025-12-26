type CellValue = "circle" | "cross" | null;

type Row = {
  labelLines: string[];
  cells: CellValue[];
  highlight?: boolean;
};

type AnswersViewProps = {
  organizerId: string | null;
  organizerName: string | null;
  organizerDates: string[];
  participants: {
    id: string;
    name: string | null;
    dates: string[];
  }[];
};

const formatDateLabel = (isoString: string) => {
  // Ensure the string is treated as UTC if it doesn't have timezone info
  const dateStr = isoString.endsWith("Z") || isoString.includes("+") ? isoString : `${isoString}Z`;
  const date = new Date(dateStr);
  const dateLabel = date.toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  });
  const timeLabel = date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return [dateLabel, timeLabel];
};

export default function AnswersView({
  organizerId,
  organizerName,
  organizerDates,
  participants
}: AnswersViewProps) {
  const organizerLabel = organizerName ?? organizerId ?? "幹事";
  const participantLabels = participants.map(
    (participant) => participant.name ?? participant.id ?? "参加者"
  );
  const columns = ["", organizerLabel, ...participantLabels];
  const uniqueDates = Array.from(new Set(organizerDates)).sort();
  const participantDateSets = new Map(
    participants.map((participant) => [participant.id, new Set(participant.dates)])
  );
  const rowsWithMeta = uniqueDates.map((date) => {
    const participantCells = participants.map((participant) =>
      participantDateSets.get(participant.id)?.has(date) ? "circle" : "cross"
    );
    const circleCount =
      1 + participantCells.reduce((count, cell) => (cell === "circle" ? count + 1 : count), 0);
    return {
      date,
      row: {
        labelLines: formatDateLabel(date),
        cells: ["circle", ...participantCells] as CellValue[]
      },
      circleCount
    };
  });

  const bestCandidate =
    rowsWithMeta
      .slice()
      .sort((a, b) => {
        if (b.circleCount !== a.circleCount) return b.circleCount - a.circleCount;
        return a.date.localeCompare(b.date);
      })[0] ?? null;

  const rows: Row[] = rowsWithMeta.map(({ date, row }) => ({
    ...row,
    highlight: bestCandidate?.date === date
  }));

  const renderMark = (value: "circle" | "cross" | null) => {
    if (value === "circle") return "○";
    if (value === "cross") return "×";
    return "";
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="py-2 font-semibold text-lg">
        最適な候補：{bestCandidate ? formatDateLabel(bestCandidate.date).join(" ") : "未定"}
      </div>
      <table className="min-w-[720px] w-full table-fixed border border-slate-300 text-sm text-slate-900">
        <colgroup>
          <col className="w-[220px]" />
          {columns.slice(1).map((name) => (
            <col key={name} className="w-[125px]" />
          ))}
        </colgroup>
        <thead>
          <tr className="bg-white text-black">
            {columns.map((name) => (
              <th
                key={name || "time"}
                className="border border-slate-300 border-b-3 px-3 py-3 text-center font-semibold "
              >
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={row.highlight ? "bg-orange-200" : "bg-white"}>
              <th className="border border-slate-300 px-3 py-4 text-left font-normal">
                <div className="leading-tight">
                  {row.labelLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </th>
              {row.cells.map((value, cellIndex) => (
                <td key={cellIndex} className="border border-slate-300 px-3 py-4 text-center text-lg">
                  {renderMark(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
