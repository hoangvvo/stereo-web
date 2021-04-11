import AsyncStorage from "@react-native-async-storage/async-storage";
import { authExchange } from "@urql/exchange-auth";
import { cacheExchange as createCacheExchange } from "@urql/exchange-graphcache";
import { IntrospectionData } from "@urql/exchange-graphcache/dist/types/ast";
import { simplePagination } from "@urql/exchange-graphcache/extras";
import { API_URI, WEBSOCKET_URI } from "config";
import {
  MeDocument,
  MeQuery,
  NowPlayingReactionsDocument,
  NowPlayingReactionsQuery,
  NowPlayingReactionsUpdatedSubscription,
  Story,
  StoryUsersDocument,
  StoryUsersQuery,
  UserFollowingsDocument,
  UserFollowingsQuery,
  UserFollowingsQueryVariables,
} from "gql/gql.gen";
import { createClient as createWSClient } from "graphql-ws";
import {
  createClient,
  dedupExchange,
  errorExchange,
  Exchange,
  fetchExchange,
  makeOperation,
  subscriptionExchange,
} from "urql";
import schema from "./schema.json";
import { nextCursorPagination } from "./_pagination";

const wsClient = createWSClient({
  url: `${WEBSOCKET_URI}/graphql`,
});

const cacheExchange = createCacheExchange({
  schema: (schema as unknown) as IntrospectionData,
  keys: {
    QueueItem: () => null,
    Me: () => null,
    NowPlayingReactionItem: () => null,
    NowPlayingQueueItem: () => null,
  },
  resolvers: {
    Query: {
      messages: simplePagination({
        offsetArgument: "offset",
        mergeMode: "before",
      }),
      stories: nextCursorPagination(),
      notifications: nextCursorPagination(),
      story: (parent, args) => ({ __typename: "Story", id: args.id }),
      track: (parent, args) => ({ __typename: "Track", id: args.id }),
      // user: (parent, args) => ({ __typename: "User", id: args.id }),
    },
    Message: {
      // @ts-ignore
      createdAt: (parent) => new Date(parent.createdAt),
    },
    NowPlayingQueueItem: {
      playedAt: (parent) =>
        typeof parent.playedAt === "string" ? new Date(parent.playedAt) : null,
      endedAt: (parent) =>
        typeof parent.endedAt === "string"
          ? new Date(parent.endedAt)
          : undefined,
    },
    Story: {
      // @ts-ignore
      createdAt: (parent: Story) => new Date(parent.createdAt),
    },
    NotificationInvite: {
      // @ts-ignore
      createdAt: (parent) => new Date(parent.createdAt),
    },
    NotificationFollow: {
      // @ts-ignore
      createdAt: (parent) => new Date(parent.createdAt),
    },
    NotificationNewStory: {
      // @ts-ignore
      createdAt: (parent) => new Date(parent.createdAt),
    },
    Me: {
      expiredAt: (parent) =>
        // @ts-ignore
        parent.expiredAt ? new Date(parent.expiredAt) : parent.expiredAt,
    },
  },
  updates: {
    Mutation: {
      storyCreate: (result, args, cache) => {
        if (!result.storyCreate) return;
        cache.invalidate("Query", "storyLive", {
          creatorId: (result.storyCreate as Story).creatorId,
        });
      },
      storyUnlive: (result, args, cache) => {
        if (!result.storyUnlive) return;
        cache.invalidate("Query", "storyLive", {
          creatorId: (result.storyUnlive as Story).creatorId,
        });
      },
      storyDelete: (result, args, cache) => {
        cache.invalidate({
          __typename: "Story",
          id: result.storyDelete as string,
        });
      },
      userFollow: (result, args, cache) => {
        if (!result.userFollow) return;

        const followedId = args.id as string;

        const meCache = cache.readQuery<MeQuery>({ query: MeDocument });
        // Possibly invalid state
        if (!meCache?.me)
          throw new Error("Bad state: should have been authenticated");

        // Update current user following
        cache.updateQuery<UserFollowingsQuery, UserFollowingsQueryVariables>(
          {
            query: UserFollowingsDocument,
            variables: { id: meCache.me.user.id },
          },
          (data) => ({
            userFollowings: (data?.userFollowings
              ? [followedId, ...data.userFollowings]
              : [followedId]) as string[],
          })
        );

        // Invalidate user stat of both entity
        cache.invalidate({
          __typename: "UserStat",
          id: followedId,
        });
        cache.invalidate({
          __typename: "UserStat",
          id: meCache.me.user.id,
        });
      },
      userUnfollow: (result, args, cache) => {
        if (!result.userUnfollow) return;

        const unfollowedId = args.id as string;

        const meCache = cache.readQuery<MeQuery>({ query: MeDocument });
        // Possibly invalid state
        if (!meCache?.me)
          throw new Error("Bad state: should have been authenticated");

        // Update current user following
        cache.updateQuery<UserFollowingsQuery, UserFollowingsQueryVariables>(
          {
            query: UserFollowingsDocument,
            variables: { id: meCache.me.user.id },
          },
          (data) =>
            data?.userFollowings
              ? {
                  userFollowings: data.userFollowings.filter(
                    (uf) => uf !== unfollowedId
                  ),
                }
              : data
        );

        // Invalidate user stat of both entity
        cache.invalidate({
          __typename: "UserStat",
          id: unfollowedId,
        });
        cache.invalidate({
          __typename: "UserStat",
          id: meCache.me.user.id,
        });
      },
    },
    Subscription: {
      storyUsersUpdated: (result, args, cache) => {
        if (result.storyUsersUpdated) {
          cache.updateQuery<StoryUsersQuery>(
            {
              query: StoryUsersDocument,
              variables: { id: args.id },
            },
            () => ({ storyUsers: result.storyUsersUpdated as string[] })
          );
        }
      },
      nowPlayingReactionsUpdated: (result, args, cache) => {
        if (result.nowPlayingReactionsUpdated) {
          cache.updateQuery<NowPlayingReactionsQuery>(
            {
              query: NowPlayingReactionsDocument,
              variables: { id: args.id },
            },
            () => ({
              nowPlayingReactions: (result as NowPlayingReactionsUpdatedSubscription)
                .nowPlayingReactionsUpdated,
            })
          );
        }
      },
    },
  },
});

