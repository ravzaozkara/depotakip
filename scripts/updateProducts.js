import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// New products data
const newProducts = [
  {
    id: 1,
    name: 'AKRILIK BOYA SETI',
    category: 'Boya',
    description: 'Renk Renk Profesyonel Akrilik Boya Seti',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    name: 'İLAHI SÖYLEYEN BALIK',
    category: 'Diğer',
    description: 'Namı diğer Abdülhey. Uslu balık dans ediyor sınırlı sayıda en yüksek teklifi verene verilecektir. Ölücüler yazmasın',
    stock: 1,
    image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 3,
    name: 'TÜM İSTANBULDA OLAN O ROZET',
    category: 'Rozet',
    description: 'Gönüllü buluşmanıza fark katacak o rozetler',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc81?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 4,
    name: 'TÜM İSTANBULDA OLAN O ROZET 2',
    category: 'Rozet',
    description: 'Premium gönüllülere verilecektir',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc81?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 5,
    name: 'TOMBUL MUM',
    category: 'Mum',
    description: 'Mum boyama için pleksi mum',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1602607135297-8dc90b5b4585?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 6,
    name: 'ORTAYA KARIŞIK',
    category: 'Boya',
    description: 'Little little on the middle',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1596638787647-904d822d751e?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 7,
    name: 'ZENGİN KALEMLERİ',
    category: 'Kalem',
    description: 'Kimseye vermiyoruz ısrar etmeyiniz',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 8,
    name: 'KEFİYE',
    category: 'Diğer',
    description: 'Çok isteyen Genç Atölyeden Satın alabilir yazmayınız',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1589308078059-be1415932272?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 9,
    name: 'AL GÖTÜR SET',
    category: 'Boya',
    description: 'Karşılıksız değildir uygun fiyatta rüşvete öncelik tanınarak verilir. Detaylı bilgi için DM',
    stock: 10,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=60'
  },
  {
    id: 10,
    name: 'SERAMİK KİL',
    category: 'Kil',
    description: 'Poşetinden çıkarmaya üşendim anladınız siz',
    stock: 15,
    image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=500&auto=format&fit=crop&q=60'
  }
]

async function updateProducts() {
  console.log('Starting product update...')
  
  try {
    // First, delete all existing products
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .gte('id', 0) // Delete all records
    
    if (deleteError) {
      console.error('Error deleting existing products:', deleteError)
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
      return
    }
    
    console.log('Products updated successfully!')
    console.log('Inserted products:', data)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the update
updateProducts()