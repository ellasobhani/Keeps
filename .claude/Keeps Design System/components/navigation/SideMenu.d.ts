export interface SideMenuItem {
  key: string;
  label: string;
  icon: string;
  onClick: () => void;
}
/**
 * @startingPoint section="Components" subtitle="Right-side sliding menu, backdrop dismiss" viewport="700x360"
 */
export interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  items: SideMenuItem[];
  onSignOut: () => void;
}
export function SideMenu(props: SideMenuProps): JSX.Element;
