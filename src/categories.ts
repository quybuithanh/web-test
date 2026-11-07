
export type ShopCategory = { name: string; image: string; filter: string; alt: string }

export const audienceCategories: Record<'NỮ' | 'NAM', ShopCategory[]> = {
  'NỮ': [
    { name: 'ÁO KHOÁC', image: '/images/womens-jacket-category.png', filter: 'Áo khoác', alt: 'Áo khoác nữ màu nâu nhạt trên nền trắng' },
    { name: 'ÁO THUN', image: '/images/womens-tee-category.png', filter: 'Áo thun', alt: 'Áo thun nữ màu vàng nhạt trên nền xám' },
    { name: 'ÁO SƠ MI', image: '/images/womens-shirt-category.png', filter: 'Áo sơ mi', alt: 'Áo sơ mi nữ màu xanh nhạt trên nền xám' },
    { name: 'QUẦN', image: '/images/womens-pants-category.png', filter: 'Quần', alt: 'Quần ống rộng màu nâu trên nền xám' },
  ],
  'NAM': [
    { name: 'ÁO KHOÁC', image: '/images/mens-jacket-category.png', filter: 'Áo khoác', alt: 'Áo khoác bomber màu xanh rêu trên nền xám' },
    { name: 'ÁO THUN', image: '/images/mens-tee-category.png', filter: 'Áo thun', alt: 'Áo thun nam màu đỏ đô trên nền xám' },
    { name: 'ÁO SƠ MI', image: '/images/mens-shirt-category.png', filter: 'Áo sơ mi', alt: 'Áo sơ mi nam màu xanh nhạt trên nền xám' },
    { name: 'QUẦN', image: '/images/mens-pants-category.png', filter: 'Quần', alt: 'Quần jeans ống rộng màu xanh đậm trên nền xám' },
  ],
}

export const productCategoryFilters = (audience: 'NỮ' | 'NAM') =>
  [...new Set(audienceCategories[audience].map(item => item.filter).filter(filter => filter !== 'Tất cả'))]
