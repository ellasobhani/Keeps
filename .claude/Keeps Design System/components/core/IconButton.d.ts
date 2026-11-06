/**
 * @startingPoint section="Components" subtitle="Solid (primary) and plain (secondary) icon-only control" viewport="700x160"
 */
export interface IconButtonProps {
  /** Ionicons v4 glyph suffix incl. platform prefix, e.g. "ios-add", "ios-menu", "ios-heart" */
  icon: string;
  size?: number;
  variant?: "solid" | "plain";
  color?: string;
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function IconButton(props: IconButtonProps): JSX.Element;
