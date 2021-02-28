import { SvgClose, SvgUserAdd } from "assets/svg";
import { Input } from "components/Form";
import { Skeleton } from "components/Loading";
import { Button } from "components/Pressable";
import { Spacer } from "components/Spacer";
import { Typography } from "components/Typography";
import { Box } from "components/View";
import {
  Story,
  useChangeStoryQueueableMutation,
  UserDocument,
  UserQuery,
  UserQueryVariables,
  useStoryUpdatedSubscription,
  useUserQuery,
} from "gql/gql.gen";
import { useI18n } from "i18n/index";
import { useCallback } from "react";
import { useClient } from "urql";
import { CONFIG } from "utils/constants";
import { toast } from "utils/toast";

const StoryQueueableAdder: React.FC<{ story: Story }> = ({ story }) => {
  const { t } = useI18n();
  const client = useClient();
  const [
    { fetching },
    changeStoryQueueable,
  ] = useChangeStoryQueueableMutation();
  const onUserAdd = useCallback(
    async (ev: React.FormEvent<HTMLFormElement>) => {
      ev.preventDefault();
      const username = ev.currentTarget.username.value.trim();
      if (!username) return;
      const result = await client
        .query<UserQuery, UserQueryVariables>(UserDocument, { username })
        .toPromise();
      if (!result.data?.user) return toast.error(t("user.search.notFound"));
      if (story.queueable.includes(result.data.user.id))
        return toast.open({
          type: "info",
          message: t("story.queueable.addExisted", {
            username: result.data.user.username,
          }),
        });
      const addResult = await changeStoryQueueable({
        id: story.id,
        userId: result.data.user.id,
        isRemoving: false,
      });
      if (addResult.data?.changeStoryQueueable) {
        toast.success(
          t("story.queueable.addSuccess", {
            username: result.data.user.username,
          })
        );
      }
    },
    [client, changeStoryQueueable, story, t]
  );
  return (
    <form
      autoComplete="off"
      onSubmit={onUserAdd}
      className="flex items-center rounded-full bg-background-secondary p-1"
    >
      <Box
        justifyContent="center"
        alignItems="center"
        width={10}
        height={10}
        rounded="full"
        backgroundColor="background-secondary"
      >
        <SvgUserAdd className="w-4 h-4" />
      </Box>
      <Spacer size={2} axis="horizontal" />
      <Box flex={1} minWidth={0} alignItems="stretch">
        {/* TODO: To be replaced with styled input */}
        <Input
          name="username"
          placeholder={t("settings.username.label")}
          accessibilityLabel={t("story.queueable.title")}
          maxLength={CONFIG.usernameMaxLength}
          required
          fullWidth
          style={{ padding: 0 }}
        />
      </Box>
      <Button
        shape="circle"
        title={t("story.queueable.add")}
        disabled={fetching}
      />
    </form>
  );
};

const StoryQueueableUser: React.FC<{ userId: string; storyId: string }> = ({
  userId,
  storyId,
}) => {
  const { t } = useI18n();
  const [
    { fetching },
    changeStoryQueueable,
  ] = useChangeStoryQueueableMutation();
  const [{ data: { user } = { user: undefined } }] = useUserQuery({
    variables: { id: userId },
  });
  const onUserRemove = useCallback(async () => {
    const result = await changeStoryQueueable({
      id: storyId,
      userId,
      isRemoving: true,
    });
    if (result.data?.changeStoryQueueable) {
      toast.success(
        t("story.queueable.removeSuccess", { username: user?.username })
      );
    }
  }, [userId, changeStoryQueueable, storyId, t, user]);
  return (
    <Box
      row
      alignItems="center"
      backgroundColor="background-secondary"
      padding="xs"
      rounded="full"
      gap="sm"
    >
      <Skeleton show={!user} rounded="full">
        <img
          className="w-10 h-10 rounded-full object-cover"
          src={user?.profilePicture}
          alt={user?.username}
        />
      </Skeleton>
      <Box minWidth={0} flex={1}>
        <Skeleton show={!user} rounded="lg" width={20} height={4}>
          <Typography.Text strong truncate>
            {user?.username}
          </Typography.Text>
        </Skeleton>
      </Box>
      <Button
        accessibilityLabel={t("story.queueable.remove", {
          username: user?.username,
        })}
        disabled={fetching}
        onPress={onUserRemove}
        icon={<SvgClose className="w-4 h-4" />}
        shape="circle"
      />
    </Box>
  );
};

const StoryQueueable: React.FC<{ story: Story }> = ({ story }) => {
  useStoryUpdatedSubscription(
    { variables: { id: story.id } },
    (prev, data) => data
  );
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <StoryQueueableAdder story={story} />
      {story.queueable.map((userId) => (
        <StoryQueueableUser key={userId} storyId={story.id} userId={userId} />
      ))}
    </div>
  );
};

export default StoryQueueable;
