import { useEffect, useState } from 'react';
import { TelegramWebApp } from '../types/telegram';

export const useTelegram = () => {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (app) {
      app.ready();
      setTg(app);
      setUser(app.initDataUnsafe?.user);
    } else {
      // Fallback для тестирования вне Telegram
      console.log('Telegram WebApp недоступен - режим разработки');
    }
  }, []);

  const requestPayment = (amount: number, description: string) => {
    if (!tg) {
      console.warn('Telegram WebApp не доступен');
      return;
    }

    // Отправляем данные боту для инициации платежа
    const paymentData = {
      action: 'request_payment',
      amount: amount,
      description: description,
      currency: 'XTR' // Telegram Stars
    };

    tg.sendData(JSON.stringify(paymentData));
  };

  const showPaymentDialog = (onConfirm: () => void, onCancel?: () => void) => {
    if (!tg) {
      // Fallback для тестирования вне Telegram
      const confirmed = window.confirm(
        'Для генерации изображений требуется месячная подписка за 100 Telegram Stars. Продолжить?'
      );
      if (confirmed) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
      return;
    }

    tg.showConfirm(
      'Для генерации изображений требуется месячная подписка за 100 Telegram Stars. Продолжить?',
      (confirmed: boolean) => {
        if (confirmed) {
          onConfirm();
        } else if (onCancel) {
          onCancel();
        }
      }
    );
  };

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning') => {
    if (!tg?.HapticFeedback) return;

    if (type === 'error' || type === 'success' || type === 'warning') {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  };

  return {
    tg,
    user,
    requestPayment,
    showPaymentDialog,
    hapticFeedback,
    isInTelegram: !!tg
  };
};
