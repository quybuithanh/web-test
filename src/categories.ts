import { products } from './products'

export type ShopCategory = { name: string; image: string; filter: string; alt: string }
const dress = 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=85'

export const audienceCategories: Record<'NỮ' | 'NAM', ShopCategory[]> = {
  'NỮ': [
    { name: 'ÁO KHOÁC', image: products[0].image, filter: 'Áo khoác', alt: 'Áo khoác nữ vintage' },
    { name: 'ÁO THUN', image: products[1].image, filter: 'Áo thun', alt: 'Áo thun nữ vintage' },
    { name: 'ĐẦM', image: dress, filter: 'Đầm', alt: 'Đầm thời trang nữ' },
  ],
  'NAM': [
    { name: 'ÁO KHOÁC', image: products[0].image, filter: 'Áo khoác', alt: 'Áo khoác nam vintage' },
    { name: 'ÁO THUN', image: products[1].image, filter: 'Áo thun', alt: 'Áo thun nam vintage' },
    { name: 'ÁO SƠ MI', image: products[3].image, filter: 'Áo sơ mi', alt: 'Áo sơ mi nam vintage' },
    { name: 'QUẦN', image: products[2].image, filter: 'Quần', alt: 'Quần nam vintage' },
  ],
}
