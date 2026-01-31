import { getComponent } from "@/components/templates/registry";

interface DynamicFooterProps {
  config: any;
  store: any;
  templateId: string;
}

export function DynamicFooter({ config, store, templateId }: DynamicFooterProps) {
  const Footer = getComponent("Footer", templateId);
  return <Footer config={config} store={store} templateId={templateId} />;
}
