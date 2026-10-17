// Hook: what the Spotify player shows (nowPlaying in music.ts) from the current track of useMusic.
import { useMusic } from "../hooks/useMusic.ts";
import { nowPlaying } from "./music.ts";

export const useNowPlaying = (hideWhenPaused: boolean) => nowPlaying(useMusic(), hideWhenPaused);
