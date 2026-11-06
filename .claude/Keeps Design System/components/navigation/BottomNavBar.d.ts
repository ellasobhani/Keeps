/**
 * @startingPoint section="Components" subtitle="Fixed 3-tab bar: profile / feed / search" viewport="700x120"
 */
export interface BottomNavBarProps {
  active: "profile" | "feed" | "search";
  onNavigate?: (tab: string) => void;
}
export function BottomNavBar(props: BottomNavBarProps): JSX.Element;
