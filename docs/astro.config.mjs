import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

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
      { label: "mountForm", slug: "kit/mount-form" },
      { label: "Transport", slug: "kit/transport" },
      { label: "Lifecycle", slug: "kit/lifecycle" },
      { label: "Labels", slug: "kit/labels" },
      { label: "Mounted Form", slug: "kit/mounted-form" },
    ],
  },
  {
    label: "Engine",
    collapsed: true,
    items: [
      { label: "Overview", slug: "engine/overview" },
      { label: "Form Controller", slug: "engine/form-controller" },
      { label: "Field Controller", slug: "engine/field-controller" },
      { label: "Report Controller", slug: "engine/report-controller" },
      { label: "Registries", slug: "engine/registries" },
      { label: "Custom Fields", slug: "engine/custom-fields" },
      { label: "Custom Reports", slug: "engine/custom-reports" },
      { label: "Custom Explanations", slug: "engine/custom-explanations" },
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
      { label: "Overview", slug: "design-system/overview" },
      { label: "Themes and Recipes", slug: "design-system/themes-and-recipes" },
      { label: "Tokens", slug: "design-system/tokens" },
      { label: "Component Tokens", slug: "design-system/component-tokens" },
      { label: "Host Integration", slug: "design-system/host-integration" },
      { label: "Custom Themes", slug: "design-system/custom-themes" },
      { label: "Custom Recipes", slug: "design-system/custom-recipes" },
    ],
  },
  {
    label: "Cookbook",
    collapsed: true,
    items: [
      { label: "Authenticated Requests", slug: "cookbook/authenticated-requests" },
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
      { label: "Design System", slug: "reference/design-system" },
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
