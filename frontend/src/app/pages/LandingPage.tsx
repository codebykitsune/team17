import { HeroSection } from '../components/HeroSection';
import { HowItWorks } from '../components/HowItWorks';
import { Features } from '../components/Features';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🍽️</span>
            </div>
            <div>
              <h1 className="text-xl text-gray-900">ミートアンドイート</h1>
              <p className="text-xs text-gray-500">Meet and Eat</p>
            </div>
          </div>
          <nav className="hidden md:flex gap-8 text-sm">
            <a href="#how-it-works" className="text-gray-600 hover:text-orange-600 transition-colors">
              使い方
            </a>
            <a href="#features" className="text-gray-600 hover:text-orange-600 transition-colors">
              特徴
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        <HeroSection />
        <div id="how-it-works">
          <HowItWorks />
        </div>
        <div id="features">
          <Features />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg mb-4">ミートアンドイート</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                位置情報を使って中間地点のレストランを自動提案する、ログイン不要のイベント調整サービスです。
              </p>
            </div>
            <div>
              <h4 className="text-sm mb-4 text-gray-300">使用技術</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Google Routes API</li>
                <li>ホットペッパーAPI</li>
                <li>Compute Route Matrix Pro</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm mb-4 text-gray-300">サービスについて</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                幹事の負担を減らし、みんなが集まりやすい場所で楽しい時間を過ごすためのツールです。
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm text-gray-500">
            © 2024 ミートアンドイート. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}