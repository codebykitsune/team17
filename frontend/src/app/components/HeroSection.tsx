import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Plus, Minus } from 'lucide-react';
import { LocationSearch, LocationData } from './LocationSearch';

export function HeroSection() {
  const [eventName, setEventName] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [participants, setParticipants] = useState(2);
  const [location, setLocation] = useState<LocationData | null>(null);

  const handleCreateEvent = () => {
    if (eventName.trim() && organizerName.trim()) {
      const locationMsg = location ? `\n場所：${location.name}` : '';
      alert(`イベント「${eventName}」を作成しました！\n幹事：${organizerName}さん\n参加人数：${participants}人${locationMsg}`);
    }
  };

  const incrementParticipants = () => {
    if (participants < 20) setParticipants(participants + 1);
  };

  const decrementParticipants = () => {
    if (participants > 1) setParticipants(participants - 1);
  };

  return (
    <section className="relative bg-gradient-to-b from-orange-50 to-white pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-6">
            <div className="inline-block px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm">
              ミートアンドイート
            </div>
            <h1 className="text-5xl tracking-tight text-gray-900">
              イベントの幹事、<br />もう悩まない
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              参加者全員の位置情報から中間地点を自動計算。最適なレストランを提案します。ログイン不要ですぐに使えます。
            </p>
            <div className="flex gap-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">無料で使える</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">リアルタイム検索</span>
              </div>
            </div>
          </div>

          {/* Right Column - Interactive Form */}
          <Card className="p-8 shadow-xl border-0 bg-white">
            <h2 className="text-2xl mb-6 text-gray-900">イベントを作成</h2>

            <div className="space-y-6">
              {/* Organizer Name Input */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  あなたの名前
                </label>
                <Input
                  type="text"
                  placeholder="例：山田太郎"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              {/* Location Search Input */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  あなたの出発地点（最寄り駅）
                </label>
                <LocationSearch
                  onSelect={setLocation}
                  placeholder="例：渋谷駅、新宿駅..."
                />
              </div>

              {/* Event Name Input */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  イベント名
                </label>
                <Input
                  type="text"
                  placeholder="例：チーム忘年会"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              {/* Number of Participants */}
              <div>
                <label className="block text-sm mb-2 text-gray-700">
                  参加人数
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={decrementParticipants}
                    className="h-12 w-12 border-gray-200 hover:border-orange-500 hover:text-orange-600"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl text-gray-900">{participants}</span>
                    <span className="text-sm text-gray-500 ml-1">人</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={incrementParticipants}
                    className="h-12 w-12 border-gray-200 hover:border-orange-500 hover:text-orange-600"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Create Event Button */}
              <Button
                onClick={handleCreateEvent}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white text-lg"
              >
                イベントを作成
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6 text-center">
              アカウント登録不要
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}