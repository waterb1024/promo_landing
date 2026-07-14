import figma from "@figma/code-connect";
import { ImageText } from "./ImageText";

// TODO(designer): Figma ImageText 컴포넌트 URL 로 교체
figma.connect(
  ImageText,
  "https://www.figma.com/design/REPLACE_FILE/REPLACE?node-id=REPLACE",
  {
    props: {
      title: figma.textContent("Title"),
      body: figma.textContent("Body"),
      imageUrl: figma.instance("Image"),
      layout: figma.enum("Layout", {
        "Image Top": "image_top",
        "Image Bottom": "image_bottom",
        "Image Left": "image_left",
        "Image Right": "image_right"
      })
    },
    example: (props) => (
      <ImageText
        block={{
          id: "it-1",
          type: "image_text",
          layout: props.layout,
          title: props.title,
          body: props.body,
          imageUrl: props.imageUrl as unknown as string
        }}
      />
    )
  }
);
