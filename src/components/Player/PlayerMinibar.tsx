import React, { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import usePlayer from "./usePlayer";
import { useI18n } from "~/i18n/index";

const noPlayerMinibarRoutes = ["/room/[roomId]"];

const PlayerMinibar: React.FC = () => {
  const { t } = useI18n();
  const {
    state: { playingThemeColor },
  } = usePlayer();
  const divRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const {
    state: { playingRoomId, playerPlaying },
  } = usePlayer();
  const shouldHide = useMemo(
    () => !playingRoomId || noPlayerMinibarRoutes.includes(router.pathname),
    [router, playingRoomId]
  );
  useEffect(() => {
    if (playingThemeColor && divRef.current)
      divRef.current.style.backgroundColor = playingThemeColor;
  }, [playingThemeColor]);

  return (
    <Link href="/room/[roomId]" as={`/room/${playingRoomId}`}>
      <button
        ref={divRef}
        className={`${
          shouldHide ? "hidden" : "flex"
        } items-center h-12 z-10 w-full rounded-t-lg overflow-hidden fixed bottom-0 left-0 transition-colors duration-300`}
      >
        <div
          className="opacity-50 absolute inset-0"
          style={{ zIndex: -1, backgroundColor: "#000814" }}
        />
        {playerPlaying ? (
          <img
            alt={t("nowPlaying.title")}
            src={playerPlaying.image}
            className="h-10 w-10 mx-1 rounded-lg object-cover"
          />
        ) : (
          <div className="h-10 w-10 mx-1 rounded-lg bg-foreground-tertiary" />
        )}
        <div className="text-xs p-1 flex-1 w-0 text-left">
          <div className="font-bold leading-none truncate">
            {playerPlaying?.title || t("player.noneText")}
          </div>
          <div className="text-foreground-secondary truncate">
            {playerPlaying?.artists.map((artist) => artist.name).join(", ") ||
              t("player.noneHelpText")}
          </div>
        </div>
      </button>
    </Link>
  );
};

export default PlayerMinibar;
