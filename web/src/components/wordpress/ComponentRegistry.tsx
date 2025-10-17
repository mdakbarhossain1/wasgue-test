import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Import all available components
// Using dynamic imports for better code splitting
const componentMap: Record<string, ComponentType<any>> = {
  TextContent: dynamic(() => import("components/sections/TextContent")),
  ContactSection: dynamic(() => import("components/sections/ContactSection")),
  ImageTextBlock: dynamic(() => import("components/sections/ImageTextBlock")),
  ProductShowcase: dynamic(() => import("components/sections/ProductShowcase")),
  FAQ: dynamic(() => import("components/sections/FAQ")),
  Video: dynamic(() => import("components/sections/Video")),
  TextBox: dynamic(() => import("components/sections/TextBox")),
  ProductSingle: dynamic(() => import("components/sections/ProductSingle")),
  Timeline: dynamic(() => import("components/sections/Timeline")),
  Infobox: dynamic(() => import("components/sections/Infobox")),
  CTABanner: dynamic(() => import("components/sections/CTABanner")),
  FancyProduct: dynamic(() => import("components/sections/FancyProduct")),
  ContentColumns: dynamic(() => import("components/sections/ContentColumns")),
};

interface ComponentData {
  component: string;
  props: any;
}

interface ComponentRendererProps {
  components: ComponentData[];
}

export function ComponentRenderer({ components }: ComponentRendererProps) {
  console.log("components_asq: ", components);
  if (!components || !Array.isArray(components)) {
    return null;
  }

  return (
    <>
      {components.map((componentData, index) => {
        const Component = componentMap[componentData.component];

        if (!Component) {
          console.warn(
            `Component "${componentData.component}" not found in registry`
          );
          return null;
        }

        return (
          <Component
            key={`${componentData.component}-${index}`}
            {...componentData.props}
          />
        );
      })}
    </>
  );
}

// Export available component names for documentation
export const availableComponents = Object.keys(componentMap);

// Helper to check if a component exists
export function hasComponent(componentName: string): boolean {
  return componentName in componentMap;
}

// Get component by name
export function getComponent(componentName: string): ComponentType<any> | null {
  return componentMap[componentName] || null;
}
