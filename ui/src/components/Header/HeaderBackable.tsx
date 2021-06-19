import { IconChevronLeft } from "@auralous/ui/assets";
import { Button } from "@auralous/ui/components/Button";
import { useColors } from "@auralous/ui/styles";
import { useNavigation } from "@react-navigation/core";
import { FC } from "react";
import { useTranslation } from "react-i18next";
import Header from "./Header";

/**
 * Header with a back button that calls navigation.back
 */
interface HeaderBackableProps {
  title: string;
  backText?: string;
}

const HeaderBackable: FC<HeaderBackableProps> = ({ title, backText }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const colors = useColors();

  return (
    <Header
      left={
        <Button
          onPress={navigation.goBack}
          icon={<IconChevronLeft color={colors.text} />}
          accessibilityLabel={backText || t("common.navigation.go_back")}
        >
          {backText}
        </Button>
      }
      title={title}
    />
  );
};

export default HeaderBackable;
