'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function DepoTakip() {
  const [products, setProducts] = useState([])
  const [reservations, setReservations] = useState([])
  const [currentProduct, setCurrentProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Filtre state'leri
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [stockFilter, setStockFilter] = useState('')
  
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
      showErrorMessage('Ürünler yüklenemedi!')
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

  // Verileri yükle
  useEffect(() => {
    loadProducts()
    loadReservations()
  }, [])

  // Rezervasyon sayısını hesapla
  const getReservedCount = (productId) => {
    return reservations
      .filter(r => r.product_id === productId)
      .reduce((total, r) => total + r.quantity, 0)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || product.category === categoryFilter
    const reservedCount = getReservedCount(product.id)
    const availableStock = product.stock - reservedCount
    
    let matchesStock = true
    if (stockFilter === 'available') matchesStock = availableStock > 5
    else if (stockFilter === 'low') matchesStock = availableStock > 0 && availableStock <= 5
    else if (stockFilter === 'out') matchesStock = availableStock === 0

    return matchesSearch && matchesCategory && matchesStock
  })

  const openReservationModal = (product) => {
    setCurrentProduct(product)
    setIsModalOpen(true)
    setFormData({
      customerName: '',
      customerPhone: '',
      customerUnit: '',
      otherUnitText: '',
      pickupDate: '',
      returnDate: '',
      quantity: 1
    })
  }

  const handleReservation = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const reservedCount = getReservedCount(currentProduct.id)
      const availableStock = currentProduct.stock - reservedCount

      if (formData.quantity > availableStock) {
        showErrorMessage(`Yeterli stok yok! Maksimum ${availableStock} adet rezerve edebilirsiniz.`)
        return
      }

      const finalUnit = formData.customerUnit === 'Diğer' ? formData.otherUnitText : formData.customerUnit

      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          product_id: currentProduct.id,
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
        const emailResponse = await fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerUnit: finalUnit,
            productName: currentProduct.name,
            quantity: formData.quantity,
            pickupDate: formData.pickupDate,
            returnDate: formData.returnDate,
            reservationId: data[0].id
          }),
        })

        if (emailResponse.ok) {
          console.log('Email başarıyla gönderildi')
        } else {
          console.error('Email gönderme hatası')
        }
      } catch (emailError) {
        console.error('Email API hatası:', emailError)
        // Email hatası rezervasyonu etkilemez
      }

      showSuccessMessage('Rezervasyon başarıyla oluşturuldu!')
      setIsModalOpen(false)
      loadReservations() // Rezervasyonları yeniden yükle
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

  // Mesaj gösterme fonksiyonları (basitleştirilmiş)
  const showSuccessMessage = (message) => {
    alert(`✅ ${message}`)
  }

  const showErrorMessage = (message) => {
    alert(`❌ ${message}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-3 rounded-lg shadow-md">
                <img src="/ig_transparan.png" alt="Logo" className="w-12 h-12 object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">İyiliğin Geleceği Depo Ürün Envanteri</h1>
                <p className="text-gray-600">Ürün Rezervasyon Sistemi</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <input 
                type="text" 
                placeholder="Ürün ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-black"
              />
            </div>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-black"
            >
              <option value="">Tüm Kategoriler</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Giyim">Giyim</option>
              <option value="Ev & Yaşam">Ev & Yaşam</option>
              <option value="Spor">Spor</option>
            </select>
            <select 
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-black"
            >
              <option value="">Tüm Stoklar</option>
              <option value="available">Stokta Var</option>
              <option value="low">Az Stok</option>
              <option value="out">Stokta Yok</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const reservedCount = getReservedCount(product.id)
            const availableStock = product.stock - reservedCount
            const stockStatus = availableStock === 0 ? 'out' : availableStock <= 5 ? 'low' : 'available'
            const stockColor = stockStatus === 'out' ? 'text-red-600' : stockStatus === 'low' ? 'text-yellow-600' : 'text-green-600'
            const stockBg = stockStatus === 'out' ? 'bg-red-100' : stockStatus === 'low' ? 'bg-yellow-100' : 'bg-green-100'

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all duration-300">
                <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-black">{product.name}</h3>
                    <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded-full">{product.category}</span>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-black mb-3">{product.description || 'Bu ürün için açıklama mevcut değil.'}</p>
                    <div className="flex justify-between items-center">
                      <div className={`text-sm ${stockColor} font-semibold`}>
                        {availableStock > 0 ? `${availableStock} adet` : 'Stokta Yok'}
                      </div>
                      {reservedCount > 0 && (
                        <div className="text-xs text-gray-500">{reservedCount} rezerve</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-3 py-1 rounded-full ${stockBg} ${stockColor}`}>
                      {stockStatus === 'out' ? 'Stokta Yok' : stockStatus === 'low' ? 'Az Stok' : 'Stokta Var'}
                    </span>
                    <button 
                      onClick={() => openReservationModal(product)}
                      disabled={availableStock === 0}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        availableStock === 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {availableStock === 0 ? 'Stokta Yok' : 'Rezerve Et'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
                <img src={currentProduct?.image} alt={currentProduct?.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                <h4 className="text-xl font-semibold mb-4 text-gray-800">{currentProduct?.name}</h4>
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
                    max={currentProduct ? currentProduct.stock - getReservedCount(currentProduct.id) : 1}
                    className="w-20 text-center px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors text-gray-800"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const maxStock = currentProduct.stock - getReservedCount(currentProduct.id)
                      setFormData({...formData, quantity: Math.min(maxStock, formData.quantity + 1)})
                    }}
                    className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors text-gray-800"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600">
                    (Maksimum: {currentProduct ? currentProduct.stock - getReservedCount(currentProduct.id) : 0})
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