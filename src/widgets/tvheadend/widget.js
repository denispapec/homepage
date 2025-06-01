import credentialedProxyHandler from "utils/proxy/handlers/credentialed";

const widget = {
  api: "{url}/api/{endpoint}",
  proxyHandler: credentialedProxyHandler,

  mappings: {
    users: {
      endpoint: "access/entry/userlist",
    },
    subscriptions: {
      endpoint: "status/subscriptions",
    },
    inputs: {
      endpoint: "status/inputs",
    },
    channels: {
      endpoint: "channel/list",
    },
    dvr: {
      endpoint: "dvr/entry/grid",
    },
  },
};

export default widget;
