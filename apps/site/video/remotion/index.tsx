import { Composition, registerRoot } from "remotion";
import { Film } from "./Film";
import timing from "./timing.json";
const Root = () => (
  <Composition
    id="FabrialsFilm"
    component={Film}
    width={1920}
    height={1080}
    fps={30}
    durationInFrames={timing.durationInFrames}
  />
);
registerRoot(Root);
