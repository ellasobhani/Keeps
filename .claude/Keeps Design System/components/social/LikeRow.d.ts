/**
 * @startingPoint section="Components" subtitle="Heart toggle + names-not-counts + bookmark" viewport="700x120"
 */
export interface LikeRowProps {
  likedByNames: string[];
  hasLiked: boolean;
  isFavorited: boolean;
  onToggleLike?: () => void;
  onToggleFavorite?: () => void;
  onNameClick?: (name: string) => void;
}
export function LikeRow(props: LikeRowProps): JSX.Element;
