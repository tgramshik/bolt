#!/usr/bin/env python3
"""
Пример Telegram бота для обработки платежей через WebApp
Требует: pip install python-telegram-bot
"""

import json
import logging
from telegram import Update, LabeledPrice, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, PreCheckoutQueryHandler

# Настройка логирования
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
logger = logging.getLogger(__name__)

# Замените на ваш токен бота
BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"

# Хранилище подписок (в реальном приложении используйте базу данных)
user_subscriptions = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start"""
    keyboard = [[InlineKeyboardButton("🎨 Открыть Анора Арт", web_app={"url": "https://your-webapp-url.com"})]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "🎨 Добро пожаловать в Анора Арт!\n\n"
        "Создавайте уникальные художественные изображения с помощью ИИ.\n"
        "Нажмите кнопку ниже, чтобы начать:",
        reply_markup=reply_markup
    )

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка данных от WebApp"""
    try:
        # Получаем данные от WebApp
        web_app_data = update.message.web_app_data.data
        data = json.loads(web_app_data)
        user_id = update.effective_user.id
        
        logger.info(f"Получены данные от WebApp: {data}")
        
        action = data.get('action')
        
        if action == 'request_payment':
            await handle_payment_request(update, context, data)
        elif action == 'check_subscription':
            await handle_subscription_check(update, context, data)
        else:
            await update.message.reply_text(f"❌ Неизвестное действие: {action}")
            
    except json.JSONDecodeError:
        logger.error("Ошибка декодирования JSON от WebApp")
        await update.message.reply_text("❌ Ошибка обработки данных")
    except Exception as e:
        logger.error(f"Ошибка обработки данных WebApp: {e}")
        await update.message.reply_text("❌ Произошла ошибка")

async def handle_payment_request(update: Update, context: ContextTypes.DEFAULT_TYPE, data):
    """Обработка запроса на оплату"""
    user_id = update.effective_user.id
    amount = data.get('amount', 100)
    description = data.get('description', 'Месячная подписка')
    
    # Создаем инвойс для Telegram Stars
    prices = [LabeledPrice("Подписка Анора Арт", amount)]
    
    try:
        await context.bot.send_invoice(
            chat_id=update.effective_chat.id,
            title="🎨 Анора Арт - Премиум доступ",
            description=description,
            payload=f"subscription_{user_id}",
            provider_token="",  # Пустой для Telegram Stars
            currency="XTR",  # Telegram Stars
            prices=prices,
            start_parameter="subscription",
            photo_url="https://via.placeholder.com/400x300/FF69B4/FFFFFF?text=Anora+Art",
            photo_width=400,
            photo_height=300
        )
        
        logger.info(f"Отправлен инвойс пользователю {user_id} на сумму {amount} XTR")
        
    except Exception as e:
        logger.error(f"Ошибка отправки инвойса: {e}")
        await update.message.reply_text("❌ Ошибка создания платежа")

async def handle_subscription_check(update: Update, context: ContextTypes.DEFAULT_TYPE, data):
    """Проверка статуса подписки"""
    user_id = data.get('user_id', update.effective_user.id)
    
    # Проверяем статус подписки (в реальном приложении - из базы данных)
    has_access = user_subscriptions.get(user_id, False)
    
    # Отправляем ответ обратно в WebApp через postMessage
    response_data = {
        "type": "subscription_status",
        "has_access": has_access,
        "user_id": user_id
    }
    
    # В реальном приложении нужно отправить это через WebApp API
    # Пока что просто логируем
    logger.info(f"Статус подписки для пользователя {user_id}: {has_access}")
    
    # Отправляем сообщение пользователю
    status_text = "✅ У вас есть премиум доступ" if has_access else "❌ Премиум доступ не активен"
    await update.message.reply_text(f"🔍 Проверка подписки:\n{status_text}")

async def precheckout_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Предварительная проверка платежа"""
    query = update.pre_checkout_query
    
    # Проверяем payload
    if query.invoice_payload.startswith("subscription_"):
        await query.answer(ok=True)
    else:
        await query.answer(ok=False, error_message="❌ Неверный платеж")

async def successful_payment(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработка успешного платежа"""
    payment = update.message.successful_payment
    user_id = update.effective_user.id
    
    # Активируем подписку
    user_subscriptions[user_id] = True
    
    logger.info(f"Успешный платеж от пользователя {user_id}: {payment.total_amount} {payment.currency}")
    
    # Уведомляем пользователя
    await update.message.reply_text(
        "🎉 Спасибо за оплату!\n\n"
        "✅ Премиум доступ активирован\n"
        "🎨 Теперь вы можете генерировать изображения без ограничений\n\n"
        "Вернитесь в приложение и начните творить!"
    )
    
    # Отправляем уведомление в WebApp (если оно открыто)
    response_data = {
        "type": "subscription_status",
        "has_access": True,
        "user_id": user_id
    }
    
    # В реальном приложении здесь нужно отправить данные в WebApp
    logger.info(f"Подписка активирована для пользователя {user_id}")

def main():
    """Запуск бота"""
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Добавляем обработчики
    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
    application.add_handler(PreCheckoutQueryHandler(precheckout_callback))
    application.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment))
    
    # Запускаем бота
    logger.info("Бот запущен...")
    application.run_polling()

if __name__ == '__main__':
    main()
