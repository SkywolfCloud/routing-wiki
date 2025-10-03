import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  beginnerSidebar: [
    "beginner/beginner",
    "beginner/before",
    "beginner/bring-up-a-bgp-session",
    {
      type: "category",
      label: "三、与他人连接",
      link: {
        type: "doc",
        id: "beginner/connect-with-others/connect-with-others",
      },
      items: [
        "beginner/connect-with-others/concept",
        "beginner/connect-with-others/filters",
        "beginner/connect-with-others/lab",
        "beginner/connect-with-others/role",
      ],
    },
    {
      type: "category",
      label: "四、多节点部署",
      link: { type: "doc", id: "beginner/multi-location/multi-location" },
      items: [
        "beginner/multi-location/igp",
        "beginner/multi-location/ibgp",
        "beginner/multi-location/lab",
      ],
    },
    "beginner/after",
    "beginner/troubleshooting",
    "beginner/real-world-interconnection",
  ],
  miscSidebar: ["misc/misc", "misc/akvorado", "misc/tools"],
};

export default sidebars;
