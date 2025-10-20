"use client";

export default function ComparisonTable() {
  const features = [
    "Long-Lasting Fragrance",
    "Premium Scent Quality",
    "Eco-Friendly & Paraben-Free",
    "No Waxy or Sticky Residue",
    "Safe For All Fabrics & Machines",
  ];

  const CheckIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="29"
      viewBox="0 0 28 29"
      fill="none"
    >
      <path
        d="M28 14.8901C28 22.6221 21.732 28.8901 14 28.8901C6.26801 28.8901 0 22.6221 0 14.8901C0 7.15815 6.26801 0.890137 14 0.890137C21.732 0.890137 28 7.15815 28 14.8901ZM21.0531 9.58706C20.5405 9.0745 19.7095 9.0745 19.1969 9.58706L13.0854 17.3694L9.42178 13.7058C8.90922 13.1932 8.07819 13.1932 7.56563 13.7058C7.05307 14.2183 7.05307 15.0494 7.56563 15.5619L12.1969 20.1932C12.7095 20.7058 13.5405 20.7058 14.0531 20.1932L21.0717 11.4242C21.5656 10.9103 21.5593 10.0933 21.0531 9.58706Z"
        fill="#FCCE4E"
      />
    </svg>
  );

  const CrossIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="29"
      viewBox="0 0 28 29"
      fill="none"
    >
      <path
        d="M28 14.8901C28 22.6221 21.732 28.8901 14 28.8901C6.26801 28.8901 0 22.6221 0 14.8901C0 7.15815 6.26801 0.890137 14 0.890137C21.732 0.890137 28 7.15815 28 14.8901ZM9.36872 9.02142C9.02701 8.67971 8.47299 8.67971 8.13128 9.02142C7.78957 9.36313 7.78957 9.91715 8.13128 10.2589L12.7626 14.8901L8.13128 19.5214C7.78957 19.8631 7.78957 20.4171 8.13128 20.7589C8.47299 21.1006 9.02701 21.1006 9.36872 20.7589L14 16.1276L18.6313 20.7589C18.973 21.1006 19.527 21.1006 19.8687 20.7589C20.2104 20.4171 20.2104 19.8631 19.8687 19.5214L15.2374 14.8901L19.8687 10.2589C20.2104 9.91715 20.2104 9.36313 19.8687 9.02142C19.527 8.67971 18.973 8.67971 18.6313 9.02142L14 13.6527L9.36872 9.02142Z"
        fill="#212529"
        fillOpacity="0.8"
      />
    </svg>
  );

  return (
    <div className="px-4 py-3 max-w-7xl mx-auto sm:px-6 lg:px-8 my-12">
      <h2 className="font-['EB_Garamond'] font-semibold  text-[28px] md:text-[40px] mb-6 mt-2  text-[#814e1e] text-center leading-[1.2]">
        Beyond Fabric Softener
      </h2>

      {/* ✅ Rounded wrapper + inside borders fixed */}
      <div className="overflow-x-auto rounded-xl border border-[#D6AD6166] overflow-hidden">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="p-4 text-left text-lg font-semibold bg-white w-1/3 border border-[#D6AD6166]">
                Feature
              </th>
              <th className="p-4 text-center text-lg font-semibold bg-[#FCCE4E33] w-1/3 text-[#212529] border border-[#D6AD6166]">
                Us
              </th>
              <th className="p-4 text-center text-lg font-semibold bg-[#D6AD611A] w-1/3 text-[#212529] border border-[#D6AD6166]">
                Them
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={index}>
                <td className="md:p-4 p-2 text-gray-800 font-medium bg-white text-left border border-[#D6AD6166]">
                  {feature}
                </td>
                <td className="md:p-4 p-2 bg-[#FCCE4E33] h-20 border border-[#D6AD6166]">
                  <div className="flex justify-center items-center h-full">
                    <CheckIcon />
                  </div>
                </td>
                <td className="md:p-4 p-2 bg-[#D6AD611A] h-20 border border-[#D6AD6166]">
                  <div className="flex justify-center items-center h-full">
                    <CrossIcon />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
