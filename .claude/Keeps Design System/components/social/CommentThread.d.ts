export interface CommentThreadItem {
  author: string;
  body: string;
}
/**
 * @startingPoint section="Components" subtitle="Flat comment list — author bold, body inline" viewport="700x160"
 */
export interface CommentThreadProps {
  comments: CommentThreadItem[];
}
export function CommentThread(props: CommentThreadProps): JSX.Element;
