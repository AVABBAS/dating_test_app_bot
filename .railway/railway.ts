import { defineRailway, project, service } from "railway/iac";

// Last resort for a per-service CaC repo. Prefer one .railway file for the
// project and drop this if you later combine services into that file.
export const partial = "my_app";

export default defineRailway(() => {
  const my_app = service("my_app", {
    // dockerfilePath from CaC: "Dockerfile"
    // builder from CaC: "DOCKERFILE"
  });
  return project("disciplined-tranquility", {
    resources: [my_app],
  });
});
