import ICAL from "ical.js";
import { DateTime } from "luxon";
import { useTranslation } from "next-i18next";
import { useEffect } from "react";

import Error from "../../../components/services/widget/error";
import useWidgetAPI from "../../../utils/proxy/use-widget-api";

// https://gist.github.com/jlevy/c246006675becc446360a798e2b2d781
function simpleHash(str) {
  /* eslint-disable, no-bitwise */
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
  /* eslint-disable, no-bitwise */
}

export default function Integration({ config, params, setEvents, hideErrors, timezone }) {
  const { t } = useTranslation();
  const { data: icalData, error: icalError } = useWidgetAPI(config, config.name, {
    refreshInterval: 300000, // 5 minutes
  });

  useEffect(() => {
    const { showName = false } = config?.params || {};
    let events = [];

    if (!icalError && icalData && !icalData.error) {
      if (!icalData.data) {
        icalData.error = { message: `'${config.name}': ${t("calendar.errorWhenLoadingData")}` };
        return;
      }

      const buildEvent = (event, type) => {
        return {
          id: event.getFirstPropertyValue("uid"),
          type,
          title: event.getFirstPropertyValue("summary"),
          rrule: event.getFirstPropertyValue("rrule"),
          dtstart: event.getFirstPropertyValue("dtstart") || event.getFirstPropertyValue("due"),
          dtend: event.getFirstPropertyValue("dtend") || event.getFirstPropertyValue("due"),
          location: event.getFirstPropertyValue("location"),
          status: event.getFirstPropertyValue("status"),
        };
      };

      const getEvents = () => {
        const jCal = ICAL.parse(icalData.data);
        const vCalendar = new ICAL.Component(jCal);

        const vEvents = vCalendar.getAllSubcomponents("vevent").map((event) => buildEvent(event, "vevent"));

        const vTodos = vCalendar.getAllSubcomponents("vtodo").map((todo) => buildEvent(todo, "vtodo"));

        return [...vEvents, ...vTodos];
      };

      events = getEvents();
      if (events.length === 0) {
        icalData.error = { message: `'${config.name}': ${t("calendar.noEventsFound")}` };
      }
    }

    const startDate = DateTime.fromISO(params.start);
    const endDate = DateTime.fromISO(params.end);

    if (icalError || events.length === 0 || !startDate.isValid || !endDate.isValid) {
      return;
    }

    const rangeStart = ICAL.Time.fromJSDate(startDate.toJSDate());
    const rangeEnd = ICAL.Time.fromJSDate(endDate.toJSDate());

    const getOcurrencesFromRange = (event) => {
      if (!event.rrule) {
        if (event.dtstart.compare(rangeStart) >= 0 && event.dtend.compare(rangeEnd) <= 0) {
          return [event.dtstart];
        }

        return [];
      }

      const iterator = event.rrule.iterator(event.dtstart);

      const occurrences = [];
      for (let next = iterator.next(); next && next.compare(rangeEnd) < 0; next = iterator.next()) {
        if (next.compare(rangeStart) < 0) {
          continue;
        }

        occurrences.push(next.clone());
      }

      return occurrences;
    };

    const eventsToAdd = [];
    events.forEach((event, index) => {
      const occurrences = getOcurrencesFromRange(event);

      occurrences.forEach((icalDate) => {
        const date = icalDate.toJSDate();

        const hash = simpleHash(`${event.id}-${event.title}-${index}-${date.toString()}`);

        let title = event.title;
        if (showName) {
          title = `${config.name}: ${title}`;
        }

        const getIsCompleted = () => {
          if (event.type === "vtodo") {
            return event.status === "COMPLETED";
          }

          return DateTime.fromJSDate(date) < DateTime.now();
        };

        eventsToAdd[hash] = {
          title,
          date: DateTime.fromJSDate(date),
          color: config?.color ?? "zinc",
          isCompleted: getIsCompleted(),
          additional: event.location,
          type: "ical",
        };
      });
    });

    setEvents((prevEvents) => ({ ...prevEvents, ...eventsToAdd }));
  }, [icalData, icalError, config, params, setEvents, timezone, t]);

  const error = icalError ?? icalData?.error;
  return error && !hideErrors && <Error error={{ message: `${config.type}: ${error.message ?? error}` }} />;
}
