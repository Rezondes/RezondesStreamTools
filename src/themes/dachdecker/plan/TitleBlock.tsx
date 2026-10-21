// Title block of the Dachdecker screens (DESIGN-DACHDECKER.md "Schriftfeld"): a table of white plan lines bottom right,
// one row per line of the setting, | splits a row into cells; the later cells of the last row are copper (date or
// status). Placeholders are filled by the scene.
type Props = { lines: readonly string[]; opacity: number };

export default function TitleBlock({ lines, opacity }: Props) {
  const rows = lines.map(line => line.split("|").map(cell => cell.trim())).filter(cells => cells.some(Boolean));
  if (rows.length === 0) return null;
  return (
    <div className="dd-block" style={{ opacity }}>
      {rows.map((cells, row) => (
        <div key={row} className="dd-block-row">
          {cells.map((cell, index) => (
            <span key={index} className={row === rows.length - 1 && index > 0 ? "dd-copper" : undefined}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
