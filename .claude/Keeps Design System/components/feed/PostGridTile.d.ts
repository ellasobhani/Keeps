/**
 * @startingPoint section="Components" subtitle="3-up square media tile with carousel/video badges" viewport="700x220"
 */
export interface PostGridTileProps {
  src?: string | null;
  mediaCount?: number;
  isVideo?: boolean;
  onClick?: () => void;
}
export function PostGridTile(props: PostGridTileProps): JSX.Element;
