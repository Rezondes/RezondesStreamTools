// The postcard of the Urlaub alert (PLAN-URLAUB.md package 7, refs/alert.html): the front a beach picture with a
// greeting, the back the message side (its content comes as children: tag, name line, quote, stamp, postmark). The card
// turns in 3D on the timeline of the alert; it is never faded itself (a card under 1 opacity turns flat), only its
// parent.
import type { ReactNode } from "react";

export default function Postcard({ greeting, children }: { greeting: string; children: ReactNode }) {
  return (
    <div className="ul-postcard">
      <div className="ul-card-face ul-card-front">
        <i className="ul-card-sun" />
        <b className="ul-card-greeting">{greeting}</b>
      </div>
      <div className="ul-card-face ul-card-back">{children}</div>
    </div>
  );
}
