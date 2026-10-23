// A bon under its printer (DESIGN-KEBAB.md "Bon"): shop, order number, items with notes on the right, a label and the
// big value (countdown, break time or the next stream) in the title font, the changing line at the bottom, a zigzag edge. Classes
// kb-printer and kb-bon let the GSAP timeline of the scene drop the printer and feed the bon out step by step.
import type { BonItem } from "../bon.ts";

// title: an extra line in the title font under the number (BRB, Ending); small: the big value is a text, not a number
type Props = { shop: string; number: string; title?: string; items: readonly BonItem[]; label: string; big: string; small?: boolean; line: string };

export default function Bon({ shop, number, title = "", items, label, big, small = false, line }: Props) {
  return (
    <div className="kb-bon-box">
      <div className="kb-printer" />
      <div className="kb-bon">
        <div className="kb-bon-shop">{shop}</div>
        <div className="kb-bon-number">{number}</div>
        {title && <div className="kb-bon-title">{title}</div>}
        <hr />
        {items.map((item, index) => <div key={index} className="kb-bon-item"><span>{item.label}</span><small>{item.note}</small></div>)}
        {items.length > 0 && <hr />}
        <div className="kb-bon-label">{label}</div>
        {big && <div className={small ? "kb-bon-big small" : "kb-bon-big"}>{big}</div>}
        {line && <><hr /><div key={line} className="kb-bon-line">{line}</div></>}
        <div className="kb-zigzag" />
      </div>
    </div>
  );
}
