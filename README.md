# MusiQuiz Piano Day

Experiência em `Next.js` para o Piano Day da Escola Bolshoi, com entrada por matrícula, quiz musical com áudio local, ranking em `Firebase Realtime Database` e card final compartilhável.

## Stack

- Next.js 16 + App Router
- React 19
- Tailwind CSS + primitives estilo shadcn/ui
- Framer Motion
- Howler.js
- Firebase Realtime Database
- Vitest

## Fluxos principais

- Entrada via matrícula validada contra `src/data/students.json`
- Confirmação do nome antes de entrar no jogo
- Limite de 3 partidas por matrícula
- Rodadas com score `500 + velocidade + combo`
- Melhor score salvo por matrícula
- Ranking único apenas para alunos
- Página pública de resultado por sessão
- Card social gerado em `/resultado/[sessionId]/opengraph-image`

## Cálculo de pontuação

Cada rodada vale até **1.100 pontos**, distribuídos em três componentes:

| Componente | Valor |
|---|---|
| Acerto base | 500 pts |
| Bônus de velocidade | 0 – 300 pts |
| Bônus de sequência (streak) | 0 – 300 pts |

**Bônus de velocidade:** começa em 300 e cai 10 pts por segundo decorrido. Chega a zero após 30 s. É zerado se o jogador ouviu o áudio mais de uma vez.

**Bônus de sequência:**

| Acertos consecutivos | Bônus |
|---|---|
| 1ª acertada | +100 pts |
| 2ª acertada | +200 pts |
| 3ª em diante | +300 pts |

**Pontuação máxima teórica:** 10 questões respondidas instantaneamente, sem replay, com sequência completa = **10.700 pts**
_(Q1: 900 + Q2: 1.000 + Q3–Q10: 1.100 × 8)_

**Títulos:**

| Pontuação | Título |
|---|---|
| ≥ 10.000 | Estrela do Piano Day |
| ≥ 8.000 | Virtuose em Ascensão |
| ≥ 5.000 | Destaque Musical |
| < 5.000 | Aprendiz das Teclas |

## Scripts

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

## Base de alunos

- Fonte atual: `src/data/students.json`

## Áudios locais

- Os arquivos ficam em `public/audio`
- Para produção, substitua esses MP3s pelos trechos finais licenciados do evento mantendo os mesmos nomes de arquivo definidos em `src/features/game/questions.ts`

## Variáveis de ambiente

O projeto usa `FIREBASE_DATABASE_URL` como configuração oficial do banco.
Se quiser separar o ranking por edição do evento, defina também
`FIREBASE_SCORE_NAMESPACE`. Exemplo: `scores202603`.

Exemplo mínimo:

```bash
FIREBASE_DATABASE_URL=
FIREBASE_SCORE_NAMESPACE=scores202603
```

Para este projeto, o banco atual está autorizado no namespace legado
`scores202503`. Em ambiente local, use `FIREBASE_SCORE_NAMESPACE=scores202503`.

## Estrutura

```text
src/
  app/                    # rotas, API routes e OG image
  components/             # componentes cliente e UI
  data/                   # base local de matriculas
  features/game/          # regras do jogo, score e player
  lib/                    # integracoes e utilitarios servidor/cliente
public/audio/             # trechos MP3 locais
scripts/                  # importacao de alunos
```
