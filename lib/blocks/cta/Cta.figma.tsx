import figma from "@figma/code-connect";
import { Cta } from "./Cta";

// TODO(designer): Figma CTA 버튼 컴포넌트 URL 로 교체
figma.connect(
  Cta,
  "https://www.figma.com/design/REPLACE_FILE/REPLACE?node-id=REPLACE",
  {
    props: {
      label: figma.textContent("Label"),
      variant: figma.enum("Variant", {
        Primary: "primary",
        Secondary: "secondary"
      })
    },
    example: (props) => (
      <Cta
        block={{
          id: "cta-1",
          type: "cta",
          label: props.label,
          href: "#",
          variant: props.variant
        }}
      />
    )
  }
);
