import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, MouseEvent } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Heart, Plus, Search, ShoppingBag, UserRound, X, LayoutDashboard, Package, Trash2, Pencil, LogOut } from 'lucide-react'
import { brand } from './brand'
import { products } from './products'
import { audienceCategories, productCategoryFilters } from './categories'
import type { Product } from './products'
import { adminEmail, supabase } from './supabase'
import './style.css'

type CartLine = { product: Product }
type ProductRow = Product & { created_at?: string }
const money = (n: number) => `${n.toLocaleString('vi-VN')} VNĐ`

const productFromRow = (row: ProductRow): Product => ({
  id: row.id, name: row.name, price: Number(row.price), category: row.category,
  audience: row.audience === 'NỮ' ? 'NỮ' : 'NAM', sold: Boolean(row.sold),
  image: row.image, size: row.size || '',
  description: row.description || '',
  images: Array.isArray(row.images) ? row.images : [row.image],
})

const productToRow = (product: Product) => ({
  id: product.id, name: product.name, price: product.price, category: product.category,
  audience: product.audience || 'NAM', sold: Boolean(product.sold),
  image: product.image, size: product.size || '',
  description: product.description || '',
  images: product.images?.length ? product.images : [product.image],
})

function App() {
  const [admin, setAdmin] = useState(window.location.pathname.replace(/\/$/, '') === '/admin' || window.location.hash === '#admin')
  const [managedProducts, setManagedProducts] = useState<Product[]>(() => products.map(p => ({ ...p, audience: p.audience === 'NỮ' ? 'NỮ' : 'NAM' })))
  const [authUserEmail, setAuthUserEmail] = useState('')
  const [authReady, setAuthReady] = useState(false)
  const [productsLoading, setProductsLoading] = useState(Boolean(supabase))
  const [productsError, setProductsError] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [productForm, setProductForm] = useState<Product | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUploadNotice, setImageUploadNotice] = useState('')
  const openAdmin = () => { setAdmin(true); window.history.pushState({}, '', '/admin'); window.scrollTo(0, 0) }
  const closeAdmin = () => { setAdmin(false); window.history.pushState({}, '', '/'); window.scrollTo(0, 0) }
  const saveProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!productForm || !supabase) { setProductsError('Chưa cấu hình Supabase.'); return }
    const product = productForm.id ? productForm : { ...productForm, id: `item-${Date.now()}` }
    const { error } = await supabase.from('products').upsert(productToRow(product))
    if (error) { setProductsError(`Không lưu được sản phẩm: ${error.message}`); return }
    setManagedProducts(current => current.some(p => p.id === product.id) ? current.map(p => p.id === product.id ? product : p) : [product, ...current])
    setProductsError('')
    setProductForm(null)
  }
  const uploadProductImages = async (files: FileList | null) => {
    if (!files?.length || !productForm) return
    if (!supabase) { setImageUploadNotice('Chưa cấu hình Supabase Storage để tải ảnh lên.'); return }
    setImageUploading(true)
    setImageUploadNotice('Đang tải ảnh lên…')
    const uploaded: string[] = []
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} không phải tệp ảnh.`)
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const path = `products/${crypto.randomUUID()}-${safeName}`
        const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type })
        if (error) throw error
        uploaded.push(supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl)
      }
      setProductForm(current => {
        if (!current) return current
        const existing = current.images?.length ? current.images : current.image ? [current.image] : []
        const images = [...existing, ...uploaded]
        return { ...current, image: images[0] || '', images }
      })
      setImageUploadNotice(`Đã tải lên ${uploaded.length} ảnh.`)
    } catch (error) {
      setImageUploadNotice(`Không tải được ảnh: ${error instanceof Error ? error.message : 'Lỗi không xác định.'}`)
    } finally {
      setImageUploading(false)
    }
  }
  const deleteProduct = async (id: string) => {
    if (!supabase) { setProductsError('Chưa cấu hình Supabase.'); return }
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) { setProductsError(`Không xóa được sản phẩm: ${error.message}`); return }
    setManagedProducts(current => current.filter(product => product.id !== id))
    setProductsError('')
  }
  const toggleProductSold = async (product: Product) => {
    if (!supabase) { setProductsError('Chưa cấu hình Supabase.'); return }
    const sold = !product.sold
    const { error } = await supabase.from('products').update({ sold }).eq('id', product.id)
    if (error) { setProductsError(`Không cập nhật được trạng thái đã bán: ${error.message}`); return }
    setManagedProducts(current => current.map(item => item.id === product.id ? { ...item, sold } : item))
    setProductsError('')
  }
  const [cart, setCart] = useState<CartLine[]>(() => {
    try {
      const savedCart = window.localStorage.getItem('tb2hand-cart')
      const parsedCart: unknown = savedCart ? JSON.parse(savedCart) : []
      return Array.isArray(parsedCart) ? parsedCart.filter((line): line is CartLine => Boolean(line?.product?.id && line.product.name && Number.isFinite(line.product.price))) : []
    } catch {
      return []
    }
  })
  useEffect(() => {
    window.localStorage.setItem('tb2hand-cart', JSON.stringify(cart))
  }, [cart])
  const [drawer, setDrawer] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authNotice, setAuthNotice] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [category, setCategory] = useState('Tất cả')
  const [audience, setAudience] = useState<'NỮ' | 'NAM'>('NAM')
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false)
  const [homeRefreshing, setHomeRefreshing] = useState(false)
  const [selectedNav, setSelectedNav] = useState<'home' | 'NỮ' | 'NAM' | null>('home')
  const [categorySearch, setCategorySearch] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageZoomOpen, setImageZoomOpen] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const handleZoomPointerMove = (event: MouseEvent<HTMLImageElement>) => { const bounds = event.currentTarget.getBoundingClientRect(); setZoomPosition({ x: Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)), y: Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)) }) }
  useEffect(() => {
    if (!selected) { setSelectedImageIndex(0); return }
    setSelectedImageIndex(0)
    const images = selected.images.length > 0 ? selected.images : [selected.image]
    images.forEach(src => {
      const preload = new window.Image()
      preload.decoding = 'async'
      preload.src = src
    })
  }, [selected?.id])
  useEffect(() => {
    if (!imageZoomOpen) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setImageZoomOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [imageZoomOpen])
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (!supabase) { setAuthReady(true); return }
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) { setAuthUserEmail(data.session?.user.email?.toLowerCase() || ''); setAuthReady(true) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUserEmail(session?.user.email?.toLowerCase() || '')
      setAuthReady(true)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])
  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.from('products').select('id,name,price,category,audience,sold,image,size,description,images,created_at').order('created_at', { ascending: false }).order('id', { ascending: false }).then(({ data, error }) => {
      if (!active) return
      if (error) setProductsError(`Chưa tải được sản phẩm từ Supabase: ${error.message}`)
      else if (data?.length) setManagedProducts((data as ProductRow[]).map(productFromRow))
      else setProductsError('Bảng Supabase chưa có sản phẩm; đang hiển thị danh sách mẫu.')
      setProductsLoading(false)
    })
    return () => { active = false }
  }, [])
  const isStoreAdmin = Boolean(adminEmail && authUserEmail === adminEmail)
  const categories = audienceCategories[audience]
  const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
  const visibleCategories = categories.filter(item => normalizeSearch(item.name).includes(normalizeSearch(categorySearch)))
  const visibleProducts = useMemo(() => managedProducts.filter(p => {
    const searchableText = normalizeSearch([p.name, p.category, p.description].join(' '))
    return (selectedNav === 'home' || p.audience === audience) && (category === 'Tất cả' || p.category === category) && searchableText.includes(normalizeSearch(search))
  }), [category, search, managedProducts, audience, selectedNav])
  const pageSize = 8
  const pageCount = Math.ceil(visibleProducts.length / pageSize)
  const paginatedProducts = visibleProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  useEffect(() => { setCurrentPage(1) }, [category, search, audience, selectedNav])
  const cartCount = cart.length
  const total = cart.reduce((sum, line) => sum + line.product.price, 0)
  const handleAuthSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!supabase) { setAuthNotice('Chưa cấu hình Supabase.'); return }
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()
    const password = String(form.get('password') || '')
    const result = authMode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (result.error) { setAuthNotice(result.error.message); return }
    if (admin && adminEmail && email !== adminEmail) {
      await supabase.auth.signOut()
      setAuthNotice('Email này không có quyền quản trị cửa hàng.')
      return
    }
    if (authMode === 'signup' && !result.data.session) {
      setAuthNotice('Đã tạo tài khoản. Hãy xác nhận email rồi đăng nhập để tiếp tục.')
      return
    }
    setAuthNotice('Đăng nhập thành công.')
    if (email === adminEmail) setAdmin(true)
  }
  const notifyOAuthSetup = (provider: string) => setAuthNotice('Đăng nhập ' + provider + ' chưa được kết nối. Cần cấu hình OAuth của cửa hàng trước khi sử dụng.')
  const add = (product: Product) => {
    if (product.sold) { setNotice('Sản phẩm này đã bán hết.'); setTimeout(() => setNotice(''), 2600); return }
    const alreadyAdded = cart.some(line => line.product.id === product.id)
    if (!alreadyAdded) setCart(current => current.some(line => line.product.id === product.id) ? current : [...current, { product }])
    setNotice(alreadyAdded ? `${product.name} đã có trong giỏ (mỗi món chỉ có 1 sản phẩm)` : `${product.name} đã được thêm vào giỏ`)
    setTimeout(() => setNotice(''), 2600)
  }
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const changeProductPage = (page: number) => { setCurrentPage(page); requestAnimationFrame(() => jump('shop')) }
  const goHome = () => { setSelectedNav('home'); setAudience('NAM'); setCategory('Tất cả'); setSearch(''); setCategorySearch(''); setCategoryPanelOpen(false); setHomeRefreshing(true); window.scrollTo({ top: 0, behavior: 'smooth' }); window.setTimeout(() => setHomeRefreshing(false), 650) }
  if (admin && (!authReady || !isStoreAdmin)) {
    return <div className="admin-shell"><main className="admin-main"><section className="admin-panel" style={{ maxWidth: 520, margin: '10vh auto' }}><span className="admin-kicker">THANH BUI 2HAND</span><h1>Đăng nhập quản trị</h1><p>{!authReady ? 'Đang kiểm tra phiên đăng nhập…' : 'Đăng nhập bằng email quản trị để quản lý sản phẩm.'}</p>{authReady && <form className="auth-form" onSubmit={handleAuthSubmit}><label>Email<input name="email" type="email" autoComplete="username" defaultValue={adminEmail} required /></label><label>Mật khẩu<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label><button className="button button-dark auth-submit" type="submit">ĐĂNG NHẬP <ArrowRight size={16}/></button>{authNotice && <p className="auth-notice" role="status">{authNotice}</p>}</form>}<button className="text-link" type="button" onClick={closeAdmin}>Về cửa hàng</button></section></main></div>
  }
  if (admin) {
    const filtered = managedProducts.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(productQuery.toLowerCase()))
    const soldProducts = managedProducts.filter(product => product.sold)
    const monthIncome = soldProducts.reduce((total, product) => total + Number(product.price || 0), 0)
    const sales = soldProducts.length
    const availableProducts = managedProducts.filter(product => !product.sold).length
    const productCategories = productForm?.audience ? productCategoryFilters(productForm.audience) : []
    return <div className="admin-shell"><aside className="admin-sidebar"><a className="wordmark" href="/"><span className="mark">TB<span>.</span></span><span className="brandname">THANH BUI <i>2HAND</i></span></a><p className="admin-caption">QUẢN TRỊ CỬA HÀNG</p><button className="admin-nav active"><LayoutDashboard size={18}/> Tổng quan</button><button className="admin-nav" onClick={()=>document.getElementById('admin-products')?.scrollIntoView({behavior:'smooth'})}><Package size={18}/> Sản phẩm</button><div className="admin-sidebar-bottom"><span className="admin-avatar">TB</span><span><b>{authUserEmail}</b><small>Quản trị viên</small></span><button aria-label="Đăng xuất" onClick={async()=>{await supabase?.auth.signOut();closeAdmin()}}><LogOut size={17}/></button></div></aside><main className="admin-main"><header className="admin-header"><div><p className="eyebrow">THANH BUI 2HAND · 2026</p><h1>Tổng quan</h1></div><button className="admin-store-link" onClick={closeAdmin}>Xem cửa hàng <ArrowUpRight size={16}/></button></header><div className="admin-stat-grid"><article className="admin-stat"><span>DOANH THU</span><div><strong>{money(monthIncome)}</strong></div><small>Tổng giá các sản phẩm đã bán</small></article><article className="admin-stat"><span>ĐƠN HÀNG</span><div><strong>{sales}</strong></div><small>Sản phẩm đã bật Đã bán</small></article><article className="admin-stat"><span>SẢN PHẨM</span><div><strong>{availableProducts}</strong></div><small>Sản phẩm trong kho</small></article></div><section className="admin-panel inventory-panel" id="admin-products"><div className="inventory-heading"><div><span className="admin-kicker">KHO HÀNG</span><h3>Quản lý sản phẩm <span>{managedProducts.length}</span></h3></div><div className="inventory-heading-actions"><button className="admin-add-button" onClick={()=>setProductForm({id:'',name:'',price:0,category:'Áo thun',audience:'NỮ',image:'',size:'One size',description:'',images:[]})}><Plus size={16}/> Thêm sản phẩm</button></div></div><div className="inventory-tools"><label><Search size={16}/><input placeholder="Tìm tên sản phẩm..." value={productQuery} onChange={e=>setProductQuery(e.target.value)}/></label><span>{filtered.length} sản phẩm</span></div>{productsLoading&&<p>Đang tải sản phẩm…</p>}{productsError&&<p className="auth-notice" role="status">{productsError}</p>}<div className="inventory-table-wrap"><table className="inventory-table"><thead><tr><th>SẢN PHẨM</th><th>GIỚI TÍNH</th><th>DANH MỤC</th><th>GIÁ BÁN</th><th>THAO TÁC</th><th>ĐÃ BÁN</th></tr></thead><tbody>{filtered.map(p=><tr key={p.id}><td><div className="inventory-product"><img src={p.image} alt={p.name}/><span><b>{p.name}</b><small>{p.size}</small></span></div></td><td>{p.audience}</td><td>{p.category}</td><td><b>{money(p.price)}</b></td><td><div className="row-actions"><button title="Chỉnh sửa" aria-label={`Sửa ${p.name}`} onClick={()=>setProductForm(p)}><Pencil size={15}/></button><button title="Xóa sản phẩm" aria-label={`Xóa ${p.name}`} onClick={()=>{if(confirm(`Xóa sản phẩm “${p.name}” khỏi cửa hàng?`))void deleteProduct(p.id)}}><Trash2 size={15}/></button></div></td><td><label className="sold-switch" title={p.sold ? "Đánh dấu chưa bán" : "Đánh dấu đã bán"}><input type="checkbox" checked={Boolean(p.sold)} onChange={()=>void toggleProductSold(p)} aria-label={`${p.sold ? "Đã bán" : "Chưa bán"}: ${p.name}`}/><span/><em>{p.sold ? "ON" : "OFF"}</em></label></td></tr>)}</tbody></table>{filtered.length===0&&<p className="empty-search">Chưa có sản phẩm phù hợp.</p>}</div></section><footer className="admin-footer">© 2026 Thanh Bui 2Hand</footer></main>{productForm&&<><button className="admin-modal-backdrop" aria-label="Đóng biểu mẫu" onClick={()=>setProductForm(null)}/><form className="product-form-modal" onSubmit={saveProduct}><div className="admin-panel-heading"><div><span className="admin-kicker">KHO HÀNG</span><h3>{managedProducts.some(p=>p.id===productForm.id)?'Chỉnh sửa sản phẩm':'Thêm sản phẩm mới'}</h3></div><button type="button" className="icon-button" onClick={()=>setProductForm(null)}><X size={19}/></button></div><label>Tên sản phẩm<input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})}/></label><div className="product-form-row admin-product-category-row"><label>Giá bán ( VNĐ)<input required type="number" min="0" value={productForm.price||''} onChange={e=>setProductForm({...productForm,price:Number(e.target.value)})}/></label><label>Hiển thị tại<select value={productForm.audience||'NỮ'} onChange={e=>{const nextAudience=e.target.value as 'NỮ'|'NAM';const nextCategories=productCategoryFilters(nextAudience);const nextCategory=nextCategories.includes(productForm.category)?productForm.category:nextCategories[0];setProductForm({...productForm,audience:nextAudience,category:nextCategory})}}><option value="NỮ">Nữ</option><option value="NAM">Nam</option></select></label><label>Danh mục<select value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})}>{productCategories.map(c=><option key={c}>{c}</option>)}</select></label><label>Kích cỡ<input value={productForm.size} onChange={e=>setProductForm({...productForm,size:e.target.value})}/></label></div><div className="product-images-field"><label className="upload-image-button"><input type="file" accept="image/*" multiple disabled={imageUploading} onChange={e=>{void uploadProductImages(e.currentTarget.files);e.currentTarget.value=""}}/><Plus size={15}/> Chọn ảnh từ máy tính</label><small className="image-upload-notice">{imageUploadNotice || "Chọn một hoặc nhiều ảnh để tải lên."}</small><label>Hoặc nhập URL ảnh (mỗi ảnh một dòng)<textarea required rows={4} value={(productForm.images?.length?productForm.images:[productForm.image]).join('\n')} onChange={e=>{const urls=e.target.value.split(/\r?\n/).map(url=>url.trim()).filter(Boolean);setProductForm({...productForm,image:urls[0]||'',images:urls})}} placeholder={'https://.../anh-1.jpg\nhttps://.../anh-2.jpg'}/><small>Đường dẫn đầu tiên làm ảnh đại diện; ảnh còn lại xuất hiện trong phần chi tiết.</small></label></div><label>Mô tả<textarea rows={3} value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})}/></label><div className="product-form-actions"><button type="button" onClick={()=>setProductForm(null)}>Hủy</button><button type="submit" className="admin-add-button" disabled={imageUploading}><Check size={15}/> {imageUploading?"Đang tải ảnh…":"Lưu sản phẩm"}</button></div></form></>}</div>
  }
  return <>
    <main id="top" className={homeRefreshing ? 'home-refreshing' : ''}><div className={`category-browser${categoryPanelOpen ? ' is-open' : ''}`} id="new-in" onMouseLeave={()=>setCategoryPanelOpen(false)}><div className="category-topbar"><div className="audience-tabs" role="group" aria-label="Điều hướng cửa hàng"><button type="button" className={`home-tab${selectedNav === 'home' ? ' active' : ''}`} onMouseEnter={()=>setCategoryPanelOpen(false)} onClick={goHome}>Trang chủ</button>{(['NỮ','NAM'] as const).map(tab=><button key={tab} type="button" aria-pressed={audience===tab} className={selectedNav===tab?'active':''} aria-expanded={categoryPanelOpen} aria-controls="category-panel" onMouseEnter={()=>{setAudience(tab);setCategorySearch('');setCategoryPanelOpen(true)}} onFocus={()=>{setCategoryPanelOpen(true)}} onClick={()=>{setAudience(tab);setSelectedNav(tab);setCategory('Tất cả');setSearch('');setCategorySearch('');setCategoryPanelOpen(true)}}>{tab}</button>)}</div><form className="toolbar-search" role="search" onSubmit={e=>{e.preventDefault();document.getElementById('product-list')?.scrollIntoView({behavior:'smooth'})}}><input aria-label="Tìm sản phẩm" placeholder="Bạn đang tìm sản phẩm gì?" value={categorySearch} onChange={e=>{setCategorySearch(e.target.value);setSearch(e.target.value);setCategory('Tất cả')}}/><button type="submit" aria-label="Tìm kiếm"><Search size={20} aria-hidden="true"/></button></form><div className="toolbar-actions"><button aria-label="Danh sách yêu thích" onClick={()=>{setNotice('Danh sách yêu thích sẽ sớm ra mắt.');setTimeout(()=>setNotice(''),2600)}}><Heart size={21}/></button><button aria-label="Đăng nhập tài khoản thành viên" onClick={()=>{setAuthMode('login');setAuthNotice('');setAuthOpen(true)}}><UserRound size={21}/></button><button className={`cart-icon-button${cartCount > 0 ? ' has-items' : ''}`} aria-label={`Mở túi hàng, ${cartCount} sản phẩm`} onClick={()=>setDrawer(true)}><ShoppingBag size={21}/>{cartCount > 0 && <span className="cart-count">{cartCount}</span>}</button></div></div><div className="category-panel" id="category-panel"><div className="category-grid" key={audience} aria-label={`Danh mục sản phẩm dành cho ${audience.toLowerCase()}`}>{visibleCategories.map(item=><button className="category-tile" key={item.name} onClick={()=>{setSelectedNav(audience);setCategory(item.filter);setSearch('');setCategorySearch('');setCategoryPanelOpen(false);document.getElementById('product-list')?.scrollIntoView({behavior:'smooth'})}}><span className="category-image"><img src={item.image} alt={item.alt} loading="lazy"/></span><span>{item.name}</span></button>)}</div></div></div><section className="hero hero-doodle" aria-label="Bộ sưu tập mới"><img className="hero-image" src="/images/home-doodle.png" alt="Nền doodle đen trắng với các hình vẽ ngộ nghĩnh"/><div className="hero-shade"/><div className="hero-content"><p className="eyebrow light">CURATED SECONDHAND · EST. 2024</p><p className="hero-copy">Những món đồ xứng đáng có thêm một cuộc đời.<br/>Được tìm thấy, tuyển chọn, và chờ bạn viết tiếp.</p><a className="button button-light" href="#shop">SHOP NOW <ArrowUpRight size={16}/></a></div><div className="hero-index"><span>01</span> / 03 <i/></div><div className="hero-side-note">PRE-LOVED, RE-LOVED</div></section>
      <div className="ticker" aria-label="Tuyên ngôn thương hiệu"><div>{Array.from({length:4}, (_,i)=><span key={i}>WEAR IT YOUR WAY <b>✳</b> GOOD CLOTHES, BETTER STORIES <b>✳</b></span>)}</div></div>
      <section className="section shop-section" id="shop"><div className="product-grid" id="product-list">{paginatedProducts.map(p=><article className={`product-card${p.sold ? ' is-sold' : ''}`} key={p.id}><button className="product-photo" onClick={()=>{setSelectedImageIndex(0);setSelected(p)}} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.name} loading="lazy"/></button><button className="product-title" onClick={()=>{setSelectedImageIndex(0);setSelected(p)}}>{p.name}</button><div className="product-card-bottom"><p className="product-card-price">{money(p.price)}</p><>{p.sold ? <span className="product-sold-label">ĐÃ BÁN</span> : <button type="button" className="product-card-add" aria-label={`Thêm ${p.name} vào giỏ hàng`} onClick={()=>add(p)}><Plus size={17}/></button>}</></div></article>)}</div>{visibleProducts.length===0&&<div className="empty-search">Chưa tìm thấy món nào. Thử một từ khóa khác nhé.</div>}{pageCount > 1 && <nav className="pagination" aria-label="Phân trang sản phẩm"><button type="button" onClick={() => changeProductPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="Trang trước"><ArrowLeft size={15}/></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map(page => <button type="button" key={page} className={currentPage === page ? 'active' : ''} aria-current={currentPage === page ? 'page' : undefined} onClick={() => changeProductPage(page)}>{page}</button>)}<button type="button" onClick={() => changeProductPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage === pageCount} aria-label="Trang sau"><ArrowRight size={15}/></button></nav>}</section>
    </main>
    <footer className="footer"><div className="footer-main"><div className="footer-brand"><a className="wordmark footer-mark" href="#top"><span className="mark">TB<span>.</span></span><span className="brandname">THANH BUI <i>2HAND</i></span></a><a className="social-link" href={brand.facebook} target="_blank" rel="noreferrer">FACEBOOK <ArrowUpRight size={14}/></a><a className="social-link" href={brand.instagram} target="_blank" rel="noreferrer">INSTAGRAM <ArrowUpRight size={14}/></a><button className="admin-entry" onClick={openAdmin}>Quản trị cửa hàng <ArrowUpRight size={13}/></button></div><div className="footer-col"><b>KHÁM PHÁ</b><a href="#new-in">New In</a><a href="#shop">Shop tất cả</a></div><div className="footer-col"><b>HỖ TRỢ</b><a href={brand.shippingPolicy}>Chính sách giao hàng</a><a href={brand.returnsPolicy}>Đổi trả & hoàn tiền</a><a href="mailto:quy.bt2006@gmail.com">Liên hệ</a></div><div className="footer-col footer-contact"><b>LIÊN HỆ</b><a href={`mailto:${brand.email}`}>{brand.email}</a><span>Hồ Chí Minh, Việt Nam</span><span>Trả lời trong vòng 24h</span></div></div><div className="footer-bottom"><span>© 2026 BUI THANH QUY</span></div></footer>
    {drawer&&<><button className="scrim" aria-label="Đóng giỏ hàng" onClick={()=>setDrawer(false)}/><aside className="cart-drawer" aria-label="Giỏ hàng"><div className="drawer-head"><div><p className="eyebrow">YOUR SELECTION</p><h2>Giỏ hàng <span>({cartCount})</span></h2></div><button className="icon-button" aria-label="Đóng giỏ hàng" onClick={()=>setDrawer(false)}><X size={20}/></button></div>{cart.length===0?<div className="cart-empty"><ShoppingBag size={30}/><p>Giỏ hàng đang trống.</p><button className="text-link" onClick={()=>{setDrawer(false);jump('shop')}}>KHÁM PHÁ SẢN PHẨM <ArrowRight size={15}/></button></div>:<><div className="cart-items">{cart.map(line=><div className="cart-line" key={line.product.id}><img src={line.product.image} alt={line.product.name}/><div className="cart-line-info"><b>{line.product.name}</b><span>{line.product.size}</span><strong>{money(line.product.price)}</strong></div><button className="remove" onClick={()=>setCart(c=>c.filter(x=>x.product.id!==line.product.id))}>Xóa</button></div>)}</div><div className="cart-total"><p><span>Tạm tính</span><strong>{money(total)}</strong></p>{brand.checkoutUrl?<a className="button button-dark full" href={brand.checkoutUrl}>TIẾN HÀNH THANH TOÁN <ArrowRight size={16}/></a>:<a className="button button-dark full" href={brand.facebook} target="_blank" rel="noreferrer">ĐẶT HÀNG QUA FACEBOOK <ArrowRight size={16}/></a>}<button className="continue" onClick={()=>setDrawer(false)}>TIẾP TỤC MUA SẮM</button></div></>}</aside></>}
    {selected&&<><button className="scrim modal-scrim" onClick={()=>setSelected(null)} aria-label="Đóng chi tiết sản phẩm"/><div className="product-modal" role="dialog" aria-modal="true" aria-label={`Chi tiết ${selected.name}`}><button className="modal-close icon-button" onClick={()=>setSelected(null)} aria-label="Đóng"><X size={20}/></button><div className="modal-gallery"><img key={(selected.images.length > 0 ? selected.images : [selected.image])[selectedImageIndex]} className={`modal-current-image${imageZoomOpen ? ' is-zoomed' : ''}`} style={{transformOrigin:`${zoomPosition.x}% ${zoomPosition.y}%`}} decoding="async" src={(selected.images.length > 0 ? selected.images : [selected.image])[selectedImageIndex]} alt={`${selected.name}, ảnh ${selectedImageIndex+1}`} role="button" tabIndex={0} aria-label="Phóng to hoặc thu nhỏ vùng ảnh" onMouseMove={handleZoomPointerMove} onMouseLeave={()=>setImageZoomOpen(false)} onClick={()=>setImageZoomOpen(value=>!value)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();setImageZoomOpen(value=>!value)}}} />{selected.images.length > 1&&<><button className="gallery-arrow gallery-prev" aria-label="Ảnh trước" onClick={()=>setSelectedImageIndex(i=>(i-1+selected.images.length)%selected.images.length)}><ArrowLeft size={19}/></button><button className="gallery-arrow gallery-next" aria-label="Ảnh tiếp theo" onClick={()=>setSelectedImageIndex(i=>(i+1)%selected.images.length)}><ArrowRight size={19}/></button><span className="gallery-count">{selectedImageIndex+1} / {selected.images.length}</span></>}</div><div className="modal-info"><button className="back-link" onClick={()=>setSelected(null)}><ArrowLeft size={15}/> QUAY LẠI CỬA HÀNG</button><h2>{selected.name}</h2><strong className="modal-price">{money(selected.price)}</strong><span className="modal-condition">Mô tả</span><p className="modal-description">{selected.description}</p><dl><div><dt>KÍCH CỠ</dt><dd>{selected.size.split(/\s*-\s*(?=(?:Eo|Dài|Ống)\s*:)/i).map(part=>part.replace(/^\s*-\s*/, "").trim()).filter(Boolean).map((part,index)=><span key={index}>- {part}</span>)}</dd></div></dl><button className="button button-dark full" onClick={()=>{add(selected);setSelected(null);setDrawer(true)}}>THÊM VÀO GIỎ <Plus size={16}/></button></div></div></>}
    {authOpen && <><button className="scrim auth-scrim" aria-label="Đóng đăng nhập" onClick={() => setAuthOpen(false)}/><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close icon-button" onClick={() => setAuthOpen(false)} aria-label="Đóng"><X size={20}/></button><p className="eyebrow">THANH BUI 2HAND</p><h2 id="auth-title">{authMode === 'login' ? 'Chào mừng bạn trở lại' : 'Tạo tài khoản'}</h2><p className="auth-intro">{authMode === 'login' ? 'Đăng nhập để lưu lại những món đồ bạn yêu thích.' : 'Tạo tài khoản để theo dõi những món đồ độc bản.'}</p><div className="auth-socials"><button type="button" onClick={() => notifyOAuthSetup('Google')}><b className="google-mark">G</b>Tiếp tục với Google</button><button type="button" onClick={() => notifyOAuthSetup('Facebook')}><b className="facebook-mark">f</b>Tiếp tục với Facebook</button></div><div className="auth-divider"><span>HOẶC DÙNG EMAIL</span></div><form className="auth-form" onSubmit={handleAuthSubmit}>{authMode === 'signup' && <label>Họ và tên<input name="name" autoComplete="name" required placeholder="Tên của bạn"/></label>}<label>Email<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label><label>Mật khẩu<input name="password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={8} required placeholder="Tối thiểu 8 ký tự"/></label><button className="button button-dark auth-submit" type="submit">{authMode === 'login' ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'} <ArrowRight size={16}/></button></form>{authNotice && <p className="auth-notice" role="status">{authNotice}</p>}<p className="auth-switch">{authMode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} <button type="button" onClick={() => {setAuthMode(authMode === 'login' ? 'signup' : 'login');setAuthNotice('')}}>{authMode === 'login' ? 'Tạo tài khoản' : 'Đăng nhập'}</button></p></section></>}
    {notice&&<div className="toast"><Check size={16}/>{notice}</div>}
    <button className="to-top" aria-label="Về đầu trang" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}><ArrowDown size={16}/></button>
  </>
}
export default App
























