import { products } from './products'

export type ShopCategory = { name: string; image: string; filter: string; alt: string }
const cardigan = 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=400&q=85'
const casualShirt = 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=400&q=85'
const shorts = 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=400&q=85'
const dress = 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=400&q=85'

export const audienceCategories: Record<'NỮ' | 'NAM', ShopCategory[]> = {
  'NỮ': [
    { name: 'ÁO KHOÁC', image: products[0].image, filter: 'Áo khoác', alt: 'Áo khoác nữ vintage' },
    { name: 'ÁO THUN & ÁO KIỂU', image: products[1].image, filter: 'Áo thun', alt: 'Áo thun nữ vintage' },
    { name: 'ÁO NỈ', image: products[4].image, filter: 'Áo nỉ', alt: 'Áo nỉ nữ vintage' },
    { name: 'ÁO LEN & CARDIGAN', image: cardigan, filter: 'Áo nỉ', alt: 'Áo len và cardigan nữ' },
    { name: 'ÁO SƠ MI', image: products[3].image, filter: 'Áo sơ mi', alt: 'Áo sơ mi nữ vintage' },
    { name: 'VÁY & ĐẦM', image: dress, filter: 'Tất cả', alt: 'Váy đầm thời trang nữ' },
    { name: 'QUẦN', image: products[2].image, filter: 'Quần', alt: 'Quần nữ vintage' },
    { name: 'QUẦN SHORTS', image: shorts, filter: 'Quần', alt: 'Quần shorts nữ' },
    { name: 'TÚI & PHỤ KIỆN', image: products[5].image, filter: 'Phụ kiện', alt: 'Túi và phụ kiện nữ' },
  ],
  'NAM': [
    { name: 'ÁO KHOÁC', image: products[0].image, filter: 'Áo khoác', alt: 'Áo khoác nam vintage' },
    { name: 'ÁO THUN', image: products[1].image, filter: 'Áo thun', alt: 'Áo thun nam vintage' },
    { name: 'ÁO NỈ & QUẦN NỈ', image: products[4].image, filter: 'Áo nỉ', alt: 'Áo nỉ nam vintage' },
    { name: 'ÁO LEN & ÁO CARDIGAN', image: cardigan, filter: 'Áo nỉ', alt: 'Áo len và cardigan nam' },
    { name: 'ÁO SƠ MI & ÁO POLO', image: products[3].image, filter: 'Áo sơ mi', alt: 'Áo sơ mi và polo nam' },
    { name: 'ÁO SƠ MI CASUAL', image: casualShirt, filter: 'Áo sơ mi', alt: 'Áo sơ mi casual nam' },
    { name: 'QUẦN JEANS', image: products[2].image, filter: 'Quần', alt: 'Quần jeans nam vintage' },
    { name: 'QUẦN SHORTS', image: shorts, filter: 'Quần', alt: 'Quần shorts nam' },
    { name: 'PHỤ KIỆN', image: products[5].image, filter: 'Phụ kiện', alt: 'Phụ kiện nam' },
  ],
}
