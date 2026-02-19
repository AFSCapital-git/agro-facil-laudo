

# AgroLaudo - Plataforma de Laudos Agronômicos

## Visão Geral
Plataforma tipo "Uber de laudos agronômicos" conectando produtores rurais a engenheiros agrônomos para emissão de laudos de viabilidade exigidos por bancos no Plano Safra.

---

## Fase 1 — Autenticação e Perfis de Usuário

- **Cadastro e login** com email/senha via Supabase Auth
- **3 papéis**: Produtor, Engenheiro e Admin (tabela separada de roles)
- **Cadastro do Produtor**: nome, CPF/CNPJ, telefone
- **Cadastro do Engenheiro**: CREA, área de atuação, raio de atendimento, dados bancários — status inicial "pendente"
- **Redirecionamento pós-login** conforme o papel do usuário (dashboard específico)

---

## Fase 2 — Cadastro de Propriedades (Produtor)

- Tela "Minhas Propriedades" com listagem e botão "Nova Propriedade"
- Formulário: nome, endereço, área total (ha), coordenadas GPS (opcional)
- Campo preparado para código CAR (futuro)

---

## Fase 3 — Solicitação de Laudo (Produtor)

- Tela "Nova Solicitação" com seleção de propriedade, tipo de crédito, valor, cultura principal, área de cultivo, banco destino e observações
- Criação do registro com status "aberta"
- Tela "Minhas Solicitações" com listagem, filtros por status e timeline visual do progresso
- Download do PDF quando laudo finalizado

---

## Fase 4 — Fluxo do Engenheiro

- **Lista de demandas disponíveis** (solicitações abertas) com detalhes e botão "Aceitar"
- Ao aceitar: cria o Laudo vinculado, status passa para "em_vistoria"
- **Checklist de vistoria guiado**: situação da cultura, tipo de solo, histórico de produtividade, disponibilidade hídrica, riscos, garantias, observações
- **Upload de fotos** vinculadas ao laudo (com campos preparados para geolocalização)
- Botão "Concluir Vistoria" → status "aguardando_assinatura"

---

## Fase 5 — Assinatura Digital e Geração de PDF

- Tela de revisão completa do laudo preenchido
- Checkbox de declaração + botão "Assinar digitalmente"
- Geração de hash simples (conteúdo + timestamp), registro de IP e data/hora
- Campo `tipo_assinatura` preparado para ICP-Brasil no futuro
- **Geração de PDF** padronizado com dados do produtor, propriedade, dados técnicos, parecer final, dados do engenheiro e hash da assinatura
- Status do laudo atualizado para "finalizado"

---

## Fase 6 — Pagamentos ao Engenheiro

- Criação automática de registro de pagamento pendente ao finalizar laudo
- Valor baseado nas configurações da plataforma
- Tela "Meus Pagamentos" para o engenheiro ver pendentes e pagos
- Admin marca pagamentos como "pago" manualmente (MVP)

---

## Fase 7 — Painel Admin

- **Dashboard** com métricas: nº produtores, engenheiros, laudos por status, valor pendente
- **Aprovação de engenheiros**: lista de pendentes com ações aprovar/reprovar
- **Configurações**: valor base por laudo, prazo padrão de pagamento
- **Gestão de pagamentos**: listagem com filtros e ação "Marcar como pago"

---

## Fase 8 — Relatórios

- **Admin**: laudos finalizados por período, valor total pendente, laudos por engenheiro (com exportação CSV)
- **Engenheiro**: laudos no mês, soma de valores pendentes e pagos
- **Produtor**: histórico de solicitações com data, propriedade, status e link do PDF

---

## Arquitetura Técnica

- **Backend**: Lovable Cloud (Supabase) para autenticação, banco de dados, storage (fotos/PDFs) e edge functions
- **Banco de dados**: todas as entidades descritas (User/Profiles, Produtor, Engenheiro, Propriedade, SolicitacaoLaudo, Laudo, MidiaLaudo, AssinaturaLaudo, PagamentoEngenheiro, ConfiguracoesPlataforma) com RLS policies por papel
- **Storage**: buckets para fotos de vistoria e PDFs de laudos
- **PDF**: geração via edge function
- **Campos "futuro"** mantidos na modelagem: score_risco, codigo_car, banco_destino, tipo_assinatura, percentual_taxa_plataforma

---

## Design e UX

- Interface limpa e funcional, otimizada para uso em campo (mobile-friendly)
- Cores que remetam ao agronegócio (tons de verde e terra)
- Navegação simples com sidebar por papel de usuário
- Formulários com validação clara e feedback visual de progresso

