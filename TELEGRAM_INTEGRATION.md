# Интеграция с Telegram Bot для платежей через Stars

## Что реализовано

✅ **Telegram WebApp SDK** - интеграция с API Telegram для миниприложений
✅ **Система платежей** - запрос оплаты через Telegram Stars  
✅ **UI/UX для платежей** - кнопка меняется на "Оплатить доступ (100 ⭐)" когда нет доступа
✅ **Haptic Feedback** - тактильная обратная связь для лучшего UX
✅ **Статус доступа** - визуальный индикатор "Премиум доступ"

## Как работает

1. **Первое использование**: Пользователь видит кнопку "Оплатить доступ (100 ⭐)"
2. **Нажатие на кнопку**: Показывается диалог подтверждения оплаты
3. **Подтверждение**: Отправляется запрос боту через `tg.sendData()`
4. **Обработка ботом**: Бот должен создать инвойс для Telegram Stars
5. **После оплаты**: Пользователь получает доступ к генерации

## Настройка бота

### 1. Обработка данных от WebApp

```python
# В вашем Telegram боте
import json
from telegram import Update, LabeledPrice
from telegram.ext import ContextTypes

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    web_app_data = update.message.web_app_data.data
    data = json.loads(web_app_data)
    
    if data.get('action') == 'request_payment':
        # Создаем инвойс для Telegram Stars
        await create_stars_invoice(update, context, data)

async def create_stars_invoice(update: Update, context: ContextTypes.DEFAULT_TYPE, data):
    prices = [LabeledPrice("Месячная подписка", data['amount'])]
    
    await context.bot.send_invoice(
        chat_id=update.effective_chat.id,
        title="Анора Арт - Премиум доступ",
        description=data['description'],
        payload="monthly_subscription",
        provider_token="",  # Пустой для Telegram Stars
        currency="XTR",  # Telegram Stars
        prices=prices,
        start_parameter="subscription"
    )
```

### 2. Обработка успешной оплаты

```python
async def successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # Пользователь успешно оплатил
    user_id = update.effective_user.id
    
    # Сохраните информацию о подписке в вашей БД
    # Например: save_subscription(user_id, expires_at=datetime.now() + timedelta(days=30))
    
    await update.message.reply_text(
        "🎉 Спасибо за оплату! Теперь у вас есть доступ к генерации изображений на месяц."
    )
```

### 3. Проверка доступа

Добавьте в WebApp проверку статуса подписки:

```javascript
// В useTelegram.ts добавьте функцию проверки доступа
const checkAccess = async () => {
  if (!tg) return false;
  
  // Отправляем запрос боту для проверки статуса подписки
  const checkData = {
    action: 'check_subscription',
    user_id: user?.id
  };
  
  tg.sendData(JSON.stringify(checkData));
  
  // Бот должен ответить через postMessage или другим способом
};
```

## Структура файлов

```
src/
├── types/telegram.ts          # TypeScript типы для Telegram WebApp API
├── hooks/useTelegram.ts       # React хук для работы с Telegram
└── App.tsx                    # Основной компонент с интеграцией платежей
```

## Тестирование

1. **В браузере**: Приложение работает, но `window.Telegram` будет undefined
2. **В Telegram**: Откройте WebApp через бота для полного тестирования
3. **Эмуляция**: Можно добавить моковые данные для разработки

## Дополнительные возможности

- **Проверка истечения подписки** - добавьте таймер или проверку при запуске
- **Разные тарифы** - можно добавить выбор периода подписки  
- **Промокоды** - система скидок через бота
- **История платежей** - показ предыдущих транзакций

## Безопасность

⚠️ **Важно**: Всегда проверяйте статус подписки на стороне бота, а не только в WebApp, так как клиентский код может быть изменен пользователем.
