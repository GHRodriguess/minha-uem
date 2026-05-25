# 🎓 Minha UEM (MU)

> O hub acadêmico definitivo e inteligente para estudantes da Universidade Estadual de Maringá (UEM). Sincronize seus horários, controle suas notas e faltas de forma preditiva e gerencie seus arquivos e avisos do Google Classroom em um único painel moderno e fluido.

---

## 🌟 Funcionalidades Principais

*   **⚡ Autenticação Institucional Exclusiva:** Login unificado e seguro com o Google Auth, restrito exclusivamente a e-mails com o domínio institucional `@uem.br`.
*   **📅 Importação Mágica de Horários:** Basta fazer o upload do PDF de horários oficial emitido pela UEM. O sistema utiliza extração automatizada de dados (`pdfplumber`) para detectar o ano letivo, as disciplinas, turmas, blocos, salas de aula e gerar a sua grade de horários completa de forma instantânea.
*   **📊 Controle Preditivo de Faltas:** Registre faltas por aula e acompanhe o percentual de frequência em tempo real. O sistema calcula a quantidade máxima de faltas permitidas em cada matéria antes da reprovação e emite alertas visuais intuitivos.
*   **📝 Gerenciador Completo de Notas e Médias:** Cadastre provas, trabalhos, exames e tarefas de cada ano letivo. Defina os pesos de cada avaliação, calcule sua média parcial e final automaticamente e compare-a com a média mínima desejada.
*   **📓 Bloco de Anotações por Matéria:** Mantenha um diário de estudos ou anotações rápidas vinculadas diretamente à disciplina correspondente.
*   **🔗 Integração Avançada com Google Classroom:**
    *   Vincule cada matéria cadastrada na UEM a um curso correspondente no Classroom.
    *   Acompanhe o mural de avisos diretamente pela plataforma e marque os posts lidos para manter o controle de novidades.
    *   Sincronize, baixe e organize em pastas locais os materiais didáticos disponibilizados no Drive de cada matéria.
    *   Abra arquivos salvos localmente diretamente da interface web da aplicação.
*   **📆 Sincronização com Calendários Externos (iCalendar):** Fornece um feed dinâmico e exclusivo em formato `.ics` para que você possa importar todas as suas aulas diretamente no Google Agenda, Apple Calendar ou Microsoft Outlook.

---

## 🛠️ Tecnologias e Arquitetura

O projeto é estruturado em uma arquitetura desacoplada moderna com um Monorepo contendo backend (API Rest) e frontend (Single Page Application):

