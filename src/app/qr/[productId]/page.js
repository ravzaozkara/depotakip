'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function QRProductPage() {
  const params = useParams()
  const productId = params.productId
  const [product, setProduct] = useState(null)
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Form state'leri
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerUnit: '',
    otherUnitText: '',
    pickupDate: '',
    returnDate: '',
    quantity: 1
  })

  useEffect(() => {
    loadProduct()
    loadReservations()
  }, [productId, loadProduct])

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
      
      if (error) throw error
      setProduct(data)
      setIsModalOpen(true) // QR okutunca modal otomatik açılsın
    } catch (error) {
      console.error('Ürün bulunamadı:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('status', 'Aktif')
      
      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error)
    }
  }

  const getReservedCount = (productId) => {
    return reservations
      .filter(r => r.product_id === parseInt(productId))
      .reduce((total, r) => total + r.quantity, 0)
  }

  const handleReservation = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const reservedCount = getReservedCount(productId)
      const availableStock = product.stock - reservedCount

      if (formData.quantity > availableStock) {
        showErrorMessage(`Yeterli stok yok! Maksimum ${availableStock} adet rezerve edebilirsiniz.`)
        return
      }

      const finalUnit = formData.customerUnit === 'Diğer' ? formData.otherUnitText : formData.customerUnit

      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          product_id: parseInt(productId),
          customer_name: formData.customerName,
          customer_phone: formData.customerPhone,
          customer_unit: finalUnit,
          quantity: formData.quantity,
          pickup_date: formData.pickupDate,
          return_date: formData.returnDate,
          status: 'Aktif'
        }])
        .select()

      if (error) throw error

      // Email bildirimini gönder
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerUnit: finalUnit,
            productName: product.name,
            quantity: formData.quantity,
            pickupDate: formData.pickupDate,
            returnDate: formData.returnDate,
            reservationId: data[0].id
          }),
        })
      } catch (emailError) {
        console.error('Email gönderme hatası:', emailError)
      }

      showSuccessMessage('Rezervasyon başarıyla oluşturuldu!')
      setIsModalOpen(false)
      
      // Ana sayfaya yönlendir
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
      
    } catch (error) {
      console.error('Rezervasyon hatası:', error)
      showErrorMessage('Rezervasyon oluşturulurken hata oluştu!')
    }
  }

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      showErrorMessage('Lütfen ad soyad alanını doldurunuz!')
      return false
    }
    if (!formData.customerPhone.trim()) {
      showErrorMessage('Lütfen telefon numaranızı giriniz!')
      return false
    }
    if (!formData.customerUnit) {
      showErrorMessage('Lütfen birim seçimi yapınız!')
      return false
    }
    if (formData.customerUnit === 'Diğer' && !formData.otherUnitText.trim()) {
      showErrorMessage('Lütfen birim adını yazınız!')
      return false
    }
    if (!formData.pickupDate) {
      showErrorMessage('Lütfen teslim alma tarihini seçiniz!')
      return false
    }
    if (!formData.returnDate) {
      showErrorMessage('Lütfen teslim etme tarihini seçiniz!')
      return false
    }
    return true
  }

  const showSuccessMessage = (message) => {
    alert(`✅ ${message}`)
  }

  const showErrorMessage = (message) => {
    alert(`❌ ${message}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Ürün yükleniyor...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Ürün Bulunamadı</h1>
          <p className="text-gray-600 mb-6">QR kod geçersiz veya ürün silinmiş olabilir.</p>
          <Link 
            href="/"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    )
  }

  const reservedCount = getReservedCount(productId)
  const availableStock = product.stock - reservedCount
  const stockStatus = availableStock === 0 ? 'out' : availableStock <= 5 ? 'low' : 'available'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-emerald-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500 p-3 rounded-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12h-4.01M12 12v4M12 12H8m4 0V8m0 0H8m4 0h4"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">QR Rezervasyon</h1>
              <p className="text-gray-600">Ürün Detayları</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Product Info */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <img src={product.image} alt={product.name} className="w-full h-64 object-cover" />
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{product.name}</h2>
              <span className="text-sm px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">{product.category}</span>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">{product.description || 'Bu ürün için açıklama mevcut değil.'}</p>
              <div className={`text-lg font-semibold ${
                stockStatus === 'out' ? 'text-red-600' : 
                stockStatus === 'low' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {availableStock > 0 ? `${availableStock} adet mevcut` : 'Stokta Yok'}
              </div>
              {reservedCount > 0 && (
                <div className="text-sm text-gray-500">{reservedCount} adet rezerve</div>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              disabled={availableStock === 0}
              className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                availableStock === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {availableStock === 0 ? 'Stokta Yok' : 'Rezervasyon Yap'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Rezervasyon Yap</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleReservation} className="space-y-4">
              <div>
                <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                <h4 className="text-lg font-semibold text-gray-800">{product.name}</h4>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Ad Soyad</label>
                <input 
                  type="text" 
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors text-gray-800" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Telefon</label>
                <input 
                  type="tel" 
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors text-gray-800" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Birim</label>
                <select 
                  value={formData.customerUnit}
                  onChange={(e) => setFormData({...formData, customerUnit: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors text-gray-800" 
                  required
                >
                  <option value="">Birim Seçiniz</option>
                  <option value="İstanbul Genel Merkez - Üniversite">İstanbul Genel Merkez - Üniversite</option>
                  <option value="İstanbul Genel Merkez - Teşkilat">İstanbul Genel Merkez - Teşkilat</option>
                  <option value="İstanbul Genel Merkez - Psikososyal">İstanbul Genel Merkez - Psikososyal</option>
                  <option value="İstanbul Genel Merkez - Eğitim">İstanbul Genel Merkez - Eğitim</option>
                  <option value="Genel Merkez - Eğitim">Genel Merkez - Eğitim</option>
                  <option value="İstanbul Genel Merkez - Sosyal Faaliyet">İstanbul Genel Merkez - Sosyal Faaliyet</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              
              {formData.customerUnit === 'Diğer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Birim Adını Yazınız</label>
                  <input 
                    type="text" 
                    value={formData.otherUnitText}
                    onChange={(e) => setFormData({...formData, otherUnitText: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors text-gray-800" 
                    placeholder="Birim adını yazınız..."
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Teslim Alma Tarihi</label>
                  <input 
                    type="date" 
                    value={formData.pickupDate}
                    onChange={(e) => setFormData({...formData, pickupDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors text-gray-800" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Teslim Etme Tarihi</label>
                  <input 
                    type="date" 
                    value={formData.returnDate}
                    onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                    min={formData.pickupDate ? new Date(new Date(formData.pickupDate).getTime() + 24*60*60*1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors text-gray-800" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Miktar</label>
                <div className="flex items-center space-x-3">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})}
                    className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors text-gray-800"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    min="1" 
                    max={availableStock}
                    className="w-20 text-center px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors text-gray-800"
                  />
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, quantity: Math.min(availableStock, formData.quantity + 1)})}
                    className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors text-gray-800"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600">
                    (Maksimum: {availableStock})
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                >
                  Rezerve Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}