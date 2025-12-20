import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export function HeroSection() {
  const [eventName, setEventName] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [participants, setParticipants] = useState(2);
  const navigate = useNavigate();

  const handleCreateEvent = async () => {
    if (!eventName.trim() || !organizerName.trim()) {
      alert("名前とイベント名を入力してください");
      return;
    }
  
    try {
      // 1. events テーブルに挿入
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([
          { 
            name: eventName, 
            amount: participants,
            hash: Math.random().toString(36).substring(2, 10) 
          }
        ])
        .select()
        .single();
  
      if (eventError) throw eventError;
  
      // 2. users テーブルに挿入し、作成されたデータを取得する
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            event_id: eventData.id,
            name: organizerName,
            role: 'organizer'
          }
        ])
        .select() // ここで挿入後のデータを取得
        .single(); // 1件として取得
  
      if (userError) throw userError;
  
      alert('イベントを作成しました！');
      
      // 3. 次のページへ遷移（state に ID を持たせる）
      navigate(`/admin?hash=${eventData.hash}`, { 
        state: { 
          eventId: eventData.id, 
          userId: userData.id 
        } 
      });
  
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(`作成に失敗しました: ${error.message}`);
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
          </div>

          <Card className="p-8 shadow-xl border-0 bg-white">
            <h2 className="text-2xl mb-6 text-gray-900">イベントを作成</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2 text-gray-700">あなたの名前</label>
                <Input
                  type="text"
                  placeholder="例：山田太郎"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full h-12"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">イベント名</label>
                <Input
                  type="text"
                  placeholder="例：チーム忘年会"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full h-12"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">参加人数</label>
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={decrementParticipants} className="h-12 w-12">
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-3xl text-gray-900">{participants}</span>
                    <span className="text-sm text-gray-500 ml-1">人</span>
                  </div>
                  <Button variant="outline" size="icon" onClick={incrementParticipants} className="h-12 w-12">
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleCreateEvent}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white text-lg"
              >
                イベントを作成
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}