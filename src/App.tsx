import { useState, useEffect } from 'react';
import { Heart, Sparkles, Camera, ZoomIn, X, Flame, Star, Eye, Lock } from 'lucide-react';
import { useTelegram } from './hooks/useTelegram';
import PremiumModels from './pages/PremiumModels';

interface GeneratedImage {
  id: number;
  prompt: string;
  url: string;
  timestamp: Date;
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [hasAccess, setHasAccess] = useState(false);
  const [route, setRoute] = useState<string>(window.location.hash || '#/');
  
  const { requestPayment, checkSubscription, showPaymentDialog, hapticFeedback, isInTelegram, user } = useTelegram();

  const suggestions = [
    "Таинственный силуэт на бархатном фоне, свет свечей и волнующие изгибы",
    "Игра теней и света на шёлковой драпировке, намёки страсти",
    "Полутень и алые блики, чувственная атмосфера будуара",
    "Мягкое свечение сквозь кружевную вуаль, интимная загадка",
    "Отражения в зеркале при свечах, романтическая мистика"
  ];

  const bestIdeas = [
    "Таинственный силуэт на бархатном фоне, свет свечей и волнующие изгибы",
    "Игра теней и света на шёлковой драпировке",
    "Полутень и алые блики, чувственная атмосфера",
    "Мягкое свечение сквозь кружевную вуаль"
  ];

  // Имитация API генерации изображений
  const mockImageUrls = [
    "https://images.pexels.com/photos/1287460/pexels-photo-1287460.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/3951628/pexels-photo-3951628.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/1762581/pexels-photo-1762581.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/2693212/pexels-photo-2693212.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
    "https://images.pexels.com/photos/1363876/pexels-photo-1363876.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop"
  ];

  const handleGenerate = async () => {
    // Проверяем доступ - если нет доступа, запрашиваем оплату
    if (!hasAccess) {
      hapticFeedback('light');
      showPaymentDialog(
        () => {
          // Пользователь согласился на оплату
          hapticFeedback('success');
          requestPayment(100, 'Месячная подписка на генерацию изображений');
          // В реальном приложении здесь должна быть проверка оплаты от бота
          // Пока что показываем сообщение о необходимости оплаты
          alert('Для завершения оплаты следуйте инструкциям в чате с ботом.');
        },
        () => {
          // Пользователь отказался от оплаты
          hapticFeedback('error');
        }
      );
      return;
    }
    
    generateImage();
  };

