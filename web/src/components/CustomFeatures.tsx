const parbenFree = "/figma/icon-parben-free.svg";
const microPlastics = "/figma/icon-micro-plastics.svg";
const biodegradable = "/figma/icon-biodegradable-white.svg";
const vegan = "/figma/icon-vegan-white.svg";

export default function Features() {
  const items = [
    { label: "No Parabens", icon: parbenFree },
    { label: "No Micro Plastics", icon: microPlastics },
    { label: "Biodegradable", icon: biodegradable },
    { label: "100% Vegan", icon: vegan },
  ];

  return (
    <div className="w-full bg-[#814E1E]">
      <div className="px-4 py-3 max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-6">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-white">
              <div className="w-10 h-10 flex items-center justify-center">
                <img
                  width={100}
                  height={100}
                  src={item.icon}
                  alt={item.label}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-lg font-normal leading-snug text-center">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
