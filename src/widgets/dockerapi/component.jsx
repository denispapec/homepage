import useSWR from "swr";
import { useTranslation } from "next-i18next";

import Container from "components/services/widget/container";
import Block from "components/services/widget/block";

export default function Component({ service }) {
  const { t } = useTranslation();

  const { widget } = service;
  const server = widget.server ?? service.server ?? "";

  const { data: statusData, error: statusError } = useSWR(`/api/docker/list/${server}`);

  if (statusError || statusData?.error) {
    const finalError = statusError ?? statusData?.error;
    return <Container service={service} error={finalError} />;
  }

  if (statusData && !(statusData.status.includes("running") || statusData.status.includes("partial"))) {
    return (
      <Container>
        <Block label={t("widget.status")} value={t("docker.offline")} />
      </Container>
    );
  }

  if (!statusData) {
    return (
      <Container service={service}>
        <Block label="docker.running" />
        <Block label="docker.exited" />
        <Block label="docker.unhealthy" />
        <Block label="docker.total" />
      </Container>
    );
  }

  return (
    <Container service={service}>
      <Block label="docker.running" value={statusData.status.filter((status) => status === "running").length} />
      <Block label="docker.exited" value={statusData.status.filter((status) => status === "exited").length} />
      <Block label="docker.unhealthy" value={statusData.status.filter((status) => status === "unhealthy").length} />
      <Block label="docker.total" value={statusData.status.length} />
    </Container>
  );
}
