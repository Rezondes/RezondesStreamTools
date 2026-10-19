// One symbol of icons.ts as SVG: the colored shape with the outline, an optional second tone and open lines, colored by
// the CSS classes of the theme (part-icon, part-icon-detail, part-line).
import { ICONS, type IconName } from "./icons.ts";

export default function IconShape({ name, className = "" }: { name: IconName; className?: string }) {
  const icon = ICONS[name];
  return (
    <svg className={`bb-icon ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      <path className="part-icon" d={icon.fill} />
      {icon.detail && <path className="part-icon-detail" d={icon.detail} />}
      {icon.line && <path className="part-line" d={icon.line} />}
    </svg>
  );
}
