import USPStripNew from "components/sections/USPStripNew";
import ResponsiveInit from "components/ResponsiveInit";

export default function ResponsiveTestPage() {
  return (
    <>
      <ResponsiveInit />
      <main className="min-h-screen">
        <h1 className="text-2xl font-bold p-4 text-center">
          Responsive USP Strip Test
        </h1>
        <p className="text-center mb-8">
          Resize your browser to see how the component responds to different
          screen sizes
        </p>

        <USPStripNew />
      </main>
    </>
  );
}
