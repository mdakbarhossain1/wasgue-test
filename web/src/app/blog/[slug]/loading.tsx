export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-[#e9c356]/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-[#1d1d1d]/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '500ms' }}></div>
      </div>

      {/* Header skeleton */}
      <div className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="w-32 h-10 bg-gray-200/50 rounded-full mb-8 animate-pulse mx-auto"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200/50 rounded-lg animate-pulse max-w-3xl mx-auto"></div>
            <div className="h-12 bg-gray-200/50 rounded-lg animate-pulse max-w-2xl mx-auto"></div>
          </div>
          <div className="flex justify-center gap-8 mt-8">
            <div className="w-40 h-10 bg-gray-200/50 rounded-full animate-pulse"></div>
            <div className="w-40 h-10 bg-gray-200/50 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-8 md:p-12 shadow-2xl border border-white/50">
            {/* Breadcrumb skeleton */}
            <div className="w-64 h-12 bg-gray-200/50 rounded-full mb-12 animate-pulse"></div>
            
            {/* Article skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-gray-200/50 rounded animate-pulse"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200/50 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200/50 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200/50 rounded animate-pulse max-w-[90%]"></div>
              </div>
              
              <div className="h-64 bg-gray-200/50 rounded-xl animate-pulse my-8"></div>
              
              <div className="h-8 bg-gray-200/50 rounded animate-pulse max-w-[70%]"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200/50 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200/50 rounded animate-pulse max-w-[95%]"></div>
                <div className="h-4 bg-gray-200/50 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200/50 rounded animate-pulse max-w-[85%]"></div>
              </div>
              
              <div className="h-48 bg-gray-200/50 rounded-xl animate-pulse my-8"></div>
              
              <div className="space-y-3">
                <div className="h-4 bg-gray-200/50 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200/50 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200/50 rounded animate-pulse max-w-[80%]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading animation */}
      <div className="fixed bottom-8 right-8 bg-white/90 backdrop-blur-xl rounded-full p-4 shadow-2xl border border-white/50">
        <div className="flex items-center gap-3">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-[#e9c356] rounded-full animate-spin"></div>
          </div>
          <span className="text-sm font-medium text-gray-600">Artikel laden...</span>
        </div>
      </div>
    </div>
  );
}
