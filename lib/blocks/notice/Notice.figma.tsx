import figma from "@figma/code-connect";
import { Notice } from "./Notice";

// TODO(designer): Figma Notice 컴포넌트 URL 로 교체
figma.connect(
  Notice,
  "https://www.figma.com/design/REPLACE_FILE/REPLACE?node-id=REPLACE",
  {
    props: {
      title: figma.textContent("Title"),
      // Notice 는 불릿 배열이라 Figma property 로 그대로 매핑 어려움 → 예시에 하드코딩
      bg: figma.enum("Background", {
        Gray: "#f4f4f4",
        White: "#ffffff",
        Warning: "#fff4e5"
      })
    },
    example: (props) => (
      <Notice
        block={{
          id: "notice-1",
          type: "notice",
          title: props.title,
          bullets: ["첫 번째 안내 항목", "두 번째 안내 항목"],
          bg: props.bg
        }}
      />
    )
  }
);
