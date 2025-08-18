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
      
      // Слушаем события от бота
      const handleBotMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'subscription_status') {
            // Обновляем статус подписки
            const hasAccess = data.has_access === true;
            localStorage.setItem('anoraArt_hasAccess', hasAccess.toString());
            // Уведомляем приложение об изменении статуса
            window.dispatchEvent(new CustomEvent('subscription_updated', { detail: { hasAccess } }));
          }
        } catch (error) {
          console.error('Ошибка обработки сообщения от бота:', error);
        }
      };
      
      window.addEventListener('message', handleBotMessage);
      
      return () => {
        window.removeEventListener('message', handleBotMessage);
      };
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

    console.log('Отправляем данные боту:', paymentData);
    const ok = tg.sendData(JSON.stringify(paymentData));
    console.log('sendData вернул:', ok);
    
    // Показываем пользователю, что данные отправлены
    alert(`Данные отправлены боту: ${JSON.stringify(paymentData)}`);
  };

  const checkSubscription = () => {
    if (!tg || !user) {
      console.warn('Telegram WebApp или пользователь недоступны');
      return;
    }

    // Отправляем запрос боту для проверки статуса подписки
    const checkData = {
      action: 'check_subscription',
      user_id: user.id
    };

    console.log('Проверяем подписку через бота:', checkData);
    const ok = tg.sendData(JSON.stringify(checkData));
    console.log('sendData вернул:', ok);
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
    checkSubscription,
    showPaymentDialog,
    hapticFeedback,
    isInTelegram: !!tg
  };
};
