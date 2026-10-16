// Hook: was der Spotify-Player zeigt (nowPlaying in music.ts) aus dem laufenden Titel von useMusic.
import { useMusic } from "../hooks/useMusic.ts";
import { nowPlaying } from "./music.ts";

export const useNowPlaying = (hideWhenPaused: boolean) => nowPlaying(useMusic(), hideWhenPaused);