export const createUrqlClient = () =>
  createClient({
    url: `${API_URI}/graphql`,
    fetchOptions: { credentials: "include" },
    exchanges: [
      dedupExchange,
      cacheExchange,
      errorExchange({
        onError() {
          // if (typeof window === "undefined") return;
          // if (networkError) toast.error("Unable to connect to server.");
          // graphQLErrors.forEach((error) => {
          //   let message = error.message;
          //   const code = error.extensions?.code;
          //   if (code === "PERSISTED_QUERY_NOT_FOUND") return;
          //   if (message.startsWith("Internal error:")) {
          //     // We log this error to console so dev can look into it
          //     console.error(error);
          //     message = t("error.internal");
          //   }
          //   if (code === "UNAUTHENTICATED")
          //     message = t("error.unauthenticated");
          //   toast.error(message);
          // });
        },
      }),
      authExchange<{ accessToken?: string }>({
        async getAuth({ authState }) {
          if (!authState) {
            const accessToken = await AsyncStorage.getItem("accessToken");
            if (accessToken) {
              return { accessToken };
            }
            return null;
          }
          return null;
        },
        addAuthToOperation({ authState, operation }) {
          if (!authState?.accessToken) {
            return operation;
          }
          const fetchOptions =
            typeof operation.context.fetchOptions === "function"
              ? operation.context.fetchOptions()
              : operation.context.fetchOptions || {};
          return makeOperation(operation.kind, operation, {
            ...operation.context,
            fetchOptions: {
              ...fetchOptions,
              headers: {
                ...fetchOptions.headers,
                Authorization: authState.accessToken,
              },
            },
          });
        },
      }),
      fetchExchange,
      subscriptionExchange({
        forwardSubscription(operation) {
          return {
            subscribe: (sink) => {
              const dispose = wsClient.subscribe(operation, sink);
              return {
                unsubscribe: dispose,
              };
            },
          };
        },
      }),
    ].filter(Boolean) as Exchange[],
  });