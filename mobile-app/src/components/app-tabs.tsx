import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  const TriggerLabel = (NativeTabs.Trigger as any).Label;
  const TriggerIcon = (NativeTabs.Trigger as any).Icon;

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
        <TriggerLabel>Map</TriggerLabel>
        <TriggerIcon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="report">
        <TriggerLabel>Report</TriggerLabel>
        <TriggerIcon
          src={require("@/assets/images/tabIcons/explore.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="notifications">
        <TriggerLabel>Benachrichtigungen</TriggerLabel>
        <TriggerIcon
          src={require("@/assets/images/tabIcons/explore.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <TriggerLabel>Einstellungen/Profil</TriggerLabel>
        <TriggerIcon
          src={require("@/assets/images/tabIcons/explore.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
