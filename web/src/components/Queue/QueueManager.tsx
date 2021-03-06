import { SvgMoreVerticalAlt, SvgPlayListRemove } from "assets/svg/index";
import clsx from "clsx";
import { Button } from "components/Pressable";
import { TrackItem } from "components/Track/index";
import { Typography } from "components/Typography";
import { Box } from "components/View";
import {
  Queue,
  useQueueQuery,
  useQueueRemoveMutation,
  useQueueReorderMutation,
  useQueueUpdatedSubscription,
  useTrackQuery,
} from "gql/gql.gen";
import { useI18n } from "i18n/index";
import { memo, useCallback, useMemo } from "react";
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";
import toast from "react-hot-toast";
import AutoSizer from "react-virtualized-auto-sizer";
import {
  areEqual,
  FixedSizeList as List,
  ListChildComponentProps,
} from "react-window";
import { remToPx } from "utils/util";
import QueueAddedBy from "./QueueAddedBy";

const GUTTER_SIZE = 5;

const QueueDraggableItem: React.FC<{
  isQueueable: boolean;
  provided: DraggableProvided;
  index: number;
  isDragging?: boolean;
  queue: Queue;
  style?: Partial<React.CSSProperties>;
}> = ({ isQueueable, provided, isDragging, queue, index, style }) => {
  const { t } = useI18n();

  const [{ data: { track } = { track: undefined } }] = useTrackQuery({
    variables: { id: queue.items[index].trackId },
  });

  const [, queueRemove] = useQueueRemoveMutation();
  const removeItem = useCallback(async () => {
    if (!queue) return;
    const { data } = await queueRemove({
      id: queue.id,
      trackId: queue.items[index].trackId,
      creatorId: queue.items[index].creatorId,
    });
    if (data?.queueRemove)
      toast.success(t("queue.manager.removeSuccess", { title: track?.title }));
  }, [t, queue, queueRemove, track, index]);

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{
        ...provided.draggableProps.style,
        ...(style && {
          ...style,
          top: (style.top as number) + GUTTER_SIZE,
          height: (style.height as number) - GUTTER_SIZE,
        }),
      }}
      className={clsx(
        "select-none flex p-2 items-center",
        isDragging && "opacity-75"
      )}
    >
      <div {...provided.dragHandleProps} hidden={!isQueueable}>
        <Button
          accessibilityLabel={t("queue.manager.move", {
            trackTitle: track?.title,
          })}
          styling="link"
          icon={<SvgMoreVerticalAlt />}
        />
      </div>
      <Box paddingX="sm" row alignItems="center" minWidth={0} flex={1}>
        <TrackItem
          id={queue.items[index].trackId}
          extraInfo={<QueueAddedBy userId={queue.items[index].creatorId} />}
        />
      </Box>
      {isQueueable && (
        <Button
          accessibilityLabel={t("queue.manager.remove", {
            trackTitle: track?.title,
          })}
          styling="link"
          onPress={removeItem}
          icon={<SvgPlayListRemove />}
        />
      )}
    </div>
  );
};

const Row = memo<
  Pick<ListChildComponentProps, "index" | "style"> & {
    data: {
      queue: Queue;
      isQueueable: boolean;
    };
  }
>(function Row({ data, index, style }) {
  const key = `${data.queue.items[index].trackId}:${data.queue.items[index].creatorId}`;
  return (
    <Draggable key={key} draggableId={key} index={index}>
      {(provided1) => (
        <QueueDraggableItem
          style={style}
          provided={provided1}
          isQueueable={data.isQueueable}
          queue={data.queue}
          index={index}
          isDragging={false}
        />
      )}
    </Draggable>
  );
}, areEqual);

const QueueManager: React.FC<{
  queueId: string;
  isQueueable: boolean;
  inactive?: boolean;
}> = ({ queueId, isQueueable, inactive }) => {
  const { t } = useI18n();

  const [{ data: { queue } = { queue: undefined } }] = useQueueQuery({
    variables: { id: queueId },
    // TODO: Do we need this?
    // requestPolicy: "cache-and-network",
    pause: inactive,
  });

  useQueueUpdatedSubscription({
    variables: { id: queueId },
    pause: !queue,
  });

  const [, queueReorder] = useQueueReorderMutation();

  const onDragEnd = useCallback(
    async ({ source: origin, destination }: DropResult) => {
      if (!queue) return;
      if (
        !destination ||
        (origin.index === destination.index &&
          origin.droppableId === destination.droppableId)
      )
        return;
      await queueReorder({
        id: queue.id,
        position: origin.index,
        insertPosition: destination.index,
      });
    },
    [queue, queueReorder]
  );

  const itemData = useMemo(
    () => ({
      queue,
      isQueueable,
    }),
    [queue, isQueueable]
  );

  if (!queue) return null;

  return (
    <>
      {queue.items?.length === 0 && (
        <div className="absolute-center z-10 w-full p-4">
          <Typography.Paragraph
            align="center"
            size="lg"
            color="foreground-tertiary"
          >
            {t("queue.manager.empty")}
          </Typography.Paragraph>
        </div>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable
          droppableId="droppable"
          mode="virtual"
          renderClone={(provided, snapshot, rubric) => (
            <QueueDraggableItem
              provided={provided}
              isQueueable={true}
              queue={queue}
              index={rubric.source.index}
              isDragging={snapshot.isDragging}
            />
          )}
        >
          {(droppableProvided) => (
            <AutoSizer defaultHeight={1} defaultWidth={1}>
              {({ height, width }) => (
                <List
                  height={height}
                  width={width}
                  itemCount={queue.items.length}
                  itemSize={remToPx(4)}
                  itemData={itemData}
                  outerRef={droppableProvided.innerRef}
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

export default QueueManager;
