import Link from 'next/link';

export default function BlogPostNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] relative overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#e9c356]/20 to-transparent rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-[#1d1d1d]/10 to-transparent rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-[#e9c356]/5 via-transparent to-[#e9c356]/5 rounded-full blur-3xl animate-spin-slow"></div>
      </div>

      {/* 404 Content */}
      <div className="relative z-10 text-center px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/50 max-w-2xl mx-auto">
          {/* Animated 404 */}
          <div className="mb-8">
            <h1 className="text-8xl md:text-9xl font-bold relative inline-block">
              <span className="bg-gradient-to-r from-[#1d1d1d] via-[#e9c356] to-[#1d1d1d] bg-clip-text text-transparent animate-gradient-x">404</span>
              <div className="absolute -inset-4 bg-gradient-to-r from-[#e9c356]/20 via-transparent to-[#e9c356]/20 blur-2xl animate-pulse"></div>
            </h1>
          </div>

          {/* Error message */}
          <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1d] mb-4">
            Blog artikel niet gevonden
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Het artikel dat je zoekt bestaat niet meer of is verplaatst. 
            Maar geen zorgen, we hebben nog veel andere interessante artikelen!
          </p>

          {/* Search suggestion */}
          <div className="bg-[#F8F6F0]/50 backdrop-blur-sm rounded-2xl p-6 mb-8">
            <p className="text-sm font-medium text-gray-700 mb-3">Probeer te zoeken:</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <span className="px-4 py-2 bg-white rounded-full text-sm shadow-md">Wastips</span>
              <span className="px-4 py-2 bg-white rounded-full text-sm shadow-md">Duurzaamheid</span>
              <span className="px-4 py-2 bg-white rounded-full text-sm shadow-md">Geuren</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/blogs"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#1d1d1d] to-[#333333] text-white rounded-full font-semibold shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Naar blog overzicht
            </Link>
            
            <Link 
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/80 backdrop-blur-lg text-[#1d1d1d] rounded-full font-semibold shadow-lg hover:shadow-2xl border border-gray-200 transform hover:scale-105 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Naar homepage
            </Link>
          </div>

          {/* Fun element */}
          <div className="mt-12 text-center">
            <div className="inline-block p-4 bg-[#e9c356]/10 rounded-full">
              <span className="text-4xl animate-bounce inline-block">🔍</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Blijf zoeken, er valt zoveel te ontdekken!</p>
          </div>
        </div>
      </div>

    </div>
  );
}
