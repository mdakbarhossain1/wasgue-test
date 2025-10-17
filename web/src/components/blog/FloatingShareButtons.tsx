interface FloatingShareButtonsProps {
  url: string;
  title: string;
}

export default function FloatingShareButtons({ url, title }: FloatingShareButtonsProps) {
  const shareLinks = [
    {
      name: 'Twitter',
      icon: '𝕏',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      color: 'hover:bg-black'
    },
    {
      name: 'Facebook',
      icon: 'f',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'hover:bg-blue-600'
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
      color: 'hover:bg-blue-700'
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
      color: 'hover:bg-green-600'
    }
  ];

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 z-40">
      <div className="bg-white/80 backdrop-blur-xl rounded-full p-2 shadow-2xl border border-white/50">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-white transition-all duration-300 mb-2 last:mb-0 ${link.color}`}
            title={`Share on ${link.name}`}
          >
            <span className="font-bold">{link.icon}</span>
          </a>
        ))}
      </div>
      <div className="text-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-full px-3 py-2 shadow-lg border border-white/50">
          <span className="text-xs font-medium text-gray-600">SHARE</span>
        </div>
      </div>
    </div>
  );
}

