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

## 4. Configuração Pós-Deploy (OBRIGATÓRIO)

Agora que o seu site tem um endereço oficial (ex: `https://o-seu-projeto.vercel.app`), precisa de atualizar os serviços externos.

### A. Atualizar Supabase (Para o Login funcionar)
Se não fizer isto, o login vai dar erro ou redirecionar para `localhost`.

1.  Vá ao painel da **Supabase** > **Authentication** > **URL Configuration**.
2.  **Site URL**: Apague o que lá estiver e coloque o link do seu site na Vercel (ex: `https://skillspark-app.vercel.app`).
3.  **Redirect URLs**: Adicione o seguinte:
    *   `https://skillspark-app.vercel.app/**` (Substitua pelo seu domínio real).
4.  Clique em **Save**.

### B. Atualizar Google Cloud (Se usar Login com Google)
1.  Vá ao [Google Cloud Console](https://console.cloud.google.com/).
2.  Vá a **APIs & Services** > **Credentials**.
3.  Edite o seu **OAuth 2.0 Client ID**.
4.  **Authorized JavaScript origins**: Adicione o seu domínio da Vercel.
5.  **Authorized redirect URIs**: Adicione o seu domínio da Vercel seguido de `/auth/callback` (se estiver a usar a Supabase para gerir o callback, verifique o URL que a Supabase pede).
6.  Clique em **Save**.

### C. Atualizar Stripe (Pagamentos)
1.  Vá ao **Stripe Dashboard** > **Payment Links**.
2.  Edite cada link de pagamento.
3.  Na secção "After payment", certifique-se que está a redirecionar para:
    `https://O-SEU-DOMINIO-VERCEL.app/#/generator?payment_success=true`

---

## 5. Teste Final

1.  Abra o seu site no novo domínio.
2.  Tente fazer **Login** (Google ou Email).
3.  Gere um curso gratuito.
4.  Simule um pagamento (se estiver em modo de teste no Stripe).
5.  Verifique se, após o pagamento, volta para a página do gerador.