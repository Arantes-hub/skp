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

Como está a utilizar o Google AI Studio, este processo é automático:

1.  No topo do Google AI Studio, clique no botão **Export** ou no ícone do GitHub.
2.  Selecione **"Push to GitHub"**.
3.  Conecte a sua conta GitHub (se ainda não o fez).
4.  Escolha criar um **New Repository** (ex: `skillspark-app`).
5.  Clique em **Push**.
    *   *Nota: Sempre que fizer alterações aqui no AI Studio, repita este passo para atualizar o seu site.*

---

## 3. Publicar na Vercel (Passo a Passo)

1.  **Login**: Vá a [vercel.com](https://vercel.com) e faça login com o **GitHub**.
2.  **Novo Projeto**:
    *   No Dashboard, clique no botão **"Add New..."** -> **"Project"**.
3.  **Importar**:
    *   Na lista "Import Git Repository", deve aparecer o repositório `skillspark-app` que acabou de criar.
    *   Clique no botão azul **Import**.
4.  **Configurar (Importante)**:    
    *   **Project Name:** Deixe como está.
    *   **Framework Preset:** A Vercel deve detetar `Vite` automaticamente. Se não, selecione `Vite`.
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