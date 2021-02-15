import { useUserQuery } from "gql/gql.gen";
import { useI18n } from "i18n/index";

const QueueAddedBy: React.FC<{ userId: string }> = ({ userId }) => {
  const { t } = useI18n();

  const [{ data: { user } = { user: undefined } }] = useUserQuery({
    variables: { id: userId },
  });

  return (
    <span className="flex-none">
      {t("queue.addedBy")}{" "}
      <span className="font-bold">{user?.username || ""}</span>
    </span>
  );
};

export default QueueAddedBy;
