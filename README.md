# Divergências

Aplicativo Android para cálculo e registro de divergências de valores entre preço original e preço promocional, com histórico local e contagem de cédulas e moedas.

**Desenvolvedor:** Heitor Bisneto (Bisneto Inc.)  
**Versão:** 1.0  
**Plataforma:** Android (minSdk 24)

## Funcionalidades

- **Calcular divergência** — informa valor unitário original, quantidade e valor promocional unitário e obtém a diferença total
- **Histórico** — salva, edita e exclui registros localmente (SQLite)
- **Contagem de notas** — conta cédulas e moedas e mostra o total em tempo real
- **Sobre** — informações do aplicativo (versão, atualização, desenvolvedor)

## Tecnologias

| Camada        | Tecnologia                                      |
|---------------|-------------------------------------------------|
| UI            | HTML, CSS, Bootstrap 5, JavaScript              |
| Host          | Android WebView                                 |
| Nativo        | Kotlin                                          |
| Persistência  | SQLite (`DatabaseHelper` + `JavascriptInterface`) |
| Idioma        | Português (Brasil)                              |

## Estrutura do projeto

```
app/src/main/
├── assets/
│   ├── css/
│   │   └── bootstrap.min.css
│   ├── js/
│   │   ├── app.js              # Lógica de divergências + histórico
│   │   ├── contagem.js         # Contagem de cédulas e moedas
│   │   ├── historico.js
│   │   └── bootstrap.bundle.min.js
│   ├── images/
│   ├── index.html              # Tela principal
│   ├── historico.html          # Histórico de registros
│   ├── notas.html              # Contagem de dinheiro
│   └── sobre.html              # Sobre o app
├── java/com/bisneto/divergencias/
│   ├── MainActivity.kt         # WebView + bridge
│   ├── DivergenciaBridge.kt    # Interface JS ↔ Kotlin
│   ├── DatabaseHelper.kt       # SQLite
│   └── Divergencia.kt          # Modelo de dados
└── AndroidManifest.xml
```

## Como compilar e instalar

### 1. Gerar o APK

```bash
./gradlew clean
./gradlew assembleDebug
```

O APK fica em:

```
app/build/outputs/apk/debug/app-debug.apk
```

### 2. Instalar no dispositivo

Com o dispositivo conectado (USB debugging ativo):

```bash
./gradlew installDebug
```

Ou com o ADB local do projeto:

```bash
./platform-tools/adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## Interface nativa (`Android`)

O JavaScript das páginas HTML chama os métodos expostos por `DivergenciaBridge`:

| Método              | Descrição                                      |
|---------------------|------------------------------------------------|
| `salvar(...)`       | Insere uma divergência e retorna o ID          |
| `listar()`          | Retorna JSON com todos os registros            |
| `atualizar(...)`    | Atualiza um registro existente                 |
| `excluir(id)`       | Remove o registro pelo ID                      |

Valores monetários são tratados em **centavos** (inteiros) para evitar erros de ponto flutuante.

## Banco de dados

- Arquivo: `divergencias.db`
- Tabela: `divergencias`
  - `id`, `valor_original`, `quantidade`, `valor_promocional`, `divergencia`, `data_hora`

## Páginas

| Arquivo          | Descrição                                         |
|------------------|---------------------------------------------------|
| `index.html`     | Formulário de cálculo + histórico na mesma tela   |
| `historico.html` | Lista de divergências registradas                 |
| `notas.html`     | Contagem de cédulas (R$ 100 a R$ 2) e moedas      |
| `sobre.html`     | Nome, versão, data de atualização e descrição     |

## Observações

- O objeto `Android` só existe dentro do WebView do app. No navegador ele não está definido.
- A pasta `.gradle/`, `build/` e `local.properties` **não** devem ser versionadas (já estão no `.gitignore`).
- `local.properties` contém o caminho do SDK da máquina local e não deve ir para o repositório.

## Licença

© 2026 Bisneto Inc. Todos os direitos reservados.