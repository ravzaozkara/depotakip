'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function UpdateProducts() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // New products data
  const newProducts = [
    {
      id: 1,
      name: 'AKRILIK BOYA SETI',
      category: 'Boya',
      description: 'Renk Renk Profesyonel Akrilik Boya Seti',
      stock: 10,
      price: 50, // Adding price for compatibility
      image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 2,
      name: 'İLAHI SÖYLEYEN BALIK',
      category: 'Diğer',
      description: 'Namı diğer Abdülhey. Uslu balık dans ediyor sınırlı sayıda en yüksek teklifi verene verilecektir. Ölücüler yazmasın',
      stock: 1,
      price: 999,
      image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 3,
      name: 'TÜM İSTANBULDA OLAN O ROZET',
      category: 'Rozet',
      description: 'Gönüllü buluşmanıza fark katacak o rozetler',
      stock: 10,
      price: 5,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc81?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 4,
      name: 'TÜM İSTANBULDA OLAN O ROZET 2',
      category: 'Rozet',
      description: 'Premium gönüllülere verilecektir',
      stock: 10,
      price: 10,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc81?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 5,
      name: 'TOMBUL MUM',
      category: 'Mum',
      description: 'Mum boyama için pleksi mum',
      stock: 10,
      price: 15,
      image: 'https://images.unsplash.com/photo-1602607135297-8dc90b5b4585?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 6,
      name: 'ORTAYA KARIŞIK',
      category: 'Boya',
      description: 'Little little on the middle',
      stock: 10,
      price: 25,
      image: 'https://images.unsplash.com/photo-1596638787647-904d822d751e?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 7,
      name: 'ZENGİN KALEMLERİ',
      category: 'Kalem',
      description: 'Kimseye vermiyoruz ısrar etmeyiniz',
      stock: 10,
      price: 30,
      image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 8,
      name: 'KEFİYE',
      category: 'Diğer',
      description: 'Çok isteyen Genç Atölyeden Satın alabilir yazmayınız',
      stock: 10,
      price: 20,
      image: 'https://images.unsplash.com/photo-1589308078059-be1415932272?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 9,
      name: 'AL GÖTÜR SET',
      category: 'Boya',
      description: 'Karşılıksız değildir uygun fiyatta rüşvete öncelik tanınarak verilir. Detaylı bilgi için DM',
      stock: 10,
      price: 35,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=60'
    },
    {
      id: 10,
      name: 'SERAMİK KİL',
      category: 'Kil',
      description: 'Poşetinden çıkarmaya üşendim anladınız siz',
      stock: 15,
      price: 40,
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=500&auto=format&fit=crop&q=60'
    }
  ]

  const updateProducts = async () => {
    setLoading(true)
    setMessage('')
    
    try {
      // First, delete all existing products
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .gte('id', 0) // Delete all records

      if (deleteError) {
        console.error('Error deleting existing products:', deleteError)
        setMessage(`Delete error: ${deleteError.message}`)
        setLoading(false)
        return
      }

      console.log('Existing products deleted successfully')

      // Insert new products
      const { data, error: insertError } = await supabase
        .from('products')
        .insert(newProducts)
        .select()

      if (insertError) {
        console.error('Error inserting new products:', insertError)
        setMessage(`Insert error: ${insertError.message}`)
        setLoading(false)
        return
      }

      console.log('Products updated successfully!')
      console.log('Inserted products:', data)
      setMessage(`✅ ${data.length} ürün başarıyla güncellendi!`)
      
    } catch (error) {
      console.error('Unexpected error:', error)
      setMessage(`Unexpected error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Try to add description column if it doesn't exist
  const addDescriptionColumn = async () => {
    setLoading(true)
    setMessage('Trying to add description column...')
    
    try {
      // This won't work directly from client, but we'll show the SQL
      setMessage(`
        To add description column, run this SQL in your Supabase SQL editor:
        
        ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
        
        Then click "Update Products" button.
      `)
    } catch (error) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Product Update Tool</h1>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> Make sure the 'description' column exists in the products table before updating.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={addDescriptionColumn}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Show SQL to Add Description Column'}
            </button>

            <button 
              onClick={updateProducts}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ml-4"
            >
              {loading ? 'Updating...' : 'Update Products'}
            </button>
          </div>

          {message && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">{message}</pre>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Products to be added:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newProducts.map((product, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded mb-2" />
                  <h3 className="font-semibold text-sm">{product.name}</h3>
                  <p className="text-xs text-gray-600 mb-1">Category: {product.category}</p>
                  <p className="text-xs text-gray-600 mb-1">Stock: {product.stock}</p>
                  <p className="text-xs text-gray-500">{product.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}