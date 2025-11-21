# Guia de Publicação (Deploy)

## 1. Configuração da Supabase (Banco de Dados)

Este passo é obrigatório para o login e cursos funcionarem.

1.  **Criar Projeto**: Vá a [supabase.com](https://supabase.com/) e crie um novo projeto.
2.  **Tabelas**:
    *   Vá ao menu **SQL Editor**.
    *   Copie o conteúdo do arquivo `docs/SUPABASE_SCHEMA.sql` deste projeto.
    *   Cole no editor e clique em **Run**.
3.  **Chaves de API**:
    *   Vá a **Project Settings** > **API**.
    *   Copie o **Project URL** e a **anon public key**.
    *   Cole estas chaves no arquivo `services/supabaseClient.ts` (substituindo os placeholders).
4.  **Autenticação**:
    *   Vá a **Authentication** > **Providers**.
    *   Ative **Email** e desative "Confirm email" (para facilitar testes).

---

## 2. Enviar Código para o GitHub

Tem duas opções. Se o terminal falhar, use a **Opção B**.

### Opção A: Via Terminal (Recomendado)
1.  **Baixar o Projeto**: Baixe os arquivos (Zip) para o seu computador e extraia.
2.  **Criar Repositório**: No site do [GitHub](https://github.com), crie um repositório vazio.
3.  **Terminal**: Abra o terminal na pasta do projeto e rode:

    ```bash
    git init
    git add .
    git commit -m "Upload manual"
    git branch -M main
    git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
    git push -u origin main --force
    ```

### Opção B: Arrastar e Largar (Se o Terminal falhar)
Se tiver erros de autenticação no terminal:
1.  Vá à página do seu repositório no site do GitHub.
2.  Clique em **Add file** > **Upload files**.
3.  No seu computador, abra a pasta do projeto.
4.  **IMPORTANTE**: Apague a pasta `node_modules` ou **não a selecione**.
5.  Selecione todos os outros arquivos e arraste-os para a página do GitHub.
6.  Aguarde o upload e clique no botão verde **Commit changes**.

---

## 3. Publicar na Vercel (Passo a Passo)

1.  **Login**: Vá a [vercel.com](https://vercel.com) e faça login com o **GitHub**.
2.  **Novo Projeto**:
    *   No Dashboard, clique no botão **"Add New..."** -> **"Project"**.
3.  **Importar**:
    *   Na lista "Import Git Repository", encontre o `SkillSpark`.
    *   Clique no botão azul **Import**.
4.  **Configurar (Importante)**:
    *   **Project Name:** Deixe como está.
    *   **Framework Preset:** Certifique-se que diz `Vite`.
    *   **Environment Variables** (Clique para expandir):
        *   **Key**: Escreva `API_KEY`
        *   **Value**: Cole a sua chave do Google AI (começa por `AIza...`).
        *   Clique em **Add**.
5.  **Finalizar**:
    *   Clique no botão **Deploy**.
    *   Aguarde cerca de 1-2 minutos até aparecerem os confettis.
    *   Clique em **Visit** para ver o seu site online.

---

## 4. Configuração Final (Stripe)

**Não se esqueça disto!** O pagamento só funciona se fizer isto.

Depois do site estar online (ex: `https://skillspark.vercel.app`):

1.  Vá ao **Stripe Dashboard**.
2.  Edite os seus Links de Pagamento (tanto o de €4.99 como o de €14.99).
3.  Em "Após o pagamento" (After payment), selecione "Redirect customers to your website".
4.  Cole o link do seu site novo seguido do código de sucesso:
    
    `https://SEU-LINK-DA-VERCEL.app/#/generator?payment_success=true`
