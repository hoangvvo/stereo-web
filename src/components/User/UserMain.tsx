import { SvgSettings } from "assets/svg";
import { Modal, useModal } from "components/Modal";
import { Button } from "components/Pressable";
import { Spacer } from "components/Spacer";
import StoryFeed from "components/Story/StoryFeed";
import { Typography } from "components/Typography";
import {
  User,
  useUserFollowersQuery,
  useUserFollowingsQuery,
  useUserQuery,
  useUserStatQuery,
} from "gql/gql.gen";
import { useMe } from "hooks/user";
import { useI18n } from "i18n/index";
import Link from "next/link";
import { useEffect } from "react";
import { onEnterKeyClick } from "utils/util";
import UserFollowButton from "./UserFollowButton";
import UserList from "./UserList";

const UserFollowingModals: React.FC<{
  id: string;
  active: boolean;
  close(): void;
}> = ({ id, active, close }) => {
  const { t } = useI18n();

  const [
    { data: { userFollowings } = { userFollowings: undefined } },
  ] = useUserFollowingsQuery({
    variables: { id },
    pause: !active,
    requestPolicy: "cache-and-network",
  });

  return (
    <Modal.Modal title={t("user.following")} active={active} close={close}>
      <Modal.Header>
        <Modal.Title>{t("user.following")}</Modal.Title>
      </Modal.Header>
      <Modal.Content>
        <UserList userIds={userFollowings || []} />
      </Modal.Content>
    </Modal.Modal>
  );
};

const UserFollowerModals: React.FC<{
  id: string;
  active: boolean;
  close(): void;
}> = ({ id, active, close }) => {
  const { t } = useI18n();

  const [
    { data: { userFollowers } = { userFollowers: undefined } },
  ] = useUserFollowersQuery({
    variables: { id },
    pause: !active,
    requestPolicy: "cache-and-network",
  });

  return (
    <Modal.Modal title={t("user.followers")} active={active} close={close}>
      <Modal.Header>
        <Modal.Title>{t("user.followers")}</Modal.Title>
      </Modal.Header>
      <Modal.Content>
        <UserList userIds={userFollowers || []} />
      </Modal.Content>
    </Modal.Modal>
  );
};

const UserMain: React.FC<{ initialUser: User }> = ({ initialUser }) => {
  const { t } = useI18n();
  // initialUser is the same as story, only might be a outdated version
  const [{ data }] = useUserQuery({
    variables: { id: initialUser.id },
  });
  const user = data?.user || initialUser;

  const me = useMe();

  const [{ data: { userStat } = { userStat: undefined } }] = useUserStatQuery({
    variables: { id: user.id },
    requestPolicy: "cache-and-network",
  });

  const [activeFollower, openFollower, closeFollower] = useModal();
  const [activeFollowing, openFollowing, closeFollowing] = useModal();

  useEffect(() => {
    closeFollower();
    closeFollowing();
  }, [initialUser.id, closeFollower, closeFollowing]);

  return (
    <>
      <div
        className="relative px-4 pt-8 pb-4 border-b-4 border-primary"
        style={{
          backgroundColor: "rgb(18, 18, 24)",
        }}
      >
        <img
          className="w-28 h-28 rounded-full mx-auto"
          src={user.profilePicture}
          alt={user.username}
        />
        <Spacer size={2} axis="vertical" />
        <Typography.Title size="xl" strong align="center">
          {user.username}
        </Typography.Title>
        <div className="text-center">
          <UserFollowButton id={user.id} />
        </div>
        <Spacer size={8} axis="vertical" />
        <div className="flex flex-center text-sm space-x-8 text-foreground-secondary">
          <div
            role="link"
            tabIndex={0}
            onKeyPress={onEnterKeyClick}
            className="p-1 text-inline-link"
            onClick={openFollowing}
          >
            <Typography.Text strong>{userStat?.followingCount}</Typography.Text>{" "}
            <Typography.Text>{t("user.following")}</Typography.Text>
          </div>
          <div
            role="link"
            tabIndex={0}
            onKeyPress={onEnterKeyClick}
            className="p-1 text-inline-link"
            onClick={openFollower}
          >
            <Typography.Text strong>{userStat?.followerCount}</Typography.Text>{" "}
            <Typography.Text>{t("user.followers")}</Typography.Text>
          </div>
        </div>
        {me?.user.id === user.id && (
          <div className="md:hidden absolute top-2 right-0">
            <Link href="/settings">
              <Button
                styling="link"
                icon={<SvgSettings className="w-8 h-8 stroke-1" />}
                accessibilityLabel={t("settings.title")}
              />
            </Link>
          </div>
        )}
      </div>
      <div className="py-4">
        <StoryFeed id={`creatorId:${user.id}`} />
      </div>
      <UserFollowingModals
        id={user.id}
        active={activeFollowing}
        close={closeFollowing}
      />
      <UserFollowerModals
        id={user.id}
        active={activeFollower}
        close={closeFollower}
      />
    </>
  );
};

export default UserMain;
