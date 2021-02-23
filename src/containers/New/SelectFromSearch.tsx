import { SvgLoadingAnimated, SvgSearch } from "assets/svg";
import { Input } from "components/Form";
import { Button } from "components/Pressable";
import { Typography } from "components/Typography";
import { Box } from "components/View";
import { Track, usePlaylistTracksQuery } from "gql/gql.gen";
import { useI18n } from "i18n/index";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef } from "react";
import { maybeGetTrackOrPlaylistIdFromUri } from "utils/platform";

const SelectFromSearch: React.FC<{
  onSelected(tracks: Track[]): void;
}> = ({ onSelected }) => {
  const { t } = useI18n();

  const router = useRouter();
  const searchQuery = router.query.search as string | undefined;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = searchQuery || "";
  }, [searchQuery]);

  const platformUtilResult = useMemo(
    () =>
      searchQuery ? maybeGetTrackOrPlaylistIdFromUri(searchQuery) : undefined,
    [searchQuery]
  );

  const [
    { data: { playlistTracks } = { playlistTracks: undefined }, fetching },
  ] = usePlaylistTracksQuery({
    variables: { id: platformUtilResult?.id || "" },
    pause: platformUtilResult?.type !== "playlist",
  });

  useEffect(() => {
    playlistTracks?.length && onSelected(playlistTracks);
  }, [playlistTracks, onSelected]);

  return (
    <>
      <Typography.Paragraph
        size="lg"
        color="foreground-secondary"
        align="center"
      >
        {!playlistTracks?.length && !fetching && !!searchQuery
          ? t("new.fromSearch.noResults")
          : t("new.fromSearch.helpText")}
      </Typography.Paragraph>
      <form
        className="h-42 w-full flex items-center space-x-1"
        onSubmit={(event) => {
          event.preventDefault();
          if (fetching) return;
          const s = inputRef.current?.value.trim();
          s && router.replace(`/new?search=${encodeURIComponent(s)}`);
        }}
      >
        <Box flex={1} minWidth={0}>
          <Input
            ref={inputRef}
            placeholder="example.com/my-awesome-playlist"
            accessibilityLabel={t("new.fromSearch.altText")}
            fullWidth
            required
            disabled={fetching}
            type="url"
          />
        </Box>
        <Button
          type="submit"
          accessibilityLabel={t("new.fromSearch.action")}
          disabled={fetching}
          icon={fetching ? <SvgLoadingAnimated /> : <SvgSearch />}
        />
      </form>
    </>
  );
};

export default SelectFromSearch;