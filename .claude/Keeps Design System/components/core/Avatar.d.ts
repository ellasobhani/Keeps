/**
 * @startingPoint section="Components" subtitle="Circular photo avatar with initial fallback" viewport="700x140"
 */
export interface AvatarProps {
  src?: string | null;
  displayName: string;
  size?: number;
}
export function Avatar(props: AvatarProps): JSX.Element;
