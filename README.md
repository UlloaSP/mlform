# MLForm

[![CI Pipeline](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml/badge.svg)](https://github.com/UlloaSP/mlform/actions/workflows/ci.yml)
[![Release](https://github.com/UlloaSP/mlform/actions/workflows/release.yml/badge.svg)](https://github.com/UlloaSP/mlform/actions/workflows/release.yml)

Un framework para crear formularios dinámicos con capacidades de machine learning.

## 🚀 Características

- **Formularios dinámicos**: Genera formularios basados en esquemas JSON
- **Integración ML**: Soporte para modelos de clasificación y regresión  
- **Web Components**: Componentes reutilizables basados en Lit
- **TypeScript**: Totalmente tipado para mejor DX
- **Validación**: Validación robusta con Zod

## 📦 Instalación

```bash
npm install mlform
```

## 🏗️ Desarrollo

### Requisitos previos

- Node.js >= 18
- npm >= 9

### Configuración del entorno

```bash
# Clonar el repositorio
git clone https://github.com/UlloaSP/mlform.git
cd mlform

# Instalar dependencias
npm install

# Ejecutar tests
npm test

# Verificar código
npm run lint

# Formatear código
npm run format

# Verificar tipos
npm run type

# Construir proyecto
npm run build

# Generar documentación
npm run docs
```

### Scripts disponibles

- `npm run lint` - Ejecuta ESLint
- `npm run lint:fix` - Corrige automáticamente los errores de linting
- `npm run format` - Formatea el código con Prettier
- `npm run format:check` - Verifica el formato del código
- `npm run type` - Verifica tipos con TypeScript
- `npm run test` - Ejecuta tests con Vitest
- `npm run test:watch` - Ejecuta tests en modo watch
- `npm run coverage` - Genera reporte de cobertura
- `npm run build` - Construye el proyecto para producción
- `npm run docs` - Genera documentación con TypeDoc
- `npm run ci` - Ejecuta todo el pipeline de CI localmente

## 🔄 CI/CD Pipeline

El proyecto incluye un pipeline completo de CI/CD con GitHub Actions:

### Pipeline de CI (`.github/workflows/ci.yml`)

Se ejecuta en cada push y pull request e incluye:

1. **🔍 Lint & Format** - Verificación de código con ESLint y Prettier
2. **📝 Type Check** - Verificación de tipos TypeScript
3. **🧪 Testing** - Tests unitarios en múltiples versiones de Node.js (18, 20, 22)
4. **🏗️ Build** - Construcción del proyecto
5. **📚 Documentation** - Generación de documentación (solo en main/docs)
6. **🔒 Security** - Auditoría de seguridad de dependencias

### Pipeline de Release (`.github/workflows/release.yml`)

Se ejecuta en tags de versión e incluye:

1. **🚀 Release** - Creación de releases en GitHub
2. **📦 NPM Publish** - Publicación automática en NPM

### Configuración de Quality Gates

- **Cobertura de tests**: 80% mínimo
- **Linting**: Sin errores
- **Formato**: Código debe seguir las reglas de Prettier
- **Tipos**: Sin errores de TypeScript
- **Build**: Debe compilar sin errores

## 📊 Reportes

- **Cobertura de tests**: Generada con Vitest y c8
- **Bundle size**: Visualización con rollup-plugin-visualizer en `stats/`
- **Documentación**: Disponible en `docs/` después de ejecutar `npm run docs`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guidelines de contribución

- Sigue las reglas de ESLint y Prettier
- Escribe tests para nuevas funcionalidades
- Mantén la cobertura de tests >= 80%
- Documenta el código con JSDoc
- Usa Conventional Commits para mensajes de commit

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🔗 Enlaces

- [Documentación](https://ulloasp.github.io/mlform/)
- [Issues](https://github.com/UlloaSP/mlform/issues)
- [NPM Package](https://www.npmjs.com/package/mlform)
