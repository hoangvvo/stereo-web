import { useMemo } from "react";
import { Track, useCrossTracksQuery, useTrackQuery } from "~/graphql/gql.gen";

export const useCrossTracks = (id?: string) => {
  const [
    {
      data: { crossTracks } = { crossTracks: undefined },
      fetching: fetchingCross,
    },
  ] = useCrossTracksQuery({
    variables: { id: id || "" },
    pause: !id,
  });

  const [
    { data: { track: youtube } = { track: undefined }, fetching: fetchingYT },
  ] = useTrackQuery({
    variables: { id: `youtube:${crossTracks?.youtube}` },
    pause: !crossTracks?.youtube,
  });

  const [
    { data: { track: spotify } = { track: undefined }, fetching: fetchingS },
  ] = useTrackQuery({
    variables: { id: `spotify:${crossTracks?.spotify}` },
    pause: !crossTracks?.spotify,
  });

  const data = useMemo<
    | {
        id: string;
        original: Track | null | undefined;
        youtube: Track | null | undefined;
        spotify: Track | null | undefined;
      }
    | undefined
  >(() => {
    if (!id) return undefined;

    // fetching IS NOT RELIABLE!! so we check specifically
    // if respective responses are for id arg and return
    // undefined if not matched (possibly fetching)
    if (crossTracks?.id !== id) return undefined;

    if (
      !!crossTracks.youtube &&
      !!youtube &&
      youtube.externalId !== crossTracks.youtube
    )
      return undefined;

    if (
      !!crossTracks.spotify &&
      !!spotify &&
      spotify.externalId !== crossTracks.spotify
    )
      return undefined;

    // Find the original tracks among crossTracks
    let original: Track | null = null;
    if (spotify?.id === crossTracks.id) original = spotify;
    else if (youtube?.id === crossTracks.id) original = youtube;

    return { id, original, youtube, spotify };
  }, [id, crossTracks, youtube, spotify]);

  return [
    data,
    { fetching: fetchingCross || fetchingYT || fetchingS },
  ] as const;
};
