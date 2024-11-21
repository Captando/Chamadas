# Sistema de Gerenciamento de Presenças (Whitelabel)

Este é um sistema whitelabel desenvolvido para gerenciar aulas, registros de presença e geração de relatórios. Ele utiliza **Node.js**, **Express**, **Supabase** e integração com **Google Sheets** através do **N8n**. É possível configurar sua própria identidade substituindo os placeholders `sua_empresa` nos arquivos `index.html` e `admin.html`.

## Funcionalidades

- **Registro de Presença**: Alunos podem registrar presença em aulas específicas.
- **Gerenciamento de Aulas**: Cadastro, listagem, e exclusão de aulas.
- **Relatórios CSV**: Geração de relatórios CSV por aula, intervalo de aulas ou alunos registrados.
- **Listagem de Comentários**: Integração com o **Google Sheets** via N8n para listar comentários com o método GET.
- **Webhooks**: O sistema suporta o uso de webhooks para notificações e automações externas.
- **Whitelabel**: Personalização completa para uso sob sua própria marca.

## Tecnologias Utilizadas

- **Node.js** e **Express**: Para gerenciamento do backend e API.
- **Supabase**: Para armazenamento de dados de alunos, aulas e presenças.
- **Google Sheets** (via N8n): Para listar comentários de forma automatizada.
- **json2csv**: Para converter dados em arquivos CSV.
- **dotenv**: Para gerenciar variáveis de ambiente.

## Configuração

### Pré-requisitos

- Node.js (v14 ou superior)
- NPM ou Yarn
- Uma conta no Supabase
- Configuração do N8n para integração com o Google Sheets

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

- PORT=3000
- SUPABASE_URL=<sua-url-do-supabase>
- SUPABASE_KEY=<sua-chave-do-supabase> 
- WEBHOOK_URL=<sua-url-do-webhook>


### Instalação

1. Clone este repositório:

2. Instale as dependências:

3. Configure as variáveis de ambiente no arquivo `.env`.

4. Execute o servidor:

O servidor estará disponível em: `http://localhost:3000`.

## Personalização Whitelabel

Substitua o placeholder `sua_empresa` nos arquivos `index.html` e `admin.html` localizados na pasta `public`. Isso permitirá personalizar a identidade visual do sistema para sua marca.

## Endpoints Principais

### Registro de Presença
- **POST /api/registrar-presenca**
Registra a presença de um aluno para uma aula específica.

### Listagem de Presenças
- **GET /api/presencas?email=<email_do_aluno>**
Lista todas as presenças de um aluno específico.

### Gerenciamento de Aulas
- **POST /api/aulas**
Cadastra uma nova aula.
- **GET /api/aulas**
Lista todas as aulas cadastradas.
- **DELETE /api/aulas/:id**
Remove uma aula pelo ID.

### Relatórios
- **GET /api/alunos/csv/:id**
Gera um CSV de alunos presentes em uma aula específica.
- **GET /api/alunos/csv**
Gera um CSV de todos os alunos registrados.

### Comentários (Google Sheets via N8n)
- **GET /api/comentarios**
Lista os comentários integrados ao Google Sheets.

## Integração com o N8n

O sistema utiliza o N8n para automatizar fluxos de trabalho, como:
- Integração com o Google Sheets para sincronização de comentários.
- Webhooks para disparar notificações.

Certifique-se de configurar os fluxos adequados no N8n antes de iniciar o sistema.
