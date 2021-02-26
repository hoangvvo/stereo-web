import { SvgPause, SvgPlay, SvgX } from "assets/svg";
import { Skeleton } from "components/Loading";
import { Button } from "components/Pressable";
import { Typography } from "components/Typography";
import { Box } from "components/View";
import { useI18n } from "i18n/index";
import Link from "next/link";
import { useEffect, useState } from "react";
import usePlayer from "./usePlayer";

const PlayerMinibar: React.FC = () => {
  const { t } = useI18n();
  const {
    state: { playingStoryId, playerPlaying, fetching },
    playStory,
    player,
  } = usePlayer();

  useEffect(() => {
    const onPlaying = () => setIsPlaying(true);
    const onPaused = () => setIsPlaying(false);
    player.on("playing", onPlaying);
    player.on("paused", onPaused);
    return () => {
      player.off("playing", onPlaying);
      player.off("paused", onPaused);
    };
  }, [player]);

  const [isPlaying, setIsPlaying] = useState(() => player.isPlaying);

  if (!playingStoryId) return null;

  return (
    <Box
      rounded="full"
      fullWidth
      backgroundColor="primary"
      style={{
        boxShadow: "hsl(349deg 67% 49% / 21%) 0px 8px 30px",
        boxSizing: "content-box",
        zIndex: 10,
      }}
      row
      alignItems="center"
      gap="xs"
    >
      <Link href={`/story/${playingStoryId}`}>
        <a className="flex-1 w-0 flex items-center">
          <Box
            width={12}
            height={12}
            padding="xs"
            style={{ boxSizing: "content-box" }}
          >
            <Skeleton show={fetching} rounded="full" width={12} height={12}>
              {playerPlaying && (
                <img
                  alt={t("nowPlaying.title")}
                  src={playerPlaying.image}
                  className="h-12 w-12 object-cover rounded-full shadow-lg"
                />
              )}
            </Skeleton>
          </Box>
          <Box padding="sm" flex={1} minWidth={0} gap="xs">
            <Skeleton show={fetching} width={40}>
              <Typography.Paragraph size="xs" strong noMargin truncate>
                {playerPlaying?.title || t("player.noneText")}
              </Typography.Paragraph>
            </Skeleton>
            <Skeleton show={fetching} width={32}>
              <Typography.Paragraph
                noMargin
                truncate
                color="foreground-secondary"
                size="xs"
              >
                {playerPlaying?.artists
                  .map((artist) => artist.name)
                  .join(", ") || t("player.noneHelpText")}
              </Typography.Paragraph>
            </Skeleton>
          </Box>
        </a>
      </Link>
      <Button
        accessibilityLabel={isPlaying ? t("player.pause") : t("player.play")}
        onPress={() => (isPlaying ? player.pause() : player.play())}
        icon={
          isPlaying ? (
            <SvgPause className="fill-current" />
          ) : (
            <SvgPlay className="fill-current" />
          )
        }
        styling="link"
      />
      <Button
        accessibilityLabel={t("player.stopPlaying")}
        onPress={() => playStory("")}
        icon={<SvgX />}
        styling="link"
      />
    </Box>
  );
};

export default PlayerMinibar;
