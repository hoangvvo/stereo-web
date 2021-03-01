import { useWindowHeight } from "@react-hook/window-size";
import { SvgChevronLeft } from "assets/svg";
import LayoutAppContext from "components/Layout/LayoutApp/LayoutAppContext";
import { Button } from "components/Pressable";
import { Typography } from "components/Typography";
import { Box } from "components/View";
import { useI18n } from "i18n";
import { useContext } from "react";
import MapMain from "./MapMain";

const MapContainer: React.FC = () => {
  const { t } = useI18n();
  const { back } = useContext(LayoutAppContext);
  const height = useWindowHeight();

  return (
    <Box
      position="relative"
      padding="md"
      justifyContent="center"
      style={{ height }}
    >
      <MapMain />
      <Box row alignItems="center" position="absolute" top={2} left={2}>
        <Button
          styling="link"
          icon={<SvgChevronLeft className="w-8 h-8" />}
          accessibilityLabel={t("modal.close")}
          onPress={back}
        />
        <Typography.Text strong color="foreground-secondary">
          {t("map.title")}
        </Typography.Text>
      </Box>
    </Box>
  );
};

export default MapContainer;
