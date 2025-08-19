import React from 'react';
import { Sparkles, Crown, ArrowLeft } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

interface PremiumModelsProps {
  hasAccess: boolean;
  onRequirePremium: () => void;
  onBack?: () => void;
}

const models = [
  {
    id: 'gisele-001',
    title: 'Gisele Classic',
    cover: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    tags: ['glamour', 'editorial', 'classic']
  },
  {
    id: 'irina-002',
    title: 'Irina Noir',
    cover: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    tags: ['noir', 'mystery', 'luxury']
  },
  {
    id: 'adriana-003',
    title: 'Adriana Velvet',
    cover: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    tags: ['velvet', 'evening', 'sensual']
  },
  {
    id: 'bella-004',
    title: 'Bella Muse',
    cover: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    tags: ['modern', 'runway', 'bold']
  },
  {
    id: 'emily-005',
    title: 'Emily Silk',
    cover: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    tags: ['silk', 'soft light', 'romance']
  },
  {
    id: 'margot-006',
    title: 'Margot Rose',
    cover: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600&h=800&fit=crop',
    tags: ['rose', 'vintage', 'cinematic']
  }
];

const PremiumModels: React.FC<PremiumModelsProps> = ({ hasAccess, onRequirePremium, onBack }) => {
  const { setModel, hapticFeedback } = useTelegram();

  const handleSelect = (id: string, title: string) => {
    if (!hasAccess) {
      onRequirePremium();
      return;
    }
    hapticFeedback('light');
    setModel(id, title);
    alert(`Модель "${title}" отправлена в бота. Откройте чат для подтверждения.`);
  };

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="mr-2 inline-flex items-center px-3 py-2 rounded-xl bg-black/40 border border-rose-300/20 text-rose-100 hover:bg-black/60 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Назад
        </button>
        <h1 className="text-xl font-bold text-rose-100 flex items-center">
          <Crown className="w-5 h-5 mr-2 text-amber-300" /> Премиум 18+ модели
        </h1>
      </div>

      {!hasAccess && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-100">
          Для установки моделей требуется премиум. Нажмите на любую кнопку «Установить в боте», чтобы оформить доступ.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {models.map(m => (
          <div key={m.id} className="relative bg-black/40 border border-rose-200/20 rounded-2xl overflow-hidden shadow-xl">
            <div className="aspect-[3/4] overflow-hidden">
              <img src={m.cover} alt={m.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <div className="text-rose-100 font-semibold text-sm mb-1">{m.title}</div>
              <div className="text-rose-200/70 text-[11px] mb-3">{m.tags.join(' • ')}</div>
              <button
                onClick={() => handleSelect(m.id, m.title)}
                className={`w-full py-2 px-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition ${
                  hasAccess
                    ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500'
                    : 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Установить в боте
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PremiumModels;
