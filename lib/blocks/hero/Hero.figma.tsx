import figma from "@figma/code-connect";
import { Hero } from "./Hero";

// TODO(designer): Figma Hero 컴포넌트의 URL 로 아래를 채우세요.
// 예: "https://www.figma.com/design/WMYs9JCPzqL6rBFKM94Cx4/전시-자동화?node-id=59-3"
// 컴포넌트가 아직 없으면 Figma 에서 응용01 프레임을 → 컴포넌트로 승격 후 위 URL 을 복사.

figma.connect(Hero, "https://www.figma.com/design/REPLACE_FILE/REPLACE?node-id=REPLACE", {
  props: {
    label: figma.textContent("Label"),
    title: figma.textContent("Title"),
    subtitle: figma.textContent("Subtitle"),
    imageUrl: figma.instance("Image"),
    labelBg: figma.enum("Label BG", {
      Blue: "#2badd7",
      Pink: "#f8a4c6",
      Yellow: "#ffe24d"
    }),
    bg: figma.enum("Background", {
      Sky: "#dbf5ff",
      White: "#ffffff",
      Cream: "#fff8ea"
    })
  },
  example: (props) => (
    <Hero
      block={{
        id: "hero-1",
        type: "hero",
        label: props.label,
        title: props.title,
        subtitle: props.subtitle,
        imageUrl: props.imageUrl as unknown as string,
        labelBg: props.labelBg,
        bg: props.bg
      }}
    />
  )
});
