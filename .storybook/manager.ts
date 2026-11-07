import { addons } from "storybook/manager-api";
import { fabrialsTheme } from "./theme";

addons.setConfig({ theme: fabrialsTheme, sidebar: { showRoots: true } });
