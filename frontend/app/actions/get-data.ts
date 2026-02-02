'use server'

import { cookies } from 'next/headers'

// Fetch categories from backend
export async function getCategories() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value
    console.log('token - token', token)
    const response = await fetch('https://hardware-ecommerce-monorepo.onrender.com/api/products/categories/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`)
    }

    const categories = await response.json()
    return { success: true, data: categories }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch categories' }
  }
}

// Fetch brands from backend
export async function getBrands() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value

    const response = await fetch('https://hardware-ecommerce-monorepo.onrender.com/api/products/brands/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch brands: ${response.status}`)
    }

    const brands = await response.json()
    return { success: true, data: brands }
  } catch (error) {
    console.error('Error fetching brands:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch brands' }
  }
}
