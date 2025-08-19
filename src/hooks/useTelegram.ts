import { useEffect, useState } from 'react';
import { TelegramWebApp } from '../types/telegram';

// Используем прямой IP к нашему серверу
const BACKEND_URL = 'http://212.86.105.205:8081';

export const useTelegram = () => {
  const [tg, setTg] = useState<TelegramWebApp | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const app = window.Telegram?.WebApp;
    if (app) {
      app.ready();
      setTg(app);
      
      console.log('Telegram WebApp версия:', app.version);
      console.log('initData:', app.initData);
      console.log('initDataUnsafe:', app.initDataUnsafe);
      
      const userData = app.initDataUnsafe?.user;
      if (userData) {
        setUser(userData);
        console.log('Пользователь найден:', userData);
      } else {
        console.warn('Пользователь не найден в initDataUnsafe');
        if (app.initData) {
          console.log('Пытаемся парсить initData:', app.initData);
        }
      }
      
      const handleBotMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'subscription_status') {
            const hasAccess = data.has_access === true;
            localStorage.setItem('anoraArt_hasAccess', hasAccess.toString());
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
      console.log('Telegram WebApp недоступен - режим разработки');
    }
  }, []);

  const sendWebAppData = (data: any) => {
    if (!tg) {
      console.warn('Telegram WebApp не доступен');
      return;
    }

    console.log('Sending data:', data);
    
    const dataToSend = {
      action: data.action,
      user_id: tg.initDataUnsafe?.user?.id,
      ...data
    };
    
    // Определяем тип запуска и выбираем способ отправки
    if (tg.initDataUnsafe?.chat && tg.sendData) {
      // KeyboardButton - используем sendData
      console.log('Using KeyboardButton method (sendData)');
      try {
        tg.sendData(JSON.stringify(dataToSend));
        tg.close();
      } catch (error) {
        console.error('Error with sendData:', error);
        showError('Ошибка отправки данных');
      }
      
    } else if (tg.initDataUnsafe?.query_id) {
      // InlineKeyboardButton - используем fetch
      console.log('Using InlineKeyboardButton method (fetch)');
      
      fetch(`${BACKEND_URL}/webapp/inline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_id: tg.initDataUnsafe.query_id,
          data: dataToSend
        })
      })
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(result => {
        console.log('Success:', result);
        tg.close();
      })
      .catch(error => {
        console.error('Error with fetch:', error);
        showError('Ошибка связи с сервером: ' + error.message);
      });
      
    } else {
      console.error('Unknown launch method');
      showError('Неизвестный способ запуска');
    }
  };

  const requestPayment = (amount: number, description: string) => {
    const paymentData = {
      action: 'request_payment',
      amount: amount,
      description: description,
      currency: 'XTR'
    };

    console.log('Отправляем данные боту:', paymentData);
    sendWebAppData(paymentData);
  };

  const checkSubscription = () => {
    if (!user) {
      console.warn('Пользователь недоступен, пропускаем проверку подписки');
      return;
    }

    const checkData = {
      action: 'check_subscription',
      user_id: user.id
    };

    console.log('Проверяем подписку через бота:', checkData);
    sendWebAppData(checkData);
  };

  const showPaymentDialog = (onConfirm: () => void, onCancel?: () => void) => {
    if (!tg) {
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

    if (typeof tg.showConfirm === 'function') {
      try {
        tg.showConfirm(
          'Для генерации изображений требуется месячная подписку за 100 Telegram Stars. Продолжить?',
          (confirmed: boolean) => {
            if (confirmed) {
              onConfirm();
            } else if (onCancel) {
              onCancel();
            }
          }
        );
      } catch (error) {
        console.warn('showConfirm не поддерживается, используем fallback:', error);
        const confirmed = window.confirm(
          'Для генерации изображений требуется месячная подписка за 100 Telegram Stars. Продолжить?'
        );
        if (confirmed) {
          onConfirm();
        } else if (onCancel) {
          onCancel();
        }
      }
    } else {
      console.log('showConfirm недоступен, используем window.confirm');
      const confirmed = window.confirm(
        'Для генерации изображений требуется месячная подписка за 100 Telegram Stars. Продолжить?'
      );
      if (confirmed) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    }
  };

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning') => {
    if (!tg?.HapticFeedback) {
      console.log('HapticFeedback недоступен в этой версии Telegram');
      return;
    }

    try {
      if (type === 'error' || type === 'success' || type === 'warning') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch (error) {
      console.warn('Ошибка HapticFeedback:', error);
    }
  };

  const setModel = (modelId: string, title?: string) => {
    const payload = {
      action: 'select_model',
      model_id: modelId,
      title: title
    };
    console.log('Выбор модели — отправляем боту:', payload);
    sendWebAppData(payload);
  };

  const showError = (message: string) => {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    } else {
      alert(message);
    }
  };

  return {
    tg,
    user,
    requestPayment,
    checkSubscription,
    showPaymentDialog,
    hapticFeedback,
    setModel,
    sendWebAppData,
    isInTelegram: !!tg
  };
};
