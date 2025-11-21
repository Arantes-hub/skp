
// services/stripeService.ts

// ==============================================================================
// CONFIGURAÇÃO: LINKS DE PAGAMENTO (STRIPE)
// 1. Crie dois "Payment Links" no Stripe: um para assinatura (€14.99) e outro para compra única (€4.99).
// 2. Cole os URLs abaixo entre aspas.
//
// ⚠️ IMPORTANTE: CONFIGURAÇÃO DE REDIRECIONAMENTO
// Para que o utilizador consiga gerar o curso logo após pagar:
// 1. No Painel do Stripe, vá ao Link de Pagamento > Editar.
// 2. Em "After payment" (Após o pagamento), selecione "Redirect customers to your website".
// 3. Cole este link:
//    https://SEU-SITE.vercel.app/#/generator?payment_success=true
//    (Se estiver a testar localmente: http://localhost:3000/#/generator?payment_success=true)
// ==============================================================================

// Link para o Plano Premium Mensal (€14.99/mês)
export const STRIPE_SUBSCRIPTION_LINK = "https://buy.stripe.com/test_3cIfZj0pD5wU8mqeymf7i02";

// Link para comprar apenas 1 curso (€4.99 pagamento único)
// ⚠️ CRIE UM NOVO LINK NO STRIPE PARA 4.99 E COLE AQUI
export const STRIPE_ONE_TIME_LINK = "https://buy.stripe.com/test_7sYcN7c8l7F2eKO1LAf7i03"; 

export const redirectToCheckout = async (userId: string, type: 'subscription' | 'one_time'): Promise<void> => {
  const link = type === 'subscription' ? STRIPE_SUBSCRIPTION_LINK : STRIPE_ONE_TIME_LINK;

  // Verificação de segurança
  if (link.includes("SEU_LINK") || !link.startsWith("http")) {
    alert(`Erro de Configuração: O link de pagamento (${type}) não foi configurado no arquivo services/stripeService.ts`);
    throw new Error("Link de pagamento não configurado");
  }

  // Adiciona o ID do utilizador ao URL para sabermos quem pagou (client_reference_id)
  // O Stripe suporta isto nativamente em Payment Links se configurado, ou via parâmetro de URL customizado.
  const separator = link.includes('?') ? '&' : '?';
  window.location.href = `${link}${separator}client_reference_id=${userId}&prefilled_email=${encodeURIComponent(userId)}`; 
};
