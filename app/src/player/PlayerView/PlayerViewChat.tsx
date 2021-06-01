import { IconLogIn, IconMusic } from "@/assets/svg";
import { Avatar } from "@/components/Avatar";
import { Input } from "@/components/Input";
import { Spacer } from "@/components/Spacer";
import { Text } from "@/components/Typography";
import {
  Message,
  MessageType,
  useMessageAddedSubscription,
  useMessageAddMutation,
  useMessagesQuery,
  useTrackQuery,
  useUserQuery,
} from "@/gql/gql.gen";
import { Size, useColors } from "@/styles";
import { format as formatMs } from "@lukeed/ms";
import { TFunction } from "i18next";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";
import { PlaybackState } from "../Context";

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listItem: {
    paddingVertical: Size[2],
  },
  chatTrack: {
    backgroundColor: "rgba(255,255,255,0.01)",
    padding: Size[2],
    borderRadius: 8,
  },
  chatHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Size[2],
  },
});

const getDateDiffTxt = (t: TFunction, createdAt: Date) => {
  const dateDiff = Date.now() - createdAt.getTime();
  return dateDiff < 1000 ? t("common.time.just_now") : formatMs(dateDiff);
};

const ChatItemJoin: React.FC<{
  message: Message;
}> = ({ message }) => {
  const { t } = useTranslation();

  const [{ data: { user } = { user: undefined } }] = useUserQuery({
    variables: { id: message.creatorId },
  });
  const colors = useColors();

  return (
    <View style={styles.listItem}>
      <View style={styles.chatHead}>
        <IconLogIn width={18} height={18} stroke={colors.textSecondary} />
        <Spacer x={2} />
        <Text color="textSecondary">
          {t("chat.play", { username: user?.username })}
          {" • "}
          {getDateDiffTxt(t, message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const ChatItemPlay: React.FC<{
  message: Message;
}> = ({ message }) => {
  const { t } = useTranslation();
  const [{ data: { user } = { user: undefined } }] = useUserQuery({
    variables: { id: message.creatorId },
  });
  const [{ data: { track } = { track: undefined } }] = useTrackQuery({
    variables: { id: message.text || "" },
    pause: !message.text,
  });

  const colors = useColors();

  return (
    <View style={styles.listItem}>
      <View style={styles.chatHead}>
        <IconMusic width={18} height={18} stroke={colors.textSecondary} />
        <Spacer x={2} />
        <Text color="textSecondary">
          {t("chat.play", { username: user?.username })}
          {" • "}
          {getDateDiffTxt(t, message.createdAt)}
        </Text>
      </View>
      <View style={styles.chatTrack}>
        <Text>{track?.artists.map((artist) => artist.name).join(", ")} </Text>
      </View>
    </View>
  );
};

const ChatItemText: React.FC<{
  message: Message;
}> = ({ message }) => {
  const { t } = useTranslation();
  const [{ data: { user } = { user: undefined } }] = useUserQuery({
    variables: { id: message.creatorId },
  });
  return (
    <View style={styles.listItem}>
      <View style={styles.chatHead}>
        {user && (
          <Avatar
            size={6}
            username={user.username}
            href={user.profilePicture}
          />
        )}
        <Spacer x={2} />
        <Text bold>{user?.username}</Text>
        <Text color="textSecondary">
          {" • "}
          {getDateDiffTxt(t, message.createdAt)}
        </Text>
      </View>
      <Text color="text" style={{ lineHeight: 20 }}>
        {message.text}
      </Text>
    </View>
  );
};

const renderItem: ListRenderItem<Message> = ({ item: message }) => {
  if (message.type === MessageType.Play)
    return <ChatItemPlay key={message.id} message={message} />;

  if (message.type === MessageType.Join)
    return <ChatItemJoin key={message.id} message={message} />;

  return <ChatItemText key={message.id} message={message} />;
};

const ChatList: React.FC<{ id: string }> = ({ id }) => {
  const ref = useRef<FlatList>(null);
  const scrollShouldFollow = useRef(true);

  const [offset, setOffset] = useState(0);
  const [
    { data: { messages: prevMessages } = { messages: undefined } },
  ] = useMessagesQuery({
    variables: { id, limit: 20, offset },
    requestPolicy: "cache-and-network",
  });

  const [{ data: newMessages }] = useMessageAddedSubscription<Message[]>(
    { variables: { id }, pause: !prevMessages },
    (prev = [], response) => {
      return [
        ...prev,
        {
          ...response.messageAdded,
          createdAt: new Date(response.messageAdded.createdAt),
        },
      ];
    }
  );

  const messages = useMemo(() => {
    const allMessages = Array.from(prevMessages || []);
    newMessages?.forEach((nM) => {
      // Filter out messages from new that already exist in prev
      if (!allMessages.some((m) => m.id === nM.id)) allMessages.push(nM);
    });
    return allMessages;
  }, [prevMessages, newMessages]);

  useEffect(() => {
    if (scrollShouldFollow.current && ref.current) {
      // Scrool to bottom
      ref.current.scrollToEnd();
    }
  }, [messages.length]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (event.nativeEvent.contentOffset.y <= 0) {
        // scroll is at top, try to load more
        setOffset(messages.length);
      }
    },
    [messages]
  );
  return (
    <FlatList
      ref={ref}
      style={styles.list}
      renderItem={renderItem}
      data={messages}
      onScroll={onScroll}
    />
  );
};

const ChatInput: React.FC<{ id: string }> = ({ id }) => {
  const { t } = useTranslation();

  const { control, setValue, handleSubmit } = useForm<{ chat: string }>();

  const [{ fetching }, addMessage] = useMessageAddMutation();

  const onSend = useCallback<SubmitHandler<{ chat: string }>>(
    async (data) => {
      const trimMsg = data.chat.trim();
      if (fetching || trimMsg.length === 0) return;
      addMessage({ id, text: trimMsg }).then(() => setValue("chat", ""));
    },
    [fetching, setValue, id, addMessage]
  );

  return (
    <View>
      <Input
        onSubmit={handleSubmit(onSend)}
        control={control}
        name="chat"
        accessibilityLabel={t("chat.input_label")}
      />
    </View>
  );
};

const PlayerViewChat: React.FC<{ playbackState: PlaybackState }> = ({
  playbackState,
}) => {
  const id = `${playbackState.contextType}:${playbackState.contextId}`;
  return (
    <View style={styles.root}>
      <ChatList id={id} />
      <ChatInput id={id} />
    </View>
  );
};

export default PlayerViewChat;