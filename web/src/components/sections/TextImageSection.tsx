import Image from 'next/image';

interface TextImageSectionProps {
  title: string;
  content: string;
  image?: string;
  imagePosition?: 'left' | 'right';
  backgroundColor?: string;
  imageAlt?: string;
  ctaText?: string;
  ctaLink?: string;
}

export default function TextImageSection({
  title,
  content,
  image,
  imagePosition = 'right',
  backgroundColor = '#FFFFFF',
  imageAlt = '',
  ctaText,
  ctaLink
}: TextImageSectionProps) {
  const isImageRight = imagePosition === 'right';

  return (
    <section className="py-16" style={{ backgroundColor }}>
      <div className="container mx-auto px-4">
        <div className={`grid md:grid-cols-2 gap-12 items-center ${isImageRight ? '' : 'md:flex-row-reverse'}`}>
          {/* Text Content */}
          <div className={`${isImageRight ? '' : 'md:order-2'}`}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-[#333333]">
              {title}
            </h2>
            
            <div 
              className="prose prose-lg max-w-none mb-8 text-[#333333]"
              dangerouslySetInnerHTML={{ __html: content }}
            />
            
            {ctaText && ctaLink && (
              <a
                href={ctaLink}
                className="inline-block px-8 py-3 rounded-full font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(90deg, #D6AD61 0%, #FCCE4E 100%)' }}
              >
                {ctaText}
              </a>
            )}
          </div>

          {/* Image */}
          {image && (
            <div className={`relative h-[400px] rounded-2xl overflow-hidden ${isImageRight ? '' : 'md:order-1'}`}>
              <Image
                src={image}
                alt={imageAlt || title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


