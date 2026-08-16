import Link from 'next/link';
import ProductCard from '../components/ui/ProductCard';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-orange-600 mb-2">
            🍽️ Sajian Sematang
          </h1>
          <p className="text-gray-600">Platform Tempahan Makanan</p>
        </header>

        <div className="max-w-4xl mx-auto">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Selamat Datang!</h2>
            <p className="text-gray-700 mb-4">
              Sajian Sematang membolehkan anda melihat menu makanan daripada peniaga dan membuat tempahan dengan mudah.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md border-2 border-orange-200">
              <h3 className="text-xl font-semibold mb-3 text-orange-600">👥 Pelanggan</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Lihat menu dari pelbagai peniaga</li>
                <li>✓ Buat tempahan dengan mudah</li>
                <li>✓ Antaramuka mesra peranti mudah alih</li>
              </ul>
              <Link href="/sellers">
                <button className="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">
                  Lihat Menu
                </button>
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border-2 border-purple-200">
              <h3 className="text-xl font-semibold mb-3 text-purple-600">📅 Pre-Order Khas</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Pilih tarikh & masa penghantaran</li>
                <li>✓ Pesanan pukal untuk majlis/event</li>
                <li>✓ Catatan khas untuk peniaga</li>
              </ul>
              <Link href="/preorder">
                <button className="mt-4 w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition">
                  Pre-Order Sekarang
                </button>
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contoh Produk</h2>
            <ProductCard product={{ id: '1', name: 'Nasi Lemak Special', description: 'Nasi lemak dengan ayam berempah, sambal dan telur', price: 8.50 }} />
          </section>
        </div>
      </div>
    </main>
  );
}
