import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Product } from '@/data/db'
import { useCartStore } from '../cartStore'
import { formatCurrency } from '@/shared/utils/currency'

export default function ProductSearch() {
  const [search, setSearch] = useState('')
  const [showResults, setShowResults] = useState(false)
  const { addToCart } = useCartStore()

  const products = useLiveQuery(() => db.products.toArray(), [])

  const filteredProducts = useMemo(() => {
    if (!products || !search.trim()) return []
    const query = search.toLowerCase()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query)
    )
  }, [products, search])

  useEffect(() => {
    const seedProducts = async () => {
      const count = await db.products.count()
      if (count === 0) {
        const sampleProducts: Product[] = [
          { id: '1', sku: 'PRD001', name: 'Coca-Cola 50cl', description: 'Soft drink', price: 300, taxRate: 0.075, categoryId: 'drinks', inStock: true, stockQuantity: 100, updatedAt: Date.now() },
          { id: '2', sku: 'PRD002', name: 'Bread (Sliced)', description: 'Fresh bread', price: 1200, taxRate: 0.075, categoryId: 'bakery', inStock: true, stockQuantity: 50, updatedAt: Date.now() },
          { id: '3', sku: 'PRD003', name: 'Rice (5kg)', description: 'Premium rice', price: 8500, taxRate: 0.075, categoryId: 'groceries', inStock: true, stockQuantity: 30, updatedAt: Date.now() },
          { id: '4', sku: 'PRD004', name: 'Indomie Noodles', description: 'Instant noodles', price: 250, taxRate: 0.075, categoryId: 'groceries', inStock: true, stockQuantity: 200, updatedAt: Date.now() },
          { id: '5', sku: 'PRD005', name: 'Milo 400g', description: 'Chocolate drink mix', price: 2500, taxRate: 0.075, categoryId: 'beverages', inStock: true, stockQuantity: 40, updatedAt: Date.now() },
          { id: '6', sku: 'PRD006', name: 'Peak Milk 400g', description: 'Powdered milk', price: 3200, taxRate: 0.075, categoryId: 'dairy', inStock: true, stockQuantity: 35, updatedAt: Date.now() },
          { id: '7', sku: 'PRD007', name: 'Vegetable Oil 1L', description: 'Cooking oil', price: 1800, taxRate: 0.075, categoryId: 'groceries', inStock: true, stockQuantity: 25, updatedAt: Date.now() },
          { id: '8', sku: 'PRD008', name: 'Sugar 1kg', description: 'Granulated sugar', price: 1200, taxRate: 0.075, categoryId: 'groceries', inStock: true, stockQuantity: 45, updatedAt: Date.now() },
          { id: '9', sku: 'PRD009', name: 'Eggs (Crate)', description: '30 eggs crate', price: 3500, taxRate: 0.075, categoryId: 'dairy', inStock: true, stockQuantity: 20, updatedAt: Date.now() },
          { id: '10', sku: 'PRD010', name: 'Chicken (1kg)', description: 'Fresh chicken', price: 4500, taxRate: 0.075, categoryId: 'meat', inStock: true, stockQuantity: 15, updatedAt: Date.now() },
        ]
        await db.products.bulkAdd(sampleProducts)
      }
    }
    seedProducts()
  }, [])

  const handleSelectProduct = (product: Product) => {
    addToCart(product)
    setSearch('')
    setShowResults(false)
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setShowResults(true)
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search products or scan barcode..."
          className="input flex-1"
        />
        <button className="btn btn-primary">
          🔍
        </button>
      </div>

      {showResults && filteredProducts.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-64 overflow-y-auto z-50">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelectProduct(product)}
              className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex justify-between items-center border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="font-medium text-gray-800">{product.name}</p>
                <p className="text-sm text-gray-500">{product.sku}</p>
              </div>
              <p className="font-bold text-indigo-600">
                {formatCurrency(product.price)}
              </p>
            </button>
          ))}
        </div>
      )}

      {showResults && search && filteredProducts.length === 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 p-4 text-center text-gray-500 z-50">
          No products found
        </div>
      )}
    </div>
  )
}
