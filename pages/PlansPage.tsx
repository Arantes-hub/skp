
import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { translations } from '../utils/translations';
import { Icons } from '../components/icons';
import * as stripeService from '../services/stripeService';

const PlanCard: React.FC<{
  title: string;
  description: string;
  price: string;
  priceDetails: string;
  features: { text: string; premiumOnly: boolean }[];
  isPremium: boolean;
  isCurrentUserPlan: boolean;
  isRedirecting: boolean;
  onButtonClick: () => void;
  ctaText: string;
}> = ({ title, description, price, priceDetails, features, isPremium, isCurrentUserPlan, isRedirecting, onButtonClick, ctaText }) => {
  const { language } = useAppContext();
  const t = translations[language].plans;

  return (
    <div className={`border-2 rounded-2xl p-8 flex flex-col ${isPremium ? 'border-[#6C63FF]' : 'border-gray-200 dark:border-gray-700'}`}>
      <h3 className={`text-2xl font-bold ${isPremium ? 'text-[#6C63FF]' : 'text-gray-900 dark:text-white'}`}>{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mt-2 mb-6 flex-grow">{description}</p>
      <div className="mb-8">
        <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{price}</span>
        <span className="text-lg text-gray-500 dark:text-gray-400">{priceDetails}</span>
      </div>
      <button
        onClick={onButtonClick}
        disabled={isCurrentUserPlan || isRedirecting}
        className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center ${
          isCurrentUserPlan
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            : isPremium
            ? 'bg-[#6C63FF] text-white hover:bg-[#5850e0]'
            : 'bg-white dark:bg-gray-800 text-[#6C63FF] border-2 border-[#6C63FF] hover:bg-purple-50 dark:hover:bg-purple-900/50'
        } ${isRedirecting ? 'opacity-50 cursor-wait' : ''}`}
      >
        {isRedirecting ? t.redirecting : ctaText}
      </button>
      
      {/* Note about redirection */}
      {!isCurrentUserPlan && (
        <p className="text-xs text-center mt-2 text-gray-400 dark:text-gray-500">
          {language === 'pt' ? 'Será redirecionado para o Stripe para pagamento seguro.' : 'You will be redirected to Stripe for secure payment.'}
        </p>
      )}

      <hr className="my-8 border-gray-200 dark:border-gray-700" />
      <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">{t.featuresTitle}</h4>
      <ul className="space-y-3">
        {t.features.map((feature, index) => (
          <li key={index} className={`flex items-start gap-3 ${feature.premiumOnly && !isPremium ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
            <Icons.Check className={`w-5 h-5 mt-1 flex-shrink-0 ${feature.premiumOnly && !isPremium ? 'text-gray-400' : 'text-green-500'}`} />
            <span>{feature.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};


export const PlansPage: React.FC = () => {
    const { language, currentUser, setShowAuthModal, showToast } = useAppContext();
    const t = translations[language].plans;
    const [isRedirecting, setIsRedirecting] = useState<'one_time' | 'subscription' | null>(null);

    const handlePayment = async (type: 'one_time' | 'subscription') => {
        if (!currentUser) {
            setShowAuthModal(true);
            return;
        }
        setIsRedirecting(type);
        try {
            await stripeService.redirectToCheckout(currentUser.uid, currentUser.email, type);
        } catch (error) {
            console.error("Failed to redirect to checkout", error);
            showToast("Could not initiate the payment process.", 'error');
            setIsRedirecting(null);
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center max-w-3xl mx-auto mb-12">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">{t.title}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">{t.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <PlanCard
                    title={t.freeTitle}
                    description={t.freeDesc}
                    price={t.freePrice}
                    priceDetails=""
                    features={t.features}
                    isPremium={false}
                    isCurrentUserPlan={false} // Always clickable to buy more courses
                    isRedirecting={isRedirecting === 'one_time'}
                    onButtonClick={() => handlePayment('one_time')}
                    ctaText={t.ctaFree}
                />
                <PlanCard
                    title={t.premiumTitle}
                    description={t.premiumDesc}
                    price={t.premiumPrice}
                    priceDetails={t.perMonth}
                    features={t.features}
                    isPremium={true}
                    isCurrentUserPlan={!!currentUser?.isPremium}
                    isRedirecting={isRedirecting === 'subscription'}
                    onButtonClick={() => handlePayment('subscription')}
                    ctaText={!!currentUser?.isPremium ? t.ctaCurrent : t.ctaPremium}
                />
            </div>
        </div>
    );
};
