
// services/stripeService.ts

// ==============================================================================
// ⚠️ CONFIGURAÇÃO CRÍTICA PARA PAGAMENTOS REAIS ⚠️
//
// Para que os pagamentos funcionem na sua conta bancária:
// 1. Aceda a https://dashboard.stripe.com/
// 2. Crie uma conta e ative o modo "Live" (ou use "Test Mode" para testes).
// 3. Vá a "Product Catalog" e crie dois produtos: "Premium" e "Curso Único".
// 4. Em cada produto, clique em "Create Payment Link".
// 5. IMPORTANTE: Nas opções do Payment Link, em "After payment", selecione
//    "Redirect customers to your website" e cole este link:
//    https://skillspark-app.vercel.app/#/generator?payment_success=true
//    (Substitua "skillspark-app.vercel.app" pelo seu domínio real da Vercel).
// 6. Copie os links gerados pelo Stripe (começam por https://buy.stripe.com/...)
//    e substitua as variáveis abaixo.
// ==============================================================================

// Link para Assinatura Mensal (Ex: €14.99) - Substitua pelo seu link real
export const STRIPE_SUBSCRIPTION_LINK = "https://buy.stripe.com/28E5kCdnO8lm6Cmd61dUY02";

// Link para Compra Única (Ex: €4.99) - Substitua pelo seu link real
export const STRIPE_ONE_TIME_LINK = "https://buy.stripe.com/5kQ28qfvWdFGgcW0jfdUY03"; 

export const redirectToCheckout = async (userId: string, type: 'subscription' | 'one_time'): Promise<void> => {
  const link = type === 'subscription' ? STRIPE_SUBSCRIPTION_LINK : STRIPE_ONE_TIME_LINK;

  // Verificação de segurança para avisar o developer
  if (link.includes("SUBSTITUA") || !link.startsWith("http")) {
    alert("⚠️ ATENÇÃO: Os links de pagamento ainda não foram configurados.\n\nAbra o ficheiro 'services/stripeService.ts' e cole os seus links do Stripe.");
    return;
  }

  // Adiciona o ID do utilizador para referência futura
  const separator = link.includes('?') ? '&' : '?';
  // 'client_reference_id' é usado pelo Stripe para ligar o pagamento ao utilizador
  window.location.href = `${link}${separator}client_reference_id=${userId}&prefilled_email=${encodeURIComponent(userId)}`; 
};
