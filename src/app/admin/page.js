'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [reservations, setReservations] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')

  // Basit admin şifre kontrolü
  const ADMIN_PASSWORD = 'admin123' // Gerçek projede environment variable kullan

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      loadData()
    } else {
      alert('Yanlış şifre!')
    }
  }

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadReservations(), loadProducts()])
    setLoading(false)
  }

  const loadReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })
      
      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error('Rezervasyonlar yüklenirken hata:', error)
    }
  }

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
      
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error)
    }
  }

  const updateReservationStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) throw error
      
      // Local state'i güncelle
      setReservations(reservations.map(r => 
        r.id === id ? { ...r, status: newStatus } : r
      ))
      
      alert('Durum başarıyla güncellendi!')
    } catch (error) {
      console.error('Durum güncellenirken hata:', error)
      alert('Hata oluştu!')
    }
  }

  const deleteReservation = async (id) => {
    if (!confirm('Bu rezervasyonu silmek istediğinizden emin misiniz?')) return
    
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setReservations(reservations.filter(r => r.id !== id))
      alert('Rezervasyon silindi!')
    } catch (error) {
      console.error('Silme hatası:', error)
      alert('Hata oluştu!')
    }
  }

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId)
    return product ? product.name : 'Bilinmeyen Ürün'
  }

  const exportToCSV = () => {
    const csvContent = [
      ['ID', 'Ürün', 'Müşteri', 'Telefon', 'Birim', 'Miktar', 'Teslim Alma', 'Teslim Etme', 'Durum', 'Oluşturma Tarihi'],
      ...filteredReservations.map(r => [
        r.id,
        getProductName(r.product_id),
        r.customer_name,
        r.customer_phone,
        r.customer_unit,
        r.quantity,
        r.pickup_date,
        r.return_date,
        r.status,
        new Date(r.created_at).toLocaleDateString('tr-TR')
      ])
    ].map(row => row.join(',').replace(/,/g, ';')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rezervasyonlar_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Filtreleme
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customer_phone.includes(searchTerm) ||
      getProductName(reservation.product_id).toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || reservation.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Giriş yapmadıysa login formu göster
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Girişi</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                placeholder="Admin şifresini girin"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
            >
              Giriş Yap
            </button>
          </form>
          <p className="text-sm text-gray-500 mt-4 text-center">
            Demo şifre: admin123
          </p>
        </div>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Panel</h1>
                <p className="text-gray-600">Rezervasyon Yönetimi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-100 px-4 py-2 rounded-lg">
                <span className="text-emerald-800 font-semibold">
                  Toplam: {filteredReservations.length}
                </span>
              </div>
              <a
                href="/admin/qr-generator"
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                QR Kodlar
              </a>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-64">
                <input
                  type="text"
                  placeholder="Müşteri, telefon veya ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
              >
                <option value="">Tüm Durumlar</option>
                <option value="Aktif">Aktif</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="İptal">İptal</option>
              </select>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                  loadReservations()
                }}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-colors"
              >
                <option value="created_at-desc">En Yeni</option>
                <option value="created_at-asc">En Eski</option>
                <option value="pickup_date-asc">Teslim Tarihi (Yakın)</option>
                <option value="customer_name-asc">Müşteri Adı (A-Z)</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Yenile
              </button>
              <button
                onClick={exportToCSV}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Excel İndir
              </button>
            </div>
          </div>
        </div>

        {/* Reservations Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-xl font-semibold text-gray-700">Yükleniyor...</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Ürün</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Müşteri</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Telefon</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Birim</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Miktar</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Teslim Alma</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Teslim Etme</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">Durum</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-800">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">#{reservation.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{getProductName(reservation.product_id)}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{reservation.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{reservation.customer_phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-32 truncate" title={reservation.customer_unit}>
                        {reservation.customer_unit}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">{reservation.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {new Date(reservation.pickup_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {new Date(reservation.return_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={reservation.status}
                          onChange={(e) => updateReservationStatus(reservation.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            reservation.status === 'Aktif' ? 'bg-blue-100 text-blue-800' :
                            reservation.status === 'Tamamlandı' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Tamamlandı">Tamamlandı</option>
                          <option value="İptal">İptal</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteReservation(reservation.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredReservations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Rezervasyon bulunamadı.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}