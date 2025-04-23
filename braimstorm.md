# Brainstorming: Atualização de Dados de Séries em Andamento

## Problema

A aplicação armazena informações sobre séries e temporadas obtidas da API TMDB. Atualmente, quando um usuário solicita detalhes de uma temporada que nunca foi buscada antes, os dados são obtidos da API TMDB e armazenados no banco de dados. No entanto, esses dados nunca são atualizados posteriormente, o que causa problemas para:

- Temporadas em andamento que ainda estão lançando episódios
- Episódios futuros que ainda não têm todas as informações disponíveis (duração, sinopse, data exata de lançamento)
- Alterações e correções nas informações dos episódios (títulos, sinopses, etc.)

## Possíveis Soluções

### Solução 1: Atualização Periódica Automática

- **Implementação**: 
  - Criar um serviço de background usando uma biblioteca como `node-cron` ou `bull` para execução de jobs
  - Implementar lógica para identificar temporadas em andamento (usando o status da série ou a data do último episódio)
  - Agendar verificações periódicas para cada temporada em andamento
  - Definir frequências diferentes baseadas na programação da série (semanal, diária, etc.)

- **Prós**: 
  - Mantem os dados sempre atualizados sem depender de interações do usuário
  - Permite agendamento inteligente baseado na programação de lançamento da série
  - Fornece dados consistentes para todos os usuários

- **Contras**: 
  - Pode gerar muitas requisições à API TMDB, potencialmente atingindo limites de uso
  - Requer recursos de servidor adicionais para executar jobs em background
  - Complexidade adicional na infraestrutura

### Solução 2: Atualização sob Demanda com Cache Inteligente

- **Implementação**: 
  - Adicionar campo `lastUpdated` ao modelo Season
  - Implementar lógica que verifica a "idade" dos dados antes de retorná-los
  - Definir tempo de validade do cache baseado no status da temporada:
    - Temporadas concluídas: cache longo (meses ou permanente)
    - Temporadas em andamento: cache curto (dias ou horas)
    - Temporadas aguardando estreia: cache médio (semanas)

- **Prós**: 
  - Reduz o número de requisições à API TMDB ao atualizar apenas quando necessário
  - Evita atualizações desnecessárias para temporadas concluídas
  - Não requer infraestrutura adicional complexa

- **Contras**: 
  - Pode resultar em algumas inconsistências temporárias entre atualizações
  - O primeiro usuário a acessar dados "expirados" terá uma experiência mais lenta
  - Requer lógica adicional para determinar a idade ideal do cache

### Solução 3: Sistema de Flag para Temporadas Ativas

- **Implementação**: 
  - Adicionar uma flag `isOngoing` ao modelo Season
  - Atualizar essa flag baseada em informações da série ou na data prevista do último episódio
  - Modificar o método `getEpisodesBySeasonNumber` para sempre verificar atualizações quando `isOngoing` for true
  - Implementar lógica para atualizar a flag quando todos os episódios forem lançados

- **Prós**: 
  - Fácil de implementar e mantém atualizadas apenas as temporadas relevantes
  - Abordagem seletiva que economiza recursos
  - Simples de entender e manter

- **Contras**: 
  - Requer lógica adicional para determinar quando uma temporada não está mais em andamento
  - Pode ser difícil definir precisamente quando uma temporada está "completa"
  - Não resolve automaticamente o problema de temporadas futuras

### Solução 4: Abordagem Híbrida com Atualização Baseada em Eventos

- **Implementação**: 
  - Combinar elementos das soluções anteriores
  - Classificar temporadas em diferentes estados: `COMPLETED`, `ONGOING`, `UPCOMING`
  - Implementar um sistema de atualização multi-camada:
    1. Cache inteligente com diferentes TTLs (Time To Live) baseados no estado
    2. Job agendado semanal para verificar mudanças de estado
    3. Atualização sob demanda para usuários ativos
  - Adicionar um mecanismo de "subscription" onde usuários podem optar por receber notificações sobre atualizações em séries específicas

- **Prós**: 
  - Oferece a flexibilidade de todas as abordagens anteriores
  - Otimiza recursos equilibrando atualizações automáticas e sob demanda
  - Proporciona uma experiência mais rica ao usuário com notificações

- **Contras**: 
  - Maior complexidade de implementação
  - Requer mais lógica para gerenciar os diferentes estados e transições
  - Pode ser mais difícil de testar completamente

