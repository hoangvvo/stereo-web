import React, { useState } from "react";
import { animated, useSpring } from "react-spring";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "@reach/tabs";
import { Messenger } from "~/components/Message/index";
import {
  Story,
  StoryMembership,
  StoryState,
  useUserQuery,
} from "~/graphql/gql.gen";
import { useCurrentUser } from "~/hooks/user";
import { MEMBERSHIP_NAMES } from "~/lib/constants";
import { AuthBanner } from "~/components/Auth";
import { getRole } from "~/lib/story";
import { useI18n } from "~/i18n/index";
import { SvgUserGroup } from "~/assets/svg";

const CurrentUser: React.FC<{
  userId: string;
  role: StoryMembership | undefined;
}> = ({ userId, role }) => {
  const [{ data }] = useUserQuery({ variables: { id: userId } });
  return (
    <div className="h-12 mb-2 w-full mr-1 flex py-2 bg-background-secondary rounded-lg">
      {
        //FIXME: Add user name
        data?.user ? (
          <>
            <div className="px-2 flex-none">
              <img
                className="w-8 h-8 rounded-full object-cover"
                src={data.user.profilePicture}
                alt={data.user.username}
                title={data.user.username}
              />
            </div>
            <div className="font-bold text-foreground flex items-center justify-between w-full">
              <div className="flex-1 w-0 leading-none truncate">
                {data.user.username}
              </div>
              <div className="px-2 flex items-center">
                <span className="py-1 px-2 text-xs rounded-full bg-background-secondary">
                  {MEMBERSHIP_NAMES[role || ""]}
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mx-2 flex-none w-8 h-8 rounded-full bg-background-secondary animate-pulse" />
            <div className="bg-background-secondary animate-pulse rounded-lg w-full mr-2" />
          </>
        )
      }
    </div>
  );
};

const StoryUsers: React.FC<{
  storyState: StoryState;
  story: Story;
}> = ({ story, storyState }) => {
  return (
    <div className="h-full p-2">
      {storyState.userIds.map((userId) => (
        // TODO: react-window
        <CurrentUser
          key={userId}
          userId={userId}
          role={getRole(userId, story, storyState)}
        />
      ))}
    </div>
  );
};

const AnimatedTabPanel = animated(TabPanel);
const tabInactiveStyle = { opacity: 0, transform: "translate3d(0px,40px,0px)" };
const tabActiveStyle = { opacity: 1, transform: "translate3d(0px,0px,0px)" };

const StoryChat: React.FC<{ story: Story; storyState: StoryState }> = ({
  story,
  storyState,
}) => {
  const { t } = useI18n();
  const user = useCurrentUser();

  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const chatPanelStyle = useSpring(
    0 === selectedIndex ? tabActiveStyle : tabInactiveStyle
  );
  const userPanelStyle = useSpring(
    1 === selectedIndex ? tabActiveStyle : tabInactiveStyle
  );

  const getClassName = (index: number) =>
    `flex flex-center flex-1 mx-1 p-1 text-sm rounded-lg font-bold ${
      index === selectedIndex ? "bg-pink text-white" : ""
    } transition`;

  if (!user)
    return (
      <div className="h-full w-full flex flex-col justify-center border-2 border-blue-secondary rounded-lg">
        <AuthBanner
          prompt={t("story.chat.authPrompt")}
          hook={t("story.chat.authPromptHook")}
        />
      </div>
    );
  return (
    <Tabs onChange={setSelectedIndex} className="h-full flex flex-col">
      <TabList className="flex flex-none">
        <Tab className={getClassName(0)}>{t("story.chat.title")}</Tab>
        <Tab className={`${getClassName(1)} flex-none px-2`}>
          <SvgUserGroup width="12" height="12" />
          <span className="ml-1">
            {storyState.userIds.length || 0}
            <span className="sr-only">{t("story.chat.listener")}</span>
          </span>
        </Tab>
      </TabList>
      <TabPanels className="flex-1 h-0">
        <AnimatedTabPanel style={chatPanelStyle} className="h-full" as="div">
          <Messenger id={`story:${story.id}`} />
        </AnimatedTabPanel>
        <AnimatedTabPanel style={userPanelStyle} className="h-full" as="div">
          <StoryUsers story={story} storyState={storyState} />
        </AnimatedTabPanel>
      </TabPanels>
    </Tabs>
  );
};

export default StoryChat;