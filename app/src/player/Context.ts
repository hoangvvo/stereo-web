import { QueueItem } from "@/gql/gql.gen";
import { createContext, useContext } from "react";
import Player from "./Player";

export enum PlaybackContextType {
  Story = "story",
  Playlist = "playlist",
}

/**
 * ContextUri has the form of {<type>,<id>}, defining
 * what the player will be playing.
 * ex. `{type:"story", id: "foo"}`, `{type:"playlist", id: "bar"}`
 */
export interface PlaybackCurrentContext {
  id: string;
  type: PlaybackContextType;
}

export interface PlaybackContextProvided {
  nextItems: QueueItem[];
  canSkipBackward: boolean;
  canSkipForward: boolean;
  trackId: string | null;
  fetching: boolean;
}

export interface PlaybackState extends PlaybackContextProvided {
  playbackCurrentContext: PlaybackCurrentContext | null;
  isPlaying: boolean;
  colors: [string, string];
}

export const PlaybackContext = createContext({} as PlaybackState);

export const usePlaybackState = () => useContext(PlaybackContext);

// create a singleton instance of player
export const player = new Player();
