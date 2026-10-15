// Hook: die letzten max Chatnachrichten. Gebannte Nutzer und gelöschte Nachrichten verschwinden sofort.
import { useEffect, useState } from "react";
import { connect } from "../connection.ts";
import type { ChatMessage } from "../types.ts";

export function useChat(max: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useEffect(() => connect({
    chat: message => setMessages(list => [...list, message].slice(-max)),
    remove: ({ id, login }) => setMessages(list => {
      if (id) return list.filter(message => message.id !== id);
      if (login) return list.filter(message => message.login !== login);
      return [];
    }),
  }), [max]);
  return messages;
}
