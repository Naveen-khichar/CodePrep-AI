import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full glass-panel border-t border-custom mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gradient tracking-wide text-sm">CodePrep AI</span>
          <span className="text-gray-500 text-xs">| Interactive Coding Academy</span>
        </div>
        <p className="text-gray-400 text-xs order-last md:order-none">
          &copy; {new Date().getFullYear()} CodePrep AI. Designed for elite SDE interview preparation.
        </p>
        <div className="flex gap-6 text-xs text-gray-400">
          <Link href="/problems" className="hover:text-white transition">Problems</Link>
          <a href="#" className="hover:text-white transition">Privacy Policy</a>
          <a href="#" className="hover:text-white transition">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
