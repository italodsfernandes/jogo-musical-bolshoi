# Auditoria do Projeto: MusiQuiz Piano Day

## Resumo executivo

O projeto está tecnicamente estável em build, lint e testes, mas hoje o placar não é confiável contra abuso. Os dois problemas centrais são: a resposta correta chega ao cliente em cada rodada e o backend aceita `score`, `studentName` e `sessionId` enviados pelo navegador sem revalidação. Na prática, isso permite ranking perfeito ou arbitrário com pouco esforço.

Além disso, a regra de bônus de velocidade não mede tempo real de decisão: ela mede o tempo reproduzido do áudio. Um jogador pode tocar, pausar quase imediatamente, pensar o quanto quiser e ainda manter bônus alto. Há também um bug funcional relevante: se o áudio falhar, a rodada pode travar sem opção de pular.

Do lado de Next.js, a base está razoavelmente alinhada com App Router e APIs assíncronas, mas há alguns ajustes claros de boas práticas: uso de `<img>` em vez de `next/image`, ausência de `error.tsx`/`loading.tsx` nos segmentos principais, duplicação de fetch de resultado em `generateMetadata` e na página, e uso de Route Handlers para mutações internas da UI onde Server Actions reduziriam superfície pública.

## Escopo e método

- Leitura da arquitetura `app/`, `components/`, `features/game/`, `lib/`
- Revisão guiada por `security-best-practices` e `next-best-practices`
- Validação local com:
  - `npm test` -> 42 testes aprovados
  - `npm run lint` -> sem erros
  - `npm run build` -> build de produção concluído

## Achados

### Crítico

#### AUD-001: A resposta correta é entregue ao cliente em cada rodada

- Severidade: Crítica
- Local:
  - `src/features/game/rounds.ts:288-292`
  - `src/components/game-arena.tsx:398-399`
- Evidência:
  - `createRoundData()` inclui `answerKey` no payload da rodada.
  - O cliente compara `selectedOption.optionId === currentQuestion.answerKey`.
- Impacto:
  - Qualquer pessoa com DevTools ou script pode ler a opção correta antes de responder.
  - O jogo pode ser zerado com pontuação máxima sem ouvir nenhum trecho.
- Correção recomendada:
  - Não envie `answerKey` ao cliente.
  - Envie apenas `roundId`, `audioToken` e opções.
  - Valide a resposta no servidor com base em um token/estado assinado da rodada.
- Mitigação simples:
  - Assine um `roundToken` contendo `questionId`, `currentRound`, `sessionId` e expiração curta.
  - No submit da resposta, o servidor calcula se estava correta e retorna o breakdown.

#### AUD-002: O backend aceita placar, nome e sessão vindos do cliente sem prova de integridade

- Severidade: Crítica
- Local:
  - `src/app/api/results/route.ts:13-19`
  - `src/app/api/results/route.ts:50-58`
  - `src/lib/firebase.ts:117-190`
  - `src/components/game-arena.tsx:283-295`
- Evidência:
  - `/api/results` recebe `registration`, `studentName`, `playerType`, `score` e `sessionId`.
  - O backend persiste esses campos sem recomputar pontuação nem conferir se `studentName` bate com a matrícula.
- Impacto:
  - É possível enviar `999999` pontos, nome falso, score negativo, ou sobrescrever um `sessionId` escolhido pelo atacante.
  - O ranking deixa de representar partidas reais.
- Correção recomendada:
  - O servidor deve ser a fonte da verdade do score final.
  - Persistir apenas resultados derivados de uma sessão assinada pelo servidor.
  - Para aluno, sobrescrever `studentName` com o nome da base oficial.
  - Rejeitar score fora do intervalo teórico `0..10700`.
- Mitigação simples:
  - Gerar `sessionToken` assinado no início do jogo.
  - Em cada resposta, o servidor valida e acumula score.
  - No fim, o cliente apenas pede `finalize(sessionToken)`.

### Alta

#### AUD-003: O bônus de velocidade pode ser burlado pausando o áudio

- Severidade: Alta
- Local:
  - `src/components/game-arena.tsx:398-402`
  - `src/components/game-arena.tsx:639-643`
  - `src/features/game/use-howler-player.ts:84-87`
  - `src/features/game/use-howler-player.ts:110-117`
- Evidência:
  - O breakdown usa `elapsedMs: player.currentTimeMs`.
  - `currentTimeMs` acompanha `seek()` do áudio, não o relógio real da rodada.
  - As opções ficam habilitadas quando `player.hasStarted` é `true`, mesmo com o áudio pausado.
- Impacto:
  - O jogador pode tocar uma vez, pausar quase no início, pensar sem pressão e responder com bônus alto.
  - A regra implementada diverge da percepção natural de “tempo para responder”.
- Correção recomendada:
  - Medir `elapsedMs` com `performance.now()` desde o primeiro play da rodada.
  - Se quiser manter penalidade por replay, continue zerando o bônus quando `playCount > 1`.
