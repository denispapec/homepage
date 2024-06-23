import credentialedProxyHandler from "utils/proxy/handlers/credentialed";

const widget = {
  api: "{url}/api/v1/{endpoint}",
  proxyHandler: credentialedProxyHandler,

  mappings: {
    users: {
      endpoint: "user",
      validate: ["users"],
    },
    machines: {
      endpoint: "machine",
      validate: ["machines"],
    },
  },
};

export default widget;
