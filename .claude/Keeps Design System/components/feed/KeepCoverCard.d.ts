/**
 * @startingPoint section="Components" subtitle="Square keep cover with title + privacy lock" viewport="700x220"
 */
export interface KeepCoverCardProps {
  title: string;
  coverSrc?: string | null;
  isPrivate?: boolean;
  hiddenFromProfile?: boolean;
  onClick?: () => void;
}
export function KeepCoverCard(props: KeepCoverCardProps): JSX.Element;
