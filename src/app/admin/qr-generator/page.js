'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'

export default function QRGenerator() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true })
      
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRURL = (productId) => {
    return `${window.location.origin}/qr/${productId}`
  }

  const generateQRCodeURL = (productId) => {
    const url = generateQRURL(productId)
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
  }

  const downloadQRCode = (productId, productName) => {
    const qrImageURL = generateQRCodeURL(productId)
    const link = document.createElement('a')
    link.href = qrImageURL
    link.download = `QR_${productName.replace(/\s+/g, '_')}_${productId}.png`
    link.click()
  }

  const printQRCode = (product) => {
    const qrImageURL = generateQRCodeURL(product.id)
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Kod - ${product.name}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px;
            margin: 0;
          }
          .qr-container {
            border: 2px solid #059669;
            border-radius: 10px;
            padding: 20px;
            display: inline-block;
            margin: 20px;
          }
          .product-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #047857;
          }
          .product-id {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 15px;
          }
          .qr-code {
            margin: 10px 0;
          }
          .instructions {
            font-size: 12px;
            color: #6B7280;
            margin-top: 10px;
            max-width: 300px;
          }
          @media print {
            .no-print { display: none; }
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="product-name">${product.name}</div>
          <div class="product-id">Ürün ID: ${product.id}</div>
          <div class="qr-code">
            <img src="${qrImageURL}" alt="QR Code" width="200" height="200" />
          </div>
          <div class="instructions">
            Bu QR kodu telefonunuzla okutarak<br>
            hızlıca rezervasyon yapabilirsiniz
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  const downloadAllQRCodes = () => {
    products.forEach((product, index) => {
      setTimeout(() => {
        downloadQRCode(product.id, product.name)
      }, index * 500) // Her QR kodu arasında 500ms bekle
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-emerald-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500 p-3 rounded-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4M12 12H8m4 0V8m0 0H8m4 0h4"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">QR Kod Generator</h1>
                <p className="text-gray-600">Ürünler için QR kodları oluştur</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={downloadAllQRCodes}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Tümünü İndir
              </button>
              <a
                href="/admin"
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Admin Paneli
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Nasıl Kullanılır?</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <span className="text-emerald-600 font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">QR Kod Oluştur</h3>
                <p className="text-gray-600">Her ürün için QR kod oluştur ve yazdır</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <span className="text-emerald-600 font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Ürüne Yapıştır</h3>
                <p className="text-gray-600">QR kodları fiziksel ürünlerin üzerine yapıştır</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-emerald-100 p-2 rounded-full">
                <span className="text-emerald-600 font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Müşteri Tarar</h3>
                <p className="text-gray-600">Müşteriler telefon kamerası ile okutup rezervasyon yapar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <img src={product.image} alt={product.name} className="w-full h-32 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-4">ID: {product.id} | {product.category}</p>
                
                {/* QR Code Preview */}
                <div className="text-center mb-4">
                  <img 
                    src={generateQRCodeURL(product.id)} 
                    alt={`QR Code for ${product.name}`}
                    className="w-24 h-24 mx-auto border border-gray-200 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {generateQRURL(product.id)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => printQRCode(product)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm"
                  >
                    🖨️ Yazdır
                  </button>
                  <button
                    onClick={() => downloadQRCode(product.id, product.name)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-sm"
                  >
                    💾 İndir
                  </button>
                  <a
                    href={generateQRURL(product.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors text-center text-sm"
                  >
                    👁️ Test Et
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Henüz ürün bulunamadı.
          </div>
        )}
      </div>
    </div>
  )
}