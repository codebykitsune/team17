export default function AnswersView() {
  type CellValue = "circle" | "cross" | null;

  type Row = {
    labelLines: string[];
    cells: CellValue[];
    highlight?: boolean;
  };

  const columns = ["", "藤巻", "りん", "田上", "はつ"];
  const rows: Row[] = [
    {
      labelLines: ["12/17（水）", "18:00~19:00"],
      cells: ["circle", "cross", "cross", "cross"]
    },
    {
      labelLines: ["12/17（水）", "19:00~20:00"],
      cells: ["cross", "circle", "circle", "cross"]
    },
    {
      labelLines: ["12/18（木）", "23:00~24:00"],
      cells: ["circle", "circle", "circle", "circle"],
      highlight: true
    },
    {
      labelLines: ["hogehoge", "hoge"],
      cells: [null, null, null, null]
    },
    {
      labelLines: ["hogehoge", "hoge"],
      cells: [null, null, null, null]
    }
  ];

  const renderMark = (value: "circle" | "cross" | null) => {
    if (value === "circle") return "○";
    if (value === "cross") return "×";
    return "";
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="py-2 font-semibold text-lg">最適な候補：</div>
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
            <tr key={rowIndex} className={row.highlight ? "bg-sky-200" : "bg-white"}>
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
