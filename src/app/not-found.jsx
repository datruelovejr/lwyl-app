import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md w-full">
        <div className="text-5xl font-bold text-gray-200 mb-4">404</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Page not found
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