- Mitigação simples:
  - Guardar `roundStartedAt` no cliente e, idealmente, também no token assinado da rodada.

#### AUD-004: Falha de áudio pode travar a rodada sem saída

- Severidade: Alta
- Local:
  - `src/features/game/use-howler-player.ts:124-131`
  - `src/components/game-arena.tsx:569-580`
  - `src/components/game-arena.tsx:640-643`
  - `src/components/game-arena.tsx:669-674`
- Evidência:
  - Em `loaderror`, `isReady` vira `false` e `hasLoadError` vira `true`.
  - O botão de tocar fica inutilizável quando `canToggleAudio` é `false`.
  - As respostas exigem `player.hasStarted`, que nunca acontecerá nesse cenário.
- Impacto:
  - Basta um MP3 indisponível para o jogador ficar preso e perder a partida.
- Correção recomendada:
  - Expor um botão de “pular rodada” ou “tentar novamente”.
  - Em fallback, avançar a rodada com score zero após erro de carregamento.

### Média

#### AUD-005: A API de matrícula permite enumeração de alunos ativos

- Severidade: Média
- Local:
  - `src/app/api/students/[registration]/route.ts:11-23`
- Evidência:
  - A rota retorna `found`, `registration` e `name` para qualquer matrícula válida.
- Impacto:
  - Um script pode varrer matrículas e montar a lista de alunos ativos.
  - Isso também facilita impersonação quando combinado com o achado `AUD-002`.
- Correção recomendada:
  - Retornar apenas confirmação mínima no fluxo público.
  - Considerar PIN curto temporário, QR por aluno ou validação presencial para eventos.

#### AUD-006: Visitantes podem criar identidades infinitas e poluir o ranking

- Severidade: Média
- Local:
  - `src/components/start-experience.tsx:187-209`
  - `src/app/api/results/route.ts:40-47`
- Evidência:
  - O identificador do visitante nasce no `localStorage`.
  - O backend só exige prefixo `visitor-`.
- Impacto:
  - Limpar storage, trocar nome ou forjar chamadas permite ocupar o ranking com múltiplos aliases.
- Correção recomendada:
  - Emitir identificador de visitante no servidor.
  - Aplicar limite por IP/device fingerprint leve ou por janela de tempo do evento.

#### AUD-007: Os áudios “protegidos” continuam sendo estudáveis fora do fluxo do jogo

- Severidade: Média
- Local:
  - `src/features/game/questions.ts:3-63`
  - `src/app/api/game/audio/[token]/route.ts:96-110`
- Evidência:
  - O token de áudio protege só o caminho, mas os arquivos continuam em `public/audio`.
  - Os nomes dos MP3s são previsíveis e os caminhos reais existem no código.
- Impacto:
  - Um jogador pode baixar o acervo, treinar offline e chegar já sabendo todas as respostas.
- Correção recomendada:
  - Se os trechos precisarem ficar menos expostos, mova-os para storage privado e sirva via rota autenticada/assinada com expiração.
- Observação:
  - Isso não substitui o conserto de `AUD-001`; hoje o gabarito já chega ao cliente.

#### AUD-008: Não há proteção visível contra automação e spam nas rotas públicas

- Severidade: Média
- Local:
  - `src/app/api/game/route.ts:8-54`
  - `src/app/api/results/route.ts:11-72`
  - `src/app/api/students/[registration]/route.ts:11-24`
- Evidência:
  - As rotas públicas não aplicam rate limit, anti-bot, nonce, checagem de origem ou janela temporal.
- Impacto:
  - Facilidade para brute force de matrícula, flood de resultados e coleta automatizada de dados.
- Correção recomendada:
  - Rate limit por IP e por fingerprint leve.
  - Rejeição de burst anômalo em `/api/results`.
  - Cache curto e limitação de lookup em `/api/students`.

#### AUD-009: Cabeçalhos de segurança e CSP não estão visíveis no código do app

- Severidade: Média
- Local:
  - `next.config.ts:1-14`
- Evidência:
  - A configuração exposta só define `images.remotePatterns`.
  - Não há `proxy.ts`, `headers()` globais ou política CSP visível no repositório.
- Impacto:
  - Sem confirmação de CSP, `frame-ancestors`, `nosniff` e políticas equivalentes, a defesa em profundidade fica fraca.
- Correção recomendada:
  - Verificar se isso já é imposto no edge/CDN.
  - Se não for, adicionar cabeçalhos mínimos no app ou proxy.
- Nota de falso positivo:
  - Pode já existir configuração fora do repositório; validar em runtime.

### Baixa

#### AUD-010: Preview do card usa `<img>` em vez de `next/image`

- Severidade: Baixa
- Local:
  - `src/components/result-og-preview.tsx:53-63`
- Impacto:
  - Perde otimizações de imagem, comportamento consistente e alinhamento com boas práticas do Next.
- Correção recomendada:
  - Migrar para `next/image` com dimensões e `sizes`.

#### AUD-011: O resultado é buscado duas vezes na mesma rota

