import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import { fileURLToPath } from "node:url";

const sidebar = [
  {
    label: "Start",
    items: [
      { label: "Overview", slug: "" },
      { label: "Installation", slug: "getting-started/installation" },
      { label: "Quick Start", slug: "getting-started/quick-start" },
      { label: "First Backend", slug: "getting-started/first-backend" },
      { label: "Mental Model", slug: "getting-started/mental-model" },
    ],
  },
  {
    label: "Tutorials",
    collapsed: true,
    items: [
      { label: "Basic Prediction Form", slug: "tutorials/basic-prediction-form" },
      { label: "Classification Workflow", slug: "tutorials/classification-workflow" },
      { label: "Regression Workflow", slug: "tutorials/regression-workflow" },
      { label: "Conditional Form", slug: "tutorials/conditional-form" },
      { label: "Series Forecasting", slug: "tutorials/series-forecasting" },
    ],
  },
  {
    label: "Concepts",
    collapsed: true,
    items: [
      { label: "Architecture", slug: "concepts/architecture" },
      { label: "Schema", slug: "concepts/schema" },
      { label: "Layout", slug: "concepts/layout" },
      { label: "Transport", slug: "concepts/transport" },
      { label: "Lifecycle", slug: "concepts/lifecycle" },
    ],
  },
  {
    label: "Guides",
    collapsed: true,
    items: [
      { label: "Schema Design", slug: "guides/schema-design" },
      { label: "Backend Contract", slug: "guides/backend-contract" },
      { label: "Validation", slug: "guides/validation" },
      { label: "Hooks and Lifecycle", slug: "guides/hooks-and-lifecycle" },
      { label: "Error Handling", slug: "guides/error-handling" },
      { label: "Accessibility", slug: "guides/accessibility" },
      { label: "Testing MLForm", slug: "guides/testing-mlform" },
      { label: "Performance", slug: "guides/performance" },
    ],
  },
  {
    label: "Integrations",
    collapsed: true,
    items: [
      { label: "Vanilla", slug: "integrations/vanilla" },
      { label: "React", slug: "integrations/react" },
      { label: "Vue", slug: "integrations/vue" },
      { label: "Angular", slug: "integrations/angular" },
      { label: "Astro", slug: "integrations/astro" },
      { label: "FastAPI", slug: "integrations/fastapi" },
      { label: "Express", slug: "integrations/express" },
    ],
  },
  {
    label: "Schema",
    collapsed: true,
    items: [
      { label: "Overview", slug: "schema/overview" },
      { label: "Fields", slug: "schema/fields" },
      { label: "Mapped Category", slug: "schema/mapped-category" },
      { label: "Reports", slug: "schema/reports" },
      { label: "Conditions", slug: "schema/conditions" },
      { label: "Initial Values", slug: "schema/initial-values" },
      { label: "Inactive Fields", slug: "schema/inactive-fields" },
    ],
  },
  {
    label: "Kit",
    collapsed: true,
    items: [
      { label: "Headless Kit", slug: "kit/headless-kit" },
      { label: "Layout Overview", slug: "kit/layout-overview" },
      { label: "Layout Schema", slug: "kit/layout-schema" },
      { label: "createFormView", slug: "kit/create-form-view" },
      { label: "Custom Layouts", slug: "kit/custom-layouts" },
      { label: "Layout Recipes", slug: "kit/layout-recipes" },
      { label: "Layout Errors", slug: "kit/layout-errors" },
      { label: "mountForm", slug: "kit/mount-form" },
      { label: "Wizard Layout", slug: "kit/wizard-layout" },
      { label: "Tabs Layout", slug: "kit/tabs-layout" },
      { label: "Accordion Layout", slug: "kit/accordion-layout" },
      { label: "Transport", slug: "kit/transport" },
      { label: "Lifecycle", slug: "kit/lifecycle" },
      { label: "Labels", slug: "kit/labels" },
      { label: "Mounted Form", slug: "kit/mounted-form" },
    ],
  },
  {
    label: "Runtime",
    collapsed: true,
    items: [
      { label: "Overview", slug: "runtime/overview" },
      { label: "Form Controller", slug: "runtime/form-controller" },
      { label: "Field Controller", slug: "runtime/field-controller" },
      { label: "Report Controller", slug: "runtime/report-controller" },
      { label: "Registries", slug: "runtime/registries" },
      { label: "Custom Fields", slug: "runtime/custom-fields" },
      { label: "Custom Reports", slug: "runtime/custom-reports" },
    ],
  },
  {
    label: "Primitives",
    collapsed: true,
    items: [
      { label: "Overview", slug: "primitives/overview" },
      { label: "Built-in Elements", slug: "primitives/built-in-elements" },
      { label: "Events", slug: "primitives/events" },
      { label: "Custom Renderers", slug: "primitives/custom-renderers" },
      { label: "Layouts", slug: "primitives/layouts" },
    ],
  },
  {
    label: "Design System",
    collapsed: true,
    items: [
      { label: "Overview", slug: "design/overview" },
      { label: "Themes and Recipes", slug: "design/themes-and-recipes" },
      { label: "Tokens", slug: "design/tokens" },
      { label: "Component Tokens", slug: "design/component-tokens" },
      { label: "Host Integration", slug: "design/host-integration" },
      { label: "Custom Themes", slug: "design/custom-themes" },
      { label: "Custom Recipes", slug: "design/custom-recipes" },
    ],
  },
  {
    label: "Cookbook",
    collapsed: true,
    items: [
      { label: "Authenticated Requests", slug: "cookbook/authenticated-requests" },
      { label: "Custom Wizard", slug: "cookbook/custom-wizard-from-headless-kit" },
      { label: "Tabbed Forms", slug: "cookbook/tabbed-forms" },
      { label: "Tabs Built-in vs Headless", slug: "cookbook/tabs-built-in-vs-headless" },
      { label: "Accordion Forms", slug: "cookbook/accordion-forms" },
      { label: "Accordion Built-in vs Headless", slug: "cookbook/accordion-built-in-vs-headless" },
      { label: "Layout Showcase", link: "/cookbook/layout-showcase/" },
      { label: "Review Before Submit", slug: "cookbook/review-confirm-submit" },
      { label: "Progressive Disclosure Layout", slug: "cookbook/progressive-disclosure-layout" },
      { label: "Layout From Backend Metadata", slug: "cookbook/layout-from-backend-metadata" },
      { label: "React Headless Layout", slug: "cookbook/react-headless-layout" },
      { label: "Vue Headless Layout", slug: "cookbook/vue-headless-layout" },
      { label: "Vanilla Headless Layout", slug: "cookbook/vanilla-dom-headless-layout" },
      { label: "Local Model Transport", slug: "cookbook/local-model-transport" },
      { label: "Multi-step Forms", slug: "cookbook/multi-step-forms" },
      { label: "Live Preview", slug: "cookbook/live-preview" },
      { label: "Server Errors", slug: "cookbook/server-errors" },
      { label: "Read-only Review Mode", slug: "cookbook/read-only-review-mode" },
      { label: "Embedding in Dashboard", slug: "cookbook/embedding-in-dashboard" },
    ],
  },
  {
    label: "Reference",
    collapsed: true,
    items: [
      { label: "Package Exports", slug: "reference/package-exports" },
      { label: "Kit", slug: "reference/kit" },
      { label: "Engine", slug: "reference/engine" },
      { label: "Primitives", slug: "reference/primitives" },
      { label: "Design System", slug: "reference/design" },
      { label: "Errors", slug: "reference/errors" },
      { label: "Events", slug: "reference/events" },
    ],
  },
  {
    label: "Migration & Support",
    collapsed: true,
    items: [
      { label: "From Legacy MLForm", slug: "migration/from-legacy-mlform" },
      { label: "Troubleshooting", slug: "support/troubleshooting" },
      { label: "FAQ", slug: "support/faq" },
      { label: "Versioning", slug: "support/versioning" },
    ],
  },
];

export default defineConfig({
  site: "https://ulloasp.github.io",
  base: "/mlform",
  vite: {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("../src", import.meta.url)),
      },
    },
  },
  integrations: [
    starlight({
      title: "MLForm",
      logo: {
        src: "./src/assets/logo.svg",
        alt: "MLForm",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/UlloaSP/mlform",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/UlloaSP/mlform/edit/main/docs/",
      },
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "/mlform/social-card.svg",
          },
        },
      ],
      defaultLocale: "root",
      locales: {
        root: {
          label: "English",
          lang: "en",
        },
        es: {
          label: "Español",
          lang: "es",
        },
      },
      customCss: ["./src/styles/custom.css"],
      sidebar,
    }),
  ],
});