  const generateImage = async () => {
    setIsGenerating(true);
    hapticFeedback('medium');
    
    // Имитация времени генерации
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const randomImage = mockImageUrls[Math.floor(Math.random() * mockImageUrls.length)];
    
    const newImage: GeneratedImage = {
      id: Date.now(),
      prompt: prompt,
      url: randomImage,
      timestamp: new Date()
    };
    
    setGeneratedImages(prev => [newImage, ...prev]);
    setIsGenerating(false);
    setPrompt('');
    hapticFeedback('success');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const promptForPremium = () => {
    hapticFeedback('light');
    showPaymentDialog(
      () => {
        hapticFeedback('success');
        requestPayment(100, 'Месячная подписка на премиум 18+ модели');
        alert('Для завершения оплаты следуйте инструкциям в чате с ботом.');
      },
      () => {
        hapticFeedback('error');
      }
    );
  };

  const handlePremiumClick = () => {
    if (!hasAccess) {
      promptForPremium();
      return;
    }
    hapticFeedback('success');
    window.location.hash = '#/models';
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion(prev => (prev + 1) % suggestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Проверяем доступ при загрузке
  useEffect(() => {
    // Сначала проверяем localStorage для быстрого отображения
    const savedAccess = localStorage.getItem('anoraArt_hasAccess');
    if (savedAccess === 'true') {
      setHasAccess(true);
    }
    
    // Затем проверяем актуальный статус через бота
    checkSubscription();
    
    // Слушаем обновления статуса подписки
    const handleSubscriptionUpdate = (event: CustomEvent) => {
      setHasAccess(event.detail.hasAccess);
    };
    
    window.addEventListener('subscription_updated', handleSubscriptionUpdate as EventListener);
    
    return () => {
      window.removeEventListener('subscription_updated', handleSubscriptionUpdate as EventListener);
    };
  }, [checkSubscription]);

  // Hash routing
  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || '#/');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Route switch: models page vs main
  if (route === '#/models') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-rose-900 relative overflow-hidden">
        <main className="relative z-10">
          <PremiumModels
            hasAccess={hasAccess}
            onRequirePremium={promptForPremium}
            onBack={() => { window.location.hash = '#/'; }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-rose-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-4 w-32 h-32 bg-gradient-to-r from-rose-400/20 to-pink-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 right-6 w-40 h-40 bg-gradient-to-r from-purple-400/15 to-rose-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-8 w-36 h-36 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
        
        {/* Glowing particles */}
        <div className="absolute top-20 right-12 w-2 h-2 bg-rose-300 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-12 w-1 h-1 bg-pink-300 rounded-full animate-ping delay-500"></div>
        <div className="absolute bottom-32 right-8 w-1.5 h-1.5 bg-purple-300 rounded-full animate-ping delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 pt-16 pb-8 px-6 text-center">
        <div className="flex items-center justify-center mb-3">
          <Flame className="w-7 h-7 text-rose-400 mr-2 animate-pulse" />
          <h1 className="text-3xl font-serif font-bold bg-gradient-to-r from-rose-200 via-pink-100 to-purple-200 bg-clip-text text-transparent">
            Анора 18+
          </h1>
          <Eye className="w-7 h-7 text-purple-300 ml-2 animate-pulse delay-300" />
        </div>
        <p className="text-rose-100/90 text-base font-medium tracking-wide">Генерация 18+ изображений</p>
        
        {/* Status indicator */}
        {hasAccess && (
          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30">
            <Star className="w-4 h-4 text-green-400 mr-2" />
            <span className="text-green-300 text-sm font-medium">Премиум доступ</span>
          </div>
        )}
        
        <div className="mt-3 w-20 h-0.5 bg-gradient-to-r from-rose-400 to-purple-400 rounded-full mx-auto shadow-lg shadow-rose-400/50"></div>

        {/* Diagnostics: User presence only */}
        {isInTelegram && user && (
          <div className="mt-3 flex items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200">
              <span className="w-2 h-2 rounded-full bg-sky-400 mr-2"></span>
              Пользователь: {user.first_name}{user.last_name ? ` ${user.last_name}` : ''} (ID: {user.id})
            </span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 pb-8">
        {/* Input Section */}
        <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-rose-300/20 shadow-2xl shadow-rose-900/20 relative overflow-hidden">
          {/* Glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 via-transparent to-purple-400/10 rounded-3xl"></div>
          
          <div className="relative z-10">
            <label className="block text-rose-100 text-sm font-medium mb-4 flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-pink-300" />
              Опиши настроение или сюжет своей пикантной фантазии
            </label>
            
            <div className="relative mb-6">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={suggestions[currentSuggestion]}
                className="w-full h-28 bg-black/50 border border-rose-300/30 rounded-2xl px-5 py-4 text-rose-50 placeholder-rose-200/60 resize-none focus:outline-none focus:ring-2 focus:ring-rose-400/60 focus:border-rose-400/60 transition-all duration-300 backdrop-blur-sm"
                disabled={isGenerating}
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-400/5 to-purple-400/5 pointer-events-none"></div>
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 relative overflow-hidden group shadow-2xl ${
                isGenerating
                  ? 'bg-gray-700/50 cursor-not-allowed shadow-none'
                  : hasAccess
                  ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 shadow-rose-500/50 hover:shadow-rose-400/60 transform hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/50 hover:shadow-amber-400/60 transform hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <div className="flex items-center justify-center relative z-10">
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                    Создаю шедевр...
                  </>
                ) : hasAccess ? (
                  <>
                    <Camera className="w-5 h-5 mr-3" />
                    Сгенерировать
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-3" />
                    Оплатить доступ (100 ⭐)
                  </>
                )}
              </div>
              {!isGenerating && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-150%] transition-transform duration-700"></div>
              )}
            </button>
          </div>
        </div>

        {/* Premium 18+ Models CTA (between pay and best ideas) */}
        <div className="relative z-10 mb-6">
          <button
            onClick={handlePremiumClick}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 relative overflow-hidden group shadow-2xl ${
              hasAccess
                ? 'bg-gradient-to-r from-pink-700 via-fuchsia-700 to-purple-700 hover:from-pink-600 hover:via-fuchsia-600 hover:to-purple-600 shadow-pink-500/60 hover:shadow-fuchsia-500/70 transform hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gradient-to-r from-rose-700 via-pink-700 to-fuchsia-700 hover:from-rose-600 hover:via-pink-600 hover:to-fuchsia-600 shadow-rose-600/60 hover:shadow-pink-500/70 transform hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center justify-center relative z-10">
              {hasAccess ? (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  Премиум 18+ модели
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-3" />
                  Премиум 18+ модели
                </>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-150%] transition-transform duration-700"></div>
          </button>
        </div>

        {/* Best Ideas Panel */}
        <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 mb-6 border border-purple-300/20 shadow-2xl shadow-purple-900/15 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-transparent to-rose-400/10 rounded-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-purple-100 mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-amber-300" />
              Лучшие идеи
            </h2>
            
            <div className="space-y-3">
              {bestIdeas.map((idea, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(idea)}
                  className="w-full text-left p-4 bg-black/40 rounded-xl border border-purple-200/20 text-purple-50 hover:bg-black/50 hover:border-purple-200/40 transition-all duration-200 backdrop-blur-sm group"
                >
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full mt-2 mr-3 group-hover:shadow-lg group-hover:shadow-purple-300/50"></div>
                    <span className="text-sm leading-relaxed">{idea}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery */}
        {generatedImages.length > 0 && (
          <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-6 border border-rose-300/20 shadow-2xl shadow-rose-900/15 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-400/10 via-transparent to-purple-400/10 rounded-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-lg font-bold text-rose-100 mb-6 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-pink-300" />
                Галерея шедевров
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((image) => (
                  <div
                    key={image.id}
                    className="group relative bg-black/50 rounded-2xl overflow-hidden border border-rose-200/20 hover:border-rose-300/50 transition-all duration-300 cursor-pointer transform hover:scale-105 shadow-xl shadow-black/40"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="aspect-[3/4] relative overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                      <div className="absolute inset-0 bg-gradient-to-br from-rose-400/20 via-transparent to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Inner glow effect */}
                      <div className="absolute inset-0 shadow-inner shadow-rose-400/20 rounded-2xl"></div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-rose-50 text-xs line-clamp-2 mb-2 leading-relaxed">{image.prompt}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-rose-200/70 text-xs">
                          {image.timestamp.toLocaleTimeString()}
                        </span>
                        <ZoomIn className="w-4 h-4 text-rose-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {generatedImages.length === 0 && !isGenerating && (
          <div className="text-center py-12">
            <div className="relative mb-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-400/30 to-purple-400/30 rounded-full flex items-center justify-center backdrop-blur-sm border border-rose-300/20">
                <Heart className="w-12 h-12 text-rose-200/80" />
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gradient-to-r from-rose-300/20 to-purple-300/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <h3 className="text-xl font-bold text-rose-100 mb-3">Создай свой первый шедевр</h3>
            <p className="text-rose-200/80 text-sm px-4 leading-relaxed">Опиши желаемое настроение, и я создам для тебя чувственный образ полный намёков и загадок</p>
          </div>
        )}
      </main>

      {/* Modal for Image Preview */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="relative max-w-sm w-full max-h-[85vh] bg-black/70 rounded-3xl overflow-hidden border border-rose-200/30 backdrop-blur-xl shadow-2xl shadow-rose-900/30">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-rose-100 hover:text-white hover:bg-black/90 transition-all duration-200 border border-rose-300/30"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-4">
              <div className="mb-4">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  className="w-full h-auto max-h-[50vh] object-contain rounded-2xl shadow-xl shadow-black/50"
                />
              </div>
              
              <div className="bg-black/50 backdrop-blur-md rounded-2xl p-4 border border-rose-300/20">
                <h3 className="text-lg font-bold text-rose-100 mb-3">Описание</h3>
                <p className="text-rose-50 mb-4 leading-relaxed text-sm">{selectedImage.prompt}</p>
                
                <div className="text-xs text-rose-200/70">
                  <p>Создано: {selectedImage.timestamp.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
