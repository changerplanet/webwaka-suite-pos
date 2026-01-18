import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/data/db'
import { formatCurrency } from '@/shared/utils/currency'

export default function CatalogPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const products = useLiveQuery(() => db.products.toArray(), [])

  const categories: string[] = [...new Set(products?.map(p => p.categoryId) || [])]

  const filteredProducts = products?.filter(p => {
    const matchesSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-bold mb-4">Product Catalog</h1>
        
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="input mb-4"
        />

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap ${
              !selectedCategory ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap capitalize ${
                selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {filteredProducts?.map(product => (
          <div key={product.id} className="card flex justify-between items-center">
            <div>
              <h3 className="font-medium text-gray-800">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.sku} • {product.categoryId}</p>
              <p className="text-xs text-gray-400">Stock: {product.stockQuantity}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-indigo-600">{formatCurrency(product.price)}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                product.inStock ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {(!filteredProducts || filteredProducts.length === 0) && (
        <div className="card text-center text-gray-400 py-8">
          No products found
        </div>
      )}
    </div>
  )
}
