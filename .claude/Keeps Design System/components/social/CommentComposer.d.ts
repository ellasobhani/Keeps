/**
 * @startingPoint section="Components" subtitle="Pinned footer text field + Post action" viewport="700x100"
 */
export interface CommentComposerProps {
  value: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}
export function CommentComposer(props: CommentComposerProps): JSX.Element;
