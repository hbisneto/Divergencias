### Visão Geral

A versão 1.3.0 apresenta importantes melhorias de funcionalidade e usabilidade, com destaque para a implementação de um novo sistema de lembretes com notificações programadas, permitindo configurar dias e horários para receber avisos sobre o registro das divergências.

Além disso, a navegação do aplicativo foi aprimorada com a centralização dinâmica do menu lateral, enquanto a tela de escala de funcionários recebeu novos recursos de organização e interação. Também foram realizados ajustes na interface, melhorias na manutenção do código e correções de funcionamento.

### Novidades

#### 🔔 Sistema de lembretes e notificações

- Implementado um novo sistema de lembretes para auxiliar no registro diário das divergências.
- Adicionada uma nova seção **Lembrete** nas configurações do aplicativo.
- Permite ativar ou desativar os lembretes individualmente.
- Adicionada a possibilidade de personalizar o horário de recebimento das notificações.
- Implementada a seleção dos dias da semana em que os lembretes serão executados.
- As preferências do lembrete são armazenadas localmente no dispositivo.
- Implementado um sistema de agendamento automático das próximas notificações.
- Adicionado suporte à recuperação do agendamento após a reinicialização do dispositivo.
- Implementado suporte às permissões de notificações do Android 13 e versões posteriores.

As notificações apresentam um aviso para lembrar o usuário de registrar as divergências do dia e permitem abrir diretamente o aplicativo ao serem selecionadas.

---

### Melhorias

#### 🧭 Navegação e menu lateral dinâmico

- Refatorada a implementação da barra de navegação e do menu lateral.
- Criado o módulo `navbar.js` para centralizar a estrutura e o gerenciamento dos elementos de navegação.
- Removida a necessidade de manter cópias individuais do HTML da barra de navegação em cada página.
- Implementada a injeção dinâmica do menu lateral nas páginas do aplicativo.
- Adicionado reconhecimento automático da página atual.
- O item correspondente à página aberta passa a ser destacado automaticamente no menu.
- Reduzida a duplicação de código, facilitando futuras alterações e a manutenção da interface.

#### 👥 Aprimoramentos na escala de funcionários

- Implementada a possibilidade de expandir e recolher os cartões de funcionários.
- Adicionado um cabeçalho interativo para controlar a exibição das informações de cada funcionário.
- Implementado um indicador visual com animação para representar o estado de expansão do cartão.
- Melhorada a organização das informações, permitindo visualizar os funcionários de maneira mais compacta.
- Aprimorada a interação entre os cartões e seus respectivos controles.
- Corrigido o comportamento dos botões de interação e remoção para evitar que suas ações acionem indevidamente a expansão ou o recolhimento dos cartões.

#### ⚙️ Configurações aprimoradas

- Adicionadas descrições explicativas para facilitar a compreensão das opções de personalização visual.
- Atualizada a apresentação das configurações de aparência.
- Integradas as preferências de lembrete ao processo de salvamento das configurações.
- Aprimorada a restauração das configurações padrão, incluindo a desativação e o cancelamento dos lembretes.

#### 🖥️ Melhorias na experiência de uso

- Aprimorada a organização visual do menu lateral.
- Melhorada a identificação da página atualmente selecionada.
- Introduzidas interações mais intuitivas na tela de escala.
- Refinados os indicadores visuais dos componentes expansíveis.
- Melhorada a organização do código JavaScript, reduzindo redundâncias entre as páginas.

#### 🛠️ Correções e ajustes técnicos

- Corrigidas referências a arquivos JavaScript em páginas específicas.
- Ajustada a integração entre os módulos de navegação e as páginas do aplicativo.
- Aprimorada a comunicação entre a interface WebView e os componentes nativos Android responsáveis pelo gerenciamento dos lembretes.
- Adicionado suporte ao gerenciamento de tarefas agendadas por meio do WorkManager.
- Realizados ajustes gerais de consistência e manutenção do código.

---

**Build / versão**

Versão: 1.3.0  
Banco de dados: versão 3