## Implementação Detalhada: Cache Inteligente com TTLs Variáveis

### Conceito e Funcionamento

O conceito de TTL (Time To Live) define por quanto tempo os dados permanecem válidos antes de precisarem ser atualizados. Em um sistema de cache inteligente com TTLs variáveis:

1. **Classificação por Estados**: As temporadas são classificadas em estados diferentes que determinam sua política de cache:
   - `COMPLETED`: Temporadas finalizadas
   - `ONGOING`: Temporadas em andamento que estão lançando episódios atualmente
   - `UPCOMING`: Temporadas anunciadas mas que ainda não começaram
   - `SPECIAL_INTEREST`: (Opcional) Temporadas com alta taxa de acesso ou de séries populares

2. **Estratégias de Atualização**:
   - `aggressive`: Atualiza proativamente via jobs agendados e também quando acessado após expiração do TTL
   - `passive`: Atualiza apenas quando acessado após o TTL expirar
   - `on_access`: Atualiza cada vez que é acessado após um período mínimo (para séries muito populares)

## Benefícios Adicionais desta Abordagem

1. **Otimização de Recursos**:
   - Atualiza apenas quando necessário baseado na popularidade e estado da temporada
   - Evita sobrecarga do servidor e da API TMDB

2. **Experiência do Usuário Aprimorada**:
   - Temporadas populares são atualizadas com mais frequência
   - Respostas rápidas, mesmo para o primeiro usuário a acessar dados "expirados"

3. **Adaptação Inteligente**:
   - O sistema se adapta automaticamente aos padrões de uso
   - Temporadas que recebem mais acessos são priorizadas

4. **Manutenção e Escalabilidade**:
   - Fácil ajuste de políticas de cache sem modificar o código principal
   - Escalável para lidar com grandes volumes de dados e usuários

## Gerenciamento de Limites da API TMDB

Um aspecto importante a considerar é como gerenciar os limites de requisições da API TMDB. Algumas estratégias a considerar:

1. **Implementação de Rate Limiting**:
   - Criar um serviço que centraliza todas as chamadas à API TMDB
   - Implementar filas para requisições usando bibliotecas como `bottleneck` ou `p-limit`
   - Rastrear o número de chamadas por período para evitar atingir limites

2. **Otimização de Requisições**:
   - Agrupar atualizações em lotes (batch updates)
   - Priorizar atualizações de temporadas mais populares ou recentes
   - Usar dados de telemetria para identificar quais temporadas são mais acessadas

3. **Caching de Respostas da API**:
   - Implementar um sistema de cache para as respostas da API TMDB
   - Usar Redis ou outra solução de cache em memória para armazenar temporariamente respostas frequentes
   - Definir políticas de expiração de cache baseadas na frequência de mudanças dos dados

4. **Fallback para Fontes Alternativas**:
   - Implementar integração com APIs alternativas como TV Maze ou IMDB
   - Criar um sistema que possa alternar entre diferentes fontes em caso de falhas ou limites atingidos

## Sistema de Notificações para Usuários

Podemos melhorar a experiência do usuário implementando um sistema de notificações para atualizar os usuários sobre novos episódios ou correções de informações:

1. **Notificações In-App**:
   - Adicionar um sistema de notificações dentro da aplicação
   - Permitir que usuários "sigam" séries específicas
   - Enviar notificações quando novos episódios forem adicionados ou informações significativas forem atualizadas

2. **Notificações por Email**:
   - Implementar um sistema de notificações por email para atualizações de séries
   - Permitir que usuários configurem a frequência de notificações (diária, semanal, etc.)
   - Incluir resumos de atividades recentes nas séries que o usuário segue

3. **Integração com Webhooks**:
   - Permitir que desenvolvedores criem webhooks para receber atualizações em tempo real
   - Facilitar a integração com outras plataformas e serviços

### Sistemas de Monitoramento

Implementar métricas de monitoramento para acompanhar:

- Número de atualizações por período
- Taxa de sucesso/falha de atualizações
- Tempo médio entre atualizações
- Uso da API TMDB (requisições, limites)

## Próximos Passos

- Avaliar qual solução melhor se alinha com os requisitos do projeto
- Considerar o impacto de cada solução no desempenho e nos limites da API
- Definir critérios claros para quando e como os dados devem ser atualizados
- Implementar mecanismos de fallback caso a API TMDB esteja indisponível
- Conduzir testes de desempenho para verificar o impacto das diferentes abordagens 