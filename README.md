# Nivel20 Cards

Generador **no oficial** de cartas imprimibles para personajes de
[Nivel20](https://nivel20.com). Pega la URL de tu personaje y obtén cartas de
tamaño estándar para **conjuros, armas, armaduras, equipo y dotes/rasgos**,
listas para imprimir.

> Proyecto independiente de la comunidad. No está afiliado ni respaldado por Nivel20.
> La UI y la marca se inspiran en [nivel21](https://github.com/androettop/nivel21).

## Características

- **Pega la URL** del personaje (no hace falta subir el JSON).
- Cartas para conjuros, armas, armaduras, equipo y dotes/rasgos.
- **Panel de configuración**:
  - Tamaño de carta (Póker 63×88, Bridge, Mini USA, Tarot o personalizado).
  - Separación entre cartas, redondeado, grosor de borde y margen de página.
  - Escala de texto, iconos on/off y ajuste automático del texto.
  - Selección de categorías a incluir.
- Diseño optimizado para **impresión A4** (escala 100%, sin «ajustar a página»).
- La configuración se guarda en el navegador.

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo
npm run build    # build de producción en dist/
npm run preview  # previsualiza el build
```

Stack: **React + Vite + TypeScript**.

## Despliegue en GitHub Pages

El repositorio incluye un workflow (`.github/workflows/deploy.yml`) que compila
y publica automáticamente en cada push a `main`/`master`.

Para activarlo una sola vez:

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Haz push a la rama principal.

El sitio queda en `https://androettop.github.io/nivel20-cards/`.

> El `base` de Vite está configurado como `/nivel20-cards/` en `vite.config.ts`.
> Si renombras el repositorio, actualiza ese valor.

## Sobre CORS

La app intenta descargar el JSON directamente desde la URL. Si Nivel20 no
permite la petición desde el navegador (CORS), recurre automáticamente a un
proxy público. Como último recurso puedes **pegar el JSON manualmente** desde
el enlace de la barra superior.
