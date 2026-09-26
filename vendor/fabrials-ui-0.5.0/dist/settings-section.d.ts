import { type ComponentProps, type ReactNode } from "react";
export type SettingsSectionProps = Omit<ComponentProps<"section">, "title"> & {
    title: ReactNode;
    description?: ReactNode;
    status?: ReactNode;
    headingLevel?: 2 | 3 | 4;
};
export declare function SettingsSection({ id, title, description, status, headingLevel, className, children, ...props }: SettingsSectionProps): import("react").JSX.Element;