- Severidade: Baixa
- Local:
  - `src/app/resultado/[sessionId]/page.tsx:22-26`
  - `src/app/resultado/[sessionId]/page.tsx:43-45`
- Impacto:
  - Duplica leitura no Firebase para metadata e página.
- Correção recomendada:
  - Encapsular `getResultSnapshot` em `cache()` para reaproveitar o fetch entre `generateMetadata` e a page.

#### AUD-012: Faltam `loading.tsx`/`error.tsx` nos segmentos críticos

- Severidade: Baixa
- Local:
  - Estrutura `src/app/` atual
- Impacto:
  - Em falhas reais de rede/DB, a UX depende de `catch(() => [])` ou telas vazias, em vez de boundaries idiomáticas do App Router.
- Correção recomendada:
  - Adicionar ao menos `src/app/ranking/error.tsx`, `src/app/resultado/[sessionId]/error.tsx` e `loading.tsx` correspondentes.

#### AUD-013: Mutações internas da UI estão expostas como APIs públicas

- Severidade: Baixa
- Local:
  - `src/app/api/game/route.ts:8-54`
  - `src/app/api/results/route.ts:11-72`
- Impacto:
  - Aumenta a superfície pública sem necessidade, já que o fluxo é exclusivamente da própria interface.
- Correção recomendada:
  - Migrar para Server Actions nas mutações internas quando fizer sentido.

#### AUD-014: O jogador ganha bônus de streak na 1ª resposta correta, mas a UI só comunica combo a partir de `x2`

- Severidade: Baixa
- Local:
  - `src/features/game/scoring.ts:64-72`
  - `src/components/game-arena.tsx:617-626`
- Impacto:
  - A regra existe, mas a percepção do jogador fica inconsistente.
- Correção recomendada:
  - Exibir claramente o breakdown da rodada, incluindo `+100 sequência` já na primeira correta.

## Cenários de cheat/hack hoje

1. Ler a resposta certa pelo payload da rodada e responder sem escutar.
2. Chamar `/api/results` manualmente com score arbitrário.
3. Pausar o áudio no início, pensar à vontade e responder com bônus alto.
4. Criar vários visitantes limpando `localStorage` ou forjando `visitor-*`.
5. Enumerar matrículas válidas via `/api/students/[registration]`.
6. Forjar nome de aluno/visitante para aparecer no ranking com texto indevido.

## Contornos simples e eficazes

### Prioridade 1

1. Tirar `answerKey` do cliente.
2. Validar cada resposta no servidor.
3. Fazer o servidor calcular o score final.

### Prioridade 2

1. Medir tempo por relógio real da rodada, não por `seek()` do áudio.
2. Sobrescrever `studentName` no servidor a partir da matrícula oficial.
3. Rejeitar score fora de `0..10700`.
4. Emitir `visitorId` no servidor.

### Prioridade 3

1. Adicionar rate limit leve em `/api/students`, `/api/game` e `/api/results`.
2. Criar fallback de “pular rodada” quando o áudio falhar.
3. Moderar nome de visitante com limite de tamanho e filtro básico de caracteres.

## Avaliação da dinâmica do jogo

### O que já funciona bem

- O jogo é curto e objetivo.
- O card final compartilhável ajuda retenção social.
- O ranking separado entre geral e alunos é bom para contexto de evento.
- O visual e a tematização estão consistentes.

### O que enfraquece a dinâmica hoje

1. A pressão de tempo é ilusória porque o relógio real não governa a resposta.
2. Não existe plano B para rodada com erro de áudio.
3. A progressão é plana: 10 perguntas, mesma estrutura, pouca escalada dramática.
4. O combo é pouco explicado ao jogador.
5. Visitantes podem “farmar” o ranking global com identidades descartáveis.

### Melhorias de dinâmica recomendadas

1. Adotar tempo real por rodada com barra regressiva visível.
2. Exibir breakdown completo após cada resposta: base, velocidade, streak.
3. Variar dificuldade nas últimas 3 rodadas para criar clímax.
4. Criar um “seguro” de UX para erro de áudio: pular sem penalizar ou repetir rodada.
5. Incluir microfeedback educativo no reveal, por exemplo “Você ouviu Ravel - Boléro”.
6. Considerar ranking “do dia/evento” e “melhor pessoal” separados para reduzir frustração.

## Pontos positivos de implementação

- Uso correto de `params`/`searchParams` assíncronos no App Router.
- `next/font` já está aplicado no layout.
- OG image usa `next/og` com runtime Node, o que está alinhado com a recomendação do Next.
- O token cifrado de cursor evita adulteração trivial da ordem das perguntas, embora ainda não proteja o placar.

## Próximo passo recomendado

Se for para atacar com o melhor custo/benefício, a ordem ideal é:

1. Corrigir confiança no placar (`AUD-001` e `AUD-002`).
2. Corrigir o exploit de pausa (`AUD-003`).
3. Adicionar fallback para erro de áudio (`AUD-004`).
4. Fechar abuso de visitantes e enumeração (`AUD-005` e `AUD-006`).
