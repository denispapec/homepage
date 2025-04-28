import Block from "components/services/widget/block";
import Container from "components/services/widget/container";

import useWidgetAPI from "utils/proxy/use-widget-api";

function SinglePlayingEntry({ entry }) {
  return (
    <div className="text-theme-700 dark:text-theme-200 relative h-5 w-full rounded-md bg-theme-200/50 dark:bg-theme-900/20 mt-1 flex">
      <div className="text-xs z-10 self-center ml-2 relative w-full h-4 grow mr-2">
        <div className="absolute w-full whitespace-nowrap text-ellipsis overflow-hidden">
          {entry.channel} ({entry.state})
        </div>
      </div>
    </div>
  );
}

export default function Component({ service }) {
  const { widget } = service;

  const { data: usersData, error: usersError } = useWidgetAPI(widget, "users");
  const { data: subscriptionsData, error: subscriptionsError } = useWidgetAPI(widget, "subscriptions");
  const { data: inputsData, error: inputsError } = useWidgetAPI(widget, "inputs");
  const { data: channelsData, error: channelsError } = useWidgetAPI(widget, "channels");
  const { data: dvrData, error: dvrError } = useWidgetAPI(widget, "dvr");

  if (usersError || subscriptionsError || inputsError || channelsError || dvrError) {
    const error = subscriptionsError || inputsError || channelsError || dvrError;
    return <Container service={service} error={error} />;
  }

  if (!usersData || !subscriptionsData || !inputsData || !channelsData || !dvrData) {
    return (
      <Container service={service}>
        <Block label="tvheadend.users" />
        <Block label="tvheadend.inputs" />
        <Block label="tvheadend.channels" />
        <Block label="tvheadend.dvr" />
      </Container>
    );
  }

  return (
    <>
      <Container service={service}>
        <Block label="tvheadend.users" value={usersData.entries.length} />
        <Block label="tvheadend.inputs" value={inputsData.entries.length} />
        <Block label="tvheadend.channels" value={channelsData.entries.length} />
        <Block label="tvheadend.dvr" value={dvrData.entries.length} />
      </Container>
      <div className="flex flex-col pb-1 mx-1">
        {subscriptionsData.entries.map((entry) => (
          <SinglePlayingEntry key={entry.id} entry={entry} />
        ))}
      </div>
    </>
  );
}
