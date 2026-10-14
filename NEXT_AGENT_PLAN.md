# Plano de execução — Redesign "anime.js style"

> Execute as fases em ordem. Marque `[x]` ao concluir cada item e salve este arquivo
> para que outro agente possa retomar de onde parou.
> **Não altere a lógica** de `Home.vue`, `store/`, `helpers/` (exceto criar `animations.js`) e `api/`. Apenas UI/estilo.
> A estrutura se mantém: **formulário** + **progresso de upload/conversão em modal/bottom-sheet**.

---

## Status atual

- [x] Paleta extraída do CSS oficial do anime.js (abaixo)
- [x] Fase 1 — Tema Vuetify + estilos globais (`plugins/vuetify.js`, `styles/theme.scss`, `index.html`, import em `main.js`)
- [x] Fase 2 — anime.js 4.5 instalado + `transpileDependencies` + `src/helpers/animations.js`
- [x] Fase 3 — Componentes reescritos (`App.vue`, `Home.vue` [só template/mounted/estilo], `ConversionForm.vue`, `ConversionOverlay.vue`, `ConversionProgress.vue`)
- [x] Fase 4 — Validação concluída:
  - `npx vue-cli-service lint --fix`: 0 erros (`DONE No lint errors found!`)
  - `npm run build`: compilado com sucesso (`DONE Build complete. The dist directory is ready to be deployed.`)
  - Servidor de desenvolvimento rodando com sucesso (`http://localhost:8085/`).


---

## Design tokens (fonte: https://animejs.com/assets/css/core.css)

| Token        | Hex       | Uso                                           |
|--------------|-----------|-----------------------------------------------|
| `bg`         | `#252423` | Fundo da página                               |
| `bg-grid`    | `#1F1F1E` | Linhas do grid de fundo (estilo easing editor)|
| `surface`    | `#2C2A28` | Cards / sheet                                 |
| `surface-2`  | `#3B3936` | Inputs, chips, trilhas de progresso           |
| `border`     | `#4A4745` | Bordas 1px                                    |
| `text`       | `#F6F4F2` | Texto principal                               |
| `text-muted` | `#85827E` | Texto secundário / labels                     |
| `red`        | `#FF4B4B` | **primary** — CTA, upload, erro               |
| `red-dark`   | `#D44343` | hover do primary                              |
| `green`      | `#8DFF55` | **success** — concluído, download             |
| `yellow`     | `#FFCC2A` | **secondary/warning** — conversão em andamento|
| `orange`     | `#FFA828` | accent (gradientes red→orange→yellow)         |
| `cyan`       | `#26F2D5` | info                                          |

Tipografia (Google Fonts): títulos **Space Grotesk 700**, corpo **Inter 400/500**,
números/percentuais **JetBrains Mono 500**. Raio: 14px cards, 999px pills.
Bordas finas 1px `border`, sem sombras pesadas — usar *glow* colorido (`box-shadow: 0 0 24px <cor>55`).

---

## Fase 1 — Tema Vuetify + estilos globais

- `src/plugins/vuetify.js`: `theme.dark = true`, `customProperties: true`, cores:
  primary `#FF4B4B`, secondary `#FFCC2A`, accent `#FFA828`, success `#8DFF55`,
  warning `#FFCC2A`, error `#FF4B4B`, info `#26F2D5`, background `#252423`, surface `#2C2A28`.
- `public/index.html`: `lang="pt-BR"`, título/meta description SEO, Google Fonts
  (Space Grotesk, Inter, JetBrains Mono).
- `src/styles/theme.scss` (importado em `main.js`): CSS vars dos tokens, fundo com grid,
  classes utilitárias `.font-mono`, `.font-display`, `.text-gradient`.

## Fase 2 — anime.js

1. `npm i animejs@^4` e adicionar `'animejs'` em `transpileDependencies` (`vue.config.js`).
   Se o webpack 4 não compilar, usar `animejs@3.2.2` e adaptar a API.
2. `src/helpers/animations.js` com funções puras que respeitam `prefers-reduced-motion`:
   `introTimeline`, `floatShapes`, `magnetic`, `pressBounce`, `sheetIn`, `countUp`,
   `popIn`, `equalizer`, `confetti`, `shake`, `pulse`. Reverter/pausar instâncias em `beforeDestroy`.

## Fase 3 — Componentes (manter props/eventos atuais!)

- `App.vue`: top bar custom (logo com 3 dots red/yellow/green), fundo grid, shapes flutuantes.
- `ConversionForm.vue`: manter `props.disabled`, eventos `submit({file, format})`, `error` e
  método público `reset()`. Dropzone custom (drag&drop + input oculto, validação `MAX_FILE_SIZE`),
  formatos como grid de chips (`OUTPUT_FORMATS`), CTA pill magnético.
- `ConversionOverlay.vue`: bottom-sheet escuro animado (spring) no lugar do `v-overlay` branco.
  Manter props e eventos `download`, `reset`, `retry`. Estados: uploading / converting /
  done (confetti) / error (shake).
- `ConversionProgress.vue`: stepper 2 etapas + anel SVG com percentual animado (`countUp`).
  Cores: upload `red`, conversão `yellow`, done `green`.
- `Home.vue`: apenas ajustes de layout (hero), sem tocar na lógica.

## Fase 4 — Validação

- `npm run lint` sem erros.
- `npm run build` compila.
- `npm run serve` e conferir visualmente os estados (idle, uploading, converting, done, error),
  mobile 390px e `prefers-reduced-motion`. Não commitar mocks.
