// frontend/src/app/components/Restaurante.tsx
import React, { useEffect, useState } from 'react';

interface Shop {
  id: string;
  name: string;
  address: string;
  genre: {
    name: string;
  }
  urls:{
    pc: string;
  };
}

const Restaurant = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        // キーワードを具体的に渡して「30件制限」を回避します

        const response = await fetch('http://localhost:3001/api/restaurants');
        const data = await response.json();
        
        if (response.ok) {
          setShops(data);
        } else {
          // バックエンドから返ってきたエラーメッセージを表示
          setError(data.message);
        }
      } catch (err) {
        setError("通信に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div className="text-red-500 font-bold">エラー: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {shops.map((shop) => (
        <div key={shop.id} className="border rounded-lg p-4 shadow-md bg-white">
          <h2 className="text-xl font-bold mb-2">{shop.name}</h2>
          <p className="text-gray-700">📍 住所: {shop.address}</p>
          <p className="text-gray-700 font-medium">🍴 ジャンル: {shop.genre?.name}</p>
          <p className="text-gray-700 font-medium">🍴 URL: {shop.urls?.pc}</p>
        </div>
      ))}
    </div>
  );
};

export default Restaurant;