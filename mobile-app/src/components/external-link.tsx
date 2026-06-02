import { Href, Link } from "expo-router";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";
import { type ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: Href<any> };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href as any}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== "web") {
          event.preventDefault();

          const url =
            typeof href === "string" ? href : (href as unknown as { href?: string }).href;

          if (!url) return;

          await openBrowserAsync(url, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