### 💻 Backend (Django & DRF)
*   **Framework Principal:** Python 3.12+ / [Django 6.0](https://www.djangoproject.com/)
*   **API Engine:** [Django Rest Framework (DRF) 3.17](https://www.django-rest-framework.org/) com autenticação via JSON Web Tokens ([SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/))
*   **Autenticação:** [Social Django (Google OAuth 2.0)](https://python-social-auth.readthedocs.io/)
*   **Extração de Dados:** [pdfplumber](https://github.com/jsvine/pdfplumber) para processamento inteligente de arquivos PDF
*   **Documentação OpenAPI:** [drf-spectacular](https://github.com/tfranzel/drf-spectacular) para geração automática de Swagger / Redoc

### 🎨 Frontend (Next.js & TypeScript)
*   **Framework Principal:** [Next.js 15 (App Router)](https://nextjs.org/) & [TypeScript](https://www.typescriptlang.org/)
*   **Design Pattern:** **Atomic Design** para estruturação modular dos componentes (`atoms`, `molecules`, `organisms`, `templates`, `pages`).
*   **Estilização:** CSS Puro semântico integrado ao Tailwind CSS via variáveis CSS nativas (`globals.css`), proporcionando suporte nativo automático a temas Claro (Light) e Escuro (Dark).
*   **Layout:** *Laptop-first*, totalmente responsivo e adaptável para tablets (iPad) e dispositivos móveis (smartphones).

---

## 📂 Estrutura do Repositório

```bash
minha-uem/
├── backend/                  # API REST (Django)
│   ├── a_academico/          # Módulo acadêmico (horários, notas, faltas, classroom, iCal)
│   ├── a_auth/               # Módulo de autenticação e validação do domínio @uem.br
│   ├── a_docs_api/           # Módulo de documentação Swagger/OpenAPI
│   ├── p_minha_uem/          # Configuração global do projeto Django
│   ├── manage.py             # Script utilitário do Django
│   └── requirements.txt      # Dependências Python
│
├── frontend/                 # Interface do Usuário (Next.js)
│   ├── app/                  # Roteamento e páginas (Landing, Login, Dashboard)
│   │   ├── (dashboard)/      # Área interna logada (disciplinas, horários, configurações, curso)
│   │   ├── landing/          # Página de apresentação institucional
│   │   └── login/            # Tela de login com Google Auth
│   ├── components/           # Componentes modulares seguindo Atomic Design
│   │   ├── atoms/            # Elementos HTML puros estilizados
│   │   ├── molecules/        # Grupos de átomos operando juntos
│   │   ├── organisms/        # Seções complexas compostas de moléculas
│   │   └── templates/        # Esqueletos e layouts de página
│   ├── lib/                  # Utilitários, hooks customizados e clientes de API
│   ├── public/               # Ativos estáticos (imagens, ícones)
│   └── package.json          # Dependências e scripts Node.js
```

---

## 🚀 Como Executar o Projeto Localmente

### 1️⃣ Pré-requisitos
*   [Python 3.12](https://www.python.org/downloads/) ou superior instalado.
*   [Node.js 20](https://nodejs.org/) ou superior com npm configurado.
*   Chaves de API do Google Cloud Console (com escopos do Google Classroom, Google Drive e Google Calendar habilitados).

---

### 2️⃣ Configurando o Backend (Django)

1. Entre no diretório do backend:
   ```bash
   cd backend
   ```

2. Crie e ative um ambiente virtual:
   *   **Linux/macOS:**
       ```bash
       python3 -m venv .venv
       source .venv/bin/activate
       ```
   *   **Windows:**
       ```bash
       python -m venv .venv
       .venv\Scripts\activate
       ```

3. Instale todas as dependências requeridas:
   ```bash
   pip install -r requirements.txt
   ```

4. Crie um arquivo `.env` baseado nas configurações do seu banco e credenciais do Google OAuth:
   ```env
   DJANGO_SECRET_KEY=sua_secret_key_aqui
   DEBUG=True
   ALLOWED_HOSTS=localhost,127.0.0.1
   
   # Credenciais Google OAuth2
   SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=seu_client_id_do_google
   SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET=sua_client_secret_do_google
   ```

5. Execute as migrações do banco de dados:
   ```bash
   python manage.py migrate
   ```

6. Inicie o servidor de desenvolvimento:
   ```bash
   python manage.py runserver
   ```
   A API estará acessível em `http://127.0.0.1:8000/`. A documentação interativa Swagger estará disponível em `http://127.0.0.1:8000/api/schema/swagger-ui/`.

---

### 3️⃣ Configurando o Frontend (Next.js)

1. Entre no diretório do frontend:
   ```bash
   cd ../frontend
   ```

2. Instale as dependências do projeto:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` para apontar para a API do backend local:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   ```

4. Rode o servidor de desenvolvimento do Next.js:
   ```bash
   npm run dev
   ```
   Abra `http://localhost:3000` em seu navegador para acessar a aplicação.

5. Comandos de Verificação e Build:
   *   Para analisar o código em busca de problemas ou inconsistências de estilo (Linter):
       ```bash
       npm run lint
       ```
   *   Para gerar o build de produção da aplicação:
       ```bash
       npm run build
       ```

---

## 📄 Licença

Este projeto é desenvolvido para fins acadêmicos e uso pessoal. Todos os direitos reservados.