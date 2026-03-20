'use client';

export default function Error({ error, reset }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md w-full">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
