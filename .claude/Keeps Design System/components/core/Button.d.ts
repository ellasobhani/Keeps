/**
 * @startingPoint section="Components" subtitle="Primary/secondary/text/danger button" viewport="700x220"
 */
export interface ButtonProps {
  /** Button text */
  label: string;
  variant?: "primary" | "secondary" | "text" | "danger";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function Button(props: ButtonProps): JSX.Element;
