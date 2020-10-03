import React, { useRef, useEffect, useCallback } from "react";
import { useToasts } from "~/components/Toast/index";
import { usePlayer } from "~/components/Player/index";
import { useCurrentUser } from "~/hooks/user";
import {
  useReactNowPlayingMutation,
  NowPlayingReactionType,
  NowPlayingReactionPartsFragment,
  useNowPlayingReactionsQuery,
  useOnNowPlayingReactionsUpdatedSubscription,
} from "~/graphql/gql.gen";

const NowPlayingReaction: React.FC<{ id: string }> = ({ id }) => {
  const {
    state: { playerPlaying },
  } = usePlayer();
  const user = useCurrentUser();
  const toasts = useToasts();
  const btnCrying = useRef<HTMLButtonElement>(null);
  const btnHeart = useRef<HTMLButtonElement>(null);
  const btnFire = useRef<HTMLButtonElement>(null);
  const btnTearJoy = useRef<HTMLButtonElement>(null);
  const prevNowPlayingReaction = useRef<NowPlayingReactionPartsFragment>({
    id,
    mine: [],
    crying: 0,
    heart: 0,
    fire: 0,
    tear_joy: 0,
  }).current;
  const [{ data }] = useNowPlayingReactionsQuery({ variables: { id } });
  useOnNowPlayingReactionsUpdatedSubscription({ variables: { id } });
  const nowPlayingReaction = data?.nowPlayingReactions;

  const [, reactNowPlaying] = useReactNowPlayingMutation();

  const react = useCallback(
    (reaction: NowPlayingReactionType) => {
      if (user) reactNowPlaying({ id, reaction });
      else toasts.message("Sign in to add your reaction");
    },
    [toasts, id, reactNowPlaying, user]
  );

  useEffect(() => {
    if (!nowPlayingReaction) return;
    if (nowPlayingReaction.fire > prevNowPlayingReaction.fire) {
      btnFire.current?.classList.add("scale-75");
      setTimeout(() => btnFire.current?.classList.remove("scale-75"), 200);
    }
    if (nowPlayingReaction.crying > prevNowPlayingReaction.crying) {
      btnCrying.current?.classList.add("scale-75");
      setTimeout(() => btnCrying.current?.classList.remove("scale-75"), 200);
    }
    if (nowPlayingReaction.heart > prevNowPlayingReaction.heart) {
      btnHeart.current?.classList.add("scale-75");
      setTimeout(() => btnHeart.current?.classList.remove("scale-75"), 200);
    }
    if (nowPlayingReaction.tear_joy > prevNowPlayingReaction.tear_joy) {
      btnTearJoy.current?.classList.add("scale-75");
      setTimeout(() => btnTearJoy.current?.classList.remove("scale-75"), 200);
    }
    Object.assign(prevNowPlayingReaction, nowPlayingReaction);
  }, [
    prevNowPlayingReaction,
    nowPlayingReaction,
    btnCrying,
    btnTearJoy,
    btnHeart,
    btnFire,
  ]);
  return (
    <div className="flex max-w-sm mx-auto overflow-x-auto text-sm">
      <button
        ref={btnHeart}
        onClick={() => react(NowPlayingReactionType.Heart)}
        className={`flex-1 button rounded-full p-2 mx-1 ${
          nowPlayingReaction?.mine.includes(NowPlayingReactionType.Heart)
            ? "bg-pink opacity-100"
            : "bg-opacity-25"
        }`}
        disabled={
          !playerPlaying ||
          nowPlayingReaction?.mine.includes(NowPlayingReactionType.Heart)
        }
      >
        <span role="img" aria-label="Heart">
          {nowPlayingReaction?.heart || 0} ❤️
        </span>
      </button>
      <button
        ref={btnFire}
        className={`flex-1 button rounded-full p-2 mx-1 ${
          nowPlayingReaction?.mine.includes(NowPlayingReactionType.Fire)
            ? "bg-pink opacity-100"
            : "bg-opacity-25"
        }`}
        onClick={() => react(NowPlayingReactionType.Fire)}
        disabled={
          !playerPlaying ||
          nowPlayingReaction?.mine.includes(NowPlayingReactionType.Fire)
        }
      >
        <span role="img" aria-label="Fire">
          {nowPlayingReaction?.fire || 0} 🔥
        </span>
      </button>
      <button
        ref={btnTearJoy}
        className={`flex-1 button rounded-full p-2 mx-1 ${
          nowPlayingReaction?.mine.includes(NowPlayingReactionType.TearJoy)
            ? "bg-pink opacity-100"
            : "bg-opacity-25"
        }`}
        onClick={() => react(NowPlayingReactionType.TearJoy)}
        disabled={
          !playerPlaying ||
          nowPlayingReaction?.mine.includes(NowPlayingReactionType.TearJoy)
        }
      >
        <span role="img" aria-label="Face with Tears of Joy">
          {nowPlayingReaction?.tear_joy || 0} 😂
        </span>
      </button>
      <button
        ref={btnCrying}
        className={`flex-1 button rounded-full p-2 mx-1 ${
          nowPlayingReaction?.mine.includes(NowPlayingReactionType.Crying)
            ? "bg-pink opacity-100"
            : "bg-opacity-25"
        }`}
        onClick={() => react(NowPlayingReactionType.Crying)}
        disabled={
          !playerPlaying ||
          nowPlayingReaction?.mine.includes(NowPlayingReactionType.Crying)
        }
      >
        <span role="img" aria-label="Fire">
          {nowPlayingReaction?.crying || 0} 😢
        </span>
      </button>
    </div>
  );
};

export default NowPlayingReaction;
