import { getComponent } from "@/components/templates/registry";

interface DynamicHeaderProps {
  config: any;
  store: any;
  templateId: string;
}

export function DynamicHeader({ config, store, templateId }: DynamicHeaderProps) {
  const Header = getComponent("Header", templateId);
  return <Header config={config} store={store} templateId={templateId} />;
}
