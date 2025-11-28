
// services/stripeService.ts

// ==============================================================================
// ⚠️ CONFIGURAÇÃO DE PAGAMENTOS (LIVE vs TEST) ⚠️
//
// O Stripe tem dois modos: LIVE (Azul) e TEST (Laranja).
// Os links criados num modo NÃO funcionam no outro.
//
// PARA TESTAR (Sem gastar dinheiro real):
// 1. Ative o "Test Mode" no topo do Dashboard do Stripe.
// 2. Crie produtos e links de pagamento neste modo.
// 3. Configure o redirecionamento para: https://O-SEU-APP.vercel.app/#/generator?payment_success=true
// 4. Copie os links "buy.stripe.com/test_..." para as variáveis abaixo.
//
// DADOS PARA PAGAMENTO DE TESTE:
// Cartão: 4242 4242 4242 4242
// Validade: Qualquer futuro (ex: 12/30)
// CVC: 123
// ==============================================================================

// --- COLOQUE AQUI OS SEUS LINKS (Descomente o que estiver a usar) ---

// >>> MODO DE TESTE (Links começam geralmente por 'test_') <<<
// export const STRIPE_SUBSCRIPTION_LINK = "https://buy.stripe.com/test_3cIfZj0pD5wU8mqeymf7i02";
// export const STRIPE_ONE_TIME_LINK = "https://buy.stripe.com/test_7sYcN7c8l7F2eKO1LAf7i03";

// >>> MODO REAL / LIVE (Links para receber dinheiro a sério) <<<
export const STRIPE_SUBSCRIPTION_LINK = "https://buy.stripe.com/28E5kCdnO8lm6Cmd61dUY02";
export const STRIPE_ONE_TIME_LINK = "https://buy.stripe.com/5kQ28qfvWdFGgcW0jfdUY03"; 


export const redirectToCheckout = async (userId: string, userEmail: string | null, type: 'subscription' | 'one_time'): Promise<void> => {
  const rawLink = type === 'subscription' ? STRIPE_SUBSCRIPTION_LINK : STRIPE_ONE_TIME_LINK;
  const link = rawLink.trim();

  // Verificação de segurança
  if (link.includes("test_") && !window.location.hostname.includes("localhost") && !window.location.hostname.includes("vercel")) {
    console.warn("Atenção: Está a usar links de teste num ambiente que parece produção.");
  }

  if (link.includes("SUBSTITUA") || !link.startsWith("http")) {
    alert("⚠️ LINKS NÃO CONFIGURADOS.\n\nAbra 'services/stripeService.ts' e configure os seus links do Stripe.");
    return;
  }

  // Constrói a URL com parâmetros
  const separator = link.includes('?') ? '&' : '?';
  let finalUrl = `${link}${separator}client_reference_id=${userId}`;

  // Se tivermos email, preenchemos automaticamente no Stripe
  if (userEmail) {
    finalUrl += `&prefilled_email=${encodeURIComponent(userEmail)}`;
  }

  window.location.href = finalUrl; 
};