import { useTranslation } from "next-i18next";
import { DateTime } from "luxon";
import { useEffect, useRef } from "react";

import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { t, i18n } = useTranslation();

  const { widget } = service;
  const options = { locale: i18n.language, unit: ["years", "months", "weeks", "days", "hours", "minutes"] };

  const { data: usersData, error: usersError } = useWidgetAPI(widget, "users");
  const { data: machinesData, error: machinesError } = useWidgetAPI(
    widget,
    "machines",
    widget?.user ? { user: widget.user } : {},
  );

  const timeAgo = useRef();

  useEffect(() => {
    machinesData?.machines.forEach((machine) => {
      if (!machine?.lastSeen) return;

      const lastSeen = DateTime.fromISO(machine.lastSeen);

      if (!(timeAgo.current && lastSeen < timeAgo.current)) {
        timeAgo.current = lastSeen;
      }
    });
  }, [machinesData]);

  if (usersError || machinesError) {
    const error = usersError || machinesError;
    return <Container service={service} error={error} />;
  }

  if (!usersData || !machinesData) {
    return (
      <Container service={service}>
        <Block label="headscale.users" />
        <Block label="headscale.online" />
        <Block label="headscale.total" />
        <Block label="headscale.last_seen" />
      </Container>
    );
  }

  return (
    <Container service={service}>
      <Block label="headscale.users" value={usersData.users.length} />
      <Block label="headscale.online" value={machinesData.machines.filter((machine) => machine.online).length} />
      <Block label="headscale.total" value={machinesData.machines.length} />
      <Block label="headscale.last_seen" value={timeAgo.current?.toRelative(options) ?? t("headscale.never")} />
    </Container>
  );
}
