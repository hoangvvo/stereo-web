import { useEffect } from "react";
import axios from "redaxios";
import { toast } from "~/lib/toast";
import usePlayer from "./usePlayer";
import { sleep } from "~/lib/util";
import { verifyScript } from "~/lib/script-utils";
import { useMAuth } from "~/hooks/user";
import { t } from "~/i18n/index";
/// <reference path="spotify-web-playback-sdk" />

const BASE_URL = "https://api.spotify.com/v1";

export type SpotifyPlayerStatus = "WAIT" | "OK" | "NO_PREMIUM" | "NO_SUPPORT";

export default function SpotifyPlayer() {
  const { player } = usePlayer();
  const { data: mAuth } = useMAuth();

  useEffect(() => {
    let spotifyPlayer: Spotify.SpotifyPlayer | null = null;
    let spotifyState: Spotify.PlaybackState | null = null;

    const onError = (e: Spotify.Error) => toast.error(e.message);
    const onReady: Spotify.PlaybackInstanceListener = ({ device_id }) => {
      player.registerPlayer({
        play: () => spotifyPlayer?.resume(),
        seek: (ms) => spotifyPlayer?.seek(ms).then(() => player.emit("seeked")),
        pause: () => spotifyPlayer?.pause(),
        loadById: playById.bind(undefined, device_id),
        setVolume: (p) => spotifyPlayer?.setVolume(p),
        // Note: It is impossible to determine spotify without a promise
        isPlaying: () => !spotifyState?.paused,
      });
      // get duration
      // durationInterval = window.setInterval(async () => {
      //   player.emit(
      //     "time",
      //     (await spotifyPlayer?.getCurrentState())?.position || 0
      //   );
      // }, 1000);
    };
    const instance: typeof axios = axios.create({
      headers: { Authorization: `Bearer ${mAuth?.accessToken}` },
    });
    const playById = async (device_id: string, externalId: string) => {
      const resp = await instance.put(
        `${BASE_URL}/me/player/play`,
        { uris: [`spotify:track:${externalId}`] },
        {
          validateStatus: () => true,
          params: { device_id },
        }
      );
      if (resp.status !== 204 && resp.data?.error) {
        if (resp.data.error.reason === "PREMIUM_REQUIRED")
          return toast.error({
            message: t("player.spotify.premiumRequired"),
            duration: 25 * 1000,
          });
        else onError(resp.data.error);
      }
      await sleep(500);
      spotifyPlayer?.resume();
    };
    const onState: Spotify.PlaybackStateListener = (state) => {
      if (!state) return;
      state.paused ? player.emit("paused") : player.emit("playing");
      // FIXME: Temporary workaround only https://github.com/spotify/web-playback-sdk/issues/35#issuecomment-509159445
      if (
        spotifyState &&
        state.track_window.previous_tracks[0]?.id ===
          state.track_window.current_track.id &&
        !spotifyState.paused &&
        state.paused
      ) {
        // track end
        player.emit("ended");
      }
      spotifyState = state;
    };

    let durationInterval: number; // ID of setInterval

    async function init() {
      if (!window.Spotify?.Player || spotifyPlayer || !mAuth?.accessToken)
        return;
      spotifyPlayer = new window.Spotify.Player({
        name: "Stereo Web Player",
        getOAuthToken: (cb) => mAuth?.accessToken && cb(mAuth.accessToken),
      });
      // readiness
      spotifyPlayer.addListener("ready", onReady);
      // state handling
      spotifyPlayer.addListener("player_state_changed", onState);
      // error handling

      spotifyPlayer.addListener("authentication_error", onError);
      spotifyPlayer.addListener("initialization_error", () =>
        toast.error({
          message: t("player.spotify.notSupported"),
          duration: 25 * 1000,
        })
      );
      spotifyPlayer.addListener("account_error", onError);
      spotifyPlayer.addListener("playback_error", onError);
      // connect
      spotifyPlayer.connect();
    }

    window.onSpotifyWebPlaybackSDKReady = init;
    verifyScript("https://sdk.scdn.co/spotify-player.js").then(init);

    return function cleanup() {
      window.clearInterval(durationInterval);
      // @ts-expect-error: DT defines this as non null
      window.onSpotifyWebPlaybackSDKReady = null;
      player.unregisterPlayer();
      if (!spotifyPlayer) return;
      spotifyPlayer.removeListener("ready");
      spotifyPlayer.removeListener("player_state_changed");
      spotifyPlayer.removeListener("authentication_error");
      spotifyPlayer.removeListener("initialization_error");
      spotifyPlayer.removeListener("account_error");
      spotifyPlayer.removeListener("playback_error");
      spotifyPlayer.disconnect();
      spotifyPlayer = null;
      spotifyState = null;
    };
  }, [mAuth, player]);
  return null;
}
