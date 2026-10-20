### Visão Geral

A versão 1.2.0 adiciona o módulo de gestão de escala de funcionários e o cadastro de colaboradores. O banco de dados interno foi atualizado para a versão 3.

---

### Geral

#### Novos Recursos

- Nova tela de montagem, visualização, edição e salvamento de escalas de funcionários.
- Nova tela de cadastro, edição e exclusão de colaboradores.
- Menu lateral atualizado em todas as telas, com acesso direto aos novos módulos.
- Possibilidade de incluir na escala tanto funcionários já cadastrados quanto entradas avulsas.
- Geração de imagem da escala montada para compartilhamento.
- Limites operacionais: período máximo de 14 dias e até 100 funcionários por escala.

#### Correções

- Feedback visual mais claro na visualização quando a escala está vazia, com atalho para adicionar funcionário.
- Ajustes de contraste e estados de navegação em várias telas.
- Sincronização automática dos dias da escala quando o período de datas é alterado.

---

### Persistência

#### Novos Recursos

- Nova tabela de funcionários no banco local, com armazenamento de crachá, nome e cargo.
- Operações de inclusão (com substituição em caso de crachá existente), listagem ordenada por nome, exclusão e busca por crachá.
- Bridge nativa estendida para permitir que as telas web interajam com o cadastro de funcionários.
- Fallback para armazenamento local no navegador quando o ambiente nativo não está disponível (útil em desenvolvimento).

#### Observações

- Escalas salvas localmente no navegador não são migradas automaticamente para o banco nativo.
- Instalações anteriores precisam do upgrade do banco para a versão 3 para utilizar o cadastro de funcionários.

---

### Escala de Funcionários

#### Novos Recursos

- Definição de período com validação (data final igual ou posterior à inicial e limite de 14 dias).
- Três tipos de dia por funcionário:
  - **Normal** — horário padrão de trabalho.
  - **Folga** — dia sem expediente.
  - **Intermediário** — horário diferenciado configurável por dia, com destaque visual.
- Fluxo de montagem em etapas:
  1. Seleção do período.
  2. Inclusão de funcionários cadastrados ou avulsos.
  3. Edição de horários, tipos de dia e remoção de pessoas na visualização.
  4. Salvamento da escala completa com metadados do período.
- Confirmação obrigatória para ações destrutivas (remoção de funcionário ou limpeza da escala).
- Geração de imagem pronta para compartilhamento.
- Ajuste automático dos dias quando o período é modificado: dias fora do intervalo são removidos e dias novos recebem o horário padrão.

#### Correções

- Botão de adicionar funcionário disponível diretamente na visualização quando a escala está vazia.
- Lógica de abertura do modal de inclusão unificada e reutilizada.

---

### Cadastro de Funcionários

#### Novos Recursos

- Cadastro completo com validação de campos obrigatórios (crachá, nome e cargo).
- Crachá utilizado como identificador único e imutável na edição.
- Prevenção de crachás duplicados na inclusão.
- Listagem ordenada alfabeticamente por nome.
- Confirmação antes da exclusão.
- Interface com formulário de criação/edição e lista de colaboradores.

---

### Interface

#### Novos Recursos

- Layout responsivo para cards de funcionários e grade de horários.
- Adaptação automática para tablets e telas estreitas.
- Identificação visual clara dos tipos de dia (normal, folga e intermediário).
- Destaque visual para configuração de horários intermediários.
- Estados ativos do menu lateral atualizados em todas as telas.

#### Correções

- Melhoria de legibilidade de textos secundários e contraste nos itens de menu.
- Informações de versão e build na tela Sobre com valores padrão adequados quando o ambiente nativo não fornece dados.

---

### Compatibilidade

- Nenhum método público anterior da bridge de divergências foi removido.
- O schema da tabela de divergências permanece compatível; apenas a versão do banco foi incrementada.
- Aplicativos ou ferramentas que leem diretamente o banco local devem considerar a presença da tabela de funcionários a partir desta versão.

---

### Observações para desenvolvedores e usuários avançados

- Valores monetários de divergências continuam sendo tratados em centavos para evitar imprecisões.
- O objeto de integração nativa só está disponível dentro do WebView do aplicativo. Testes no navegador utilizam armazenamento local.
- Alterações nos limites de dias ou de funcionários exigem revisão da validação de período e da renderização dos cards.
- A geração de imagem depende do conteúdo visual atual dos cards; mudanças de layout podem afetar o resultado do compartilhamento.

---

**Build / versão**  
Versão: 1.2.0  
Banco de dados: versão 3