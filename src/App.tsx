import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Heart, Plus, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import { brand } from './brand'
import { products } from './products'
import { audienceCategories } from './categories'
import type { Product } from './products'
import './style.css'

type CartLine = { product: Product }
const money = (n: number) => `${n.toLocaleString('vi-VN')}₫`

function App() {
  const [cart, setCart] = useState<CartLine[]>([])
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Tất cả')
  const [audience, setAudience] = useState<'NỮ' | 'NAM'>('NAM')
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false)
  const [homeRefreshing, setHomeRefreshing] = useState(false)
  const [selectedNav, setSelectedNav] = useState<'home' | 'NỮ' | 'NAM' | null>(null)
  const [categorySearch, setCategorySearch] = useState('')
  const [selected, setSelected] = useState<Product | null>(null)
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const categories = audienceCategories[audience]
  const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase()
  const visibleCategories = categories.filter(item => normalizeSearch(item.name).includes(normalizeSearch(categorySearch)))
  const visibleProducts = useMemo(() => products.filter(p => {
    const searchableText = normalizeSearch([p.name, p.category, p.categoryLabel, p.color, p.description, p.material, p.condition].join(' '))
    return (category === 'Tất cả' || p.category === category) && searchableText.includes(normalizeSearch(search))
  }), [category, search])
  const cartCount = cart.length
  const total = cart.reduce((sum, line) => sum + line.product.price, 0)
  const orderMessage = cart.map(({ product }) => `Mình muốn mua: ${product.name}, màu ${product.color}, size ${product.size}, tình trạng ${product.condition}, giá ${money(product.price)}, ảnh: ${product.image}`).join('\n') + `\nTổng tiền: ${money(total)}`
  const prepareFacebookOrder = () => {
    if (!navigator.clipboard?.writeText) {
      setNotice('Không thể sao chép tự động. Hãy sao chép thông tin đơn hàng trong túi hàng.')
      setTimeout(() => setNotice(''), 3500)
      return
    }
    void navigator.clipboard.writeText(orderMessage).then(() => {
      setNotice('Đã sao chép nội dung đơn hàng. Hãy dán vào Messenger và nhấn Gửi.')
      setTimeout(() => setNotice(''), 4000)
    }).catch(() => {
      setNotice('Hãy dán thông tin đơn hàng vào Messenger để tiếp tục.')
      setTimeout(() => setNotice(''), 3500)
    })
  }
  const add = (product: Product) => {
    const alreadyAdded = cart.some(line => line.product.id === product.id)
    if (!alreadyAdded) setCart(current => current.some(line => line.product.id === product.id) ? current : [...current, { product }])
    setNotice(alreadyAdded ? `${product.name} đã có trong giỏ (mỗi món chỉ có 1 sản phẩm)` : `${product.name} đã được thêm vào giỏ`)
    setTimeout(() => setNotice(''), 2600)
  }
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const goHome = () => { setSelectedNav('home'); setAudience('NAM'); setCategory('Tất cả'); setSearch(''); setCategorySearch(''); setCategoryPanelOpen(false); setHomeRefreshing(true); window.scrollTo({ top: 0, behavior: 'smooth' }); window.setTimeout(() => setHomeRefreshing(false), 650) }
  const subscribe = (e: FormEvent) => { e.preventDefault(); if (email.includes('@')) setSubscribed(true) }
  return <>
    <main id="top" className={homeRefreshing ? 'home-refreshing' : ''}><div className={`category-browser${categoryPanelOpen ? ' is-open' : ''}`} id="new-in" onMouseLeave={()=>setCategoryPanelOpen(false)}><div className="category-topbar"><div className="audience-tabs" role="group" aria-label="Điều hướng cửa hàng"><button type="button" className={`home-tab${selectedNav === 'home' ? ' active' : ''}`} onMouseEnter={()=>setCategoryPanelOpen(false)} onClick={goHome}>Trang chủ</button>{(['NỮ','NAM'] as const).map(tab=><button key={tab} type="button" aria-pressed={audience===tab} className={selectedNav===tab?'active':''} aria-expanded={categoryPanelOpen} aria-controls="category-panel" onMouseEnter={()=>{setAudience(tab);setCategorySearch('');setCategoryPanelOpen(true)}} onFocus={()=>{setCategoryPanelOpen(true)}} onClick={()=>{setAudience(tab);setSelectedNav(tab);setCategorySearch('');setCategoryPanelOpen(true)}}>{tab}</button>)}</div><form className="toolbar-search" role="search" onSubmit={e=>{e.preventDefault();document.getElementById('product-list')?.scrollIntoView({behavior:'smooth'})}}><input aria-label="Tìm sản phẩm" placeholder="Bạn đang tìm sản phẩm gì?" value={categorySearch} onChange={e=>{setCategorySearch(e.target.value);setSearch(e.target.value);setCategory('Tất cả')}}/><button type="submit" aria-label="Tìm kiếm"><Search size={20} aria-hidden="true"/></button></form><div className="toolbar-actions"><button aria-label="Danh sách yêu thích" onClick={()=>{setNotice('Danh sách yêu thích sẽ sớm ra mắt.');setTimeout(()=>setNotice(''),2600)}}><Heart size={21}/></button><button aria-label="Tài khoản thành viên" onClick={()=>{setNotice('Tính năng thành viên sẽ sớm ra mắt.');setTimeout(()=>setNotice(''),2600)}}><UserRound size={21}/></button><button aria-label={`Mở túi hàng, ${cartCount} sản phẩm`} onClick={()=>setDrawer(true)}><ShoppingBag size={21}/></button></div></div><div className="category-panel" id="category-panel"><div className="category-grid" key={audience} aria-label={`Danh mục sản phẩm dành cho ${audience.toLowerCase()}`}>{visibleCategories.map(item=><button className="category-tile" key={item.name} onClick={()=>{setCategory(item.filter);setSearch('');setCategorySearch('');setCategoryPanelOpen(false);document.getElementById('product-list')?.scrollIntoView({behavior:'smooth'})}}><span className="category-image"><img src={item.image} alt={item.alt} loading="lazy"/></span><span>{item.name}</span></button>)}</div></div></div><section className="hero" aria-label="Bộ sưu tập mới"><img className="hero-image" src="https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=2200&q=90" alt="Người mẫu diện trang phục streetwear trong không gian đô thị"/><div className="hero-shade"/><div className="hero-content"><p className="eyebrow light">CURATED SECONDHAND · EST. 2024</p><h1>Đồ cũ.<br/><em>Chất riêng.</em></h1><p className="hero-copy">Những món đồ xứng đáng có thêm một cuộc đời.<br/>Được tìm thấy, tuyển chọn, và chờ bạn viết tiếp.</p><a className="button button-light" href="#shop">SHOP NOW <ArrowUpRight size={16}/></a></div><div className="hero-index"><span>01</span> / 03 <i/></div><div className="hero-side-note">PRE-LOVED, RE-LOVED</div></section>
      <div className="ticker" aria-label="Tuyên ngôn thương hiệu"><div>{Array.from({length:4}, (_,i)=><span key={i}>WEAR IT YOUR WAY <b>✳</b> GOOD CLOTHES, BETTER STORIES <b>✳</b></span>)}</div></div>
      <section className="section shop-section" id="shop"><div className="product-grid" id="product-list">{visibleProducts.map((p,i)=><article className="product-card" key={p.id}><button className="product-photo" onClick={()=>setSelected(p)} aria-label={`Xem chi tiết ${p.name}`}><img src={p.image} alt={p.alt} loading="lazy"/><span className="product-number">0{i+1} / 06</span>{p.badge&&<span className="product-badge">{p.badge}</span>}<span className="quick-add">XEM CHI TIẾT <ArrowUpRight size={14}/></span></button><div className="product-meta"><div><p className="product-category">{p.categoryLabel} · {p.condition}</p><button className="product-title" onClick={()=>setSelected(p)}>{p.name}</button></div><span className="price">{money(p.price)}</span></div><div className="product-bottom"><span>{p.color} <i/></span><button onClick={()=>add(p)} aria-label={`Thêm ${p.name} vào giỏ`} className="add-small"><Plus size={15}/> Thêm nhanh</button></div></article>)}</div>{visibleProducts.length===0&&<div className="empty-search">Chưa tìm thấy món nào. Thử một từ khóa khác nhé.</div>}<div className="shop-bottom"><span>ĐỒ 2HAND CÓ CHỌN LỌC</span><a href="#collections">XEM BỘ SƯU TẬP <ArrowRight size={15}/></a></div></section>
      <section className="collection" id="collections"><div className="collection-image"><img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=88" loading="lazy" alt="Phong cách streetwear tối giản trong bộ sưu tập The Everyday Edit"/><span className="image-caption">A STUDY IN EVERYDAY STYLE · 2026</span></div><div className="collection-copy"><p className="eyebrow">THE LATEST EDIT · VOL. 01</p><h2>The<br/><em>Everyday</em><br/>Edit<span>.</span></h2><p>Những phom dáng quen thuộc, chất liệu đã được thời gian thử thách. Tuyển tập dành cho những ngày chẳng cần cố gắng mà vẫn có gu.</p><a href="#shop" className="text-link">KHÁM PHÁ BỘ SƯU TẬP <ArrowRight size={16}/></a><div className="collection-count">01 <i/> 06</div></div></section>
      <section className="manifesto" id="story"><div className="manifesto-left"><p className="eyebrow">A LITTLE MORE THAN CLOTHES</p><span className="manifesto-star">✳</span></div><div className="manifesto-main"><h2>Món đồ cũ.<br/>Chương <em>mới.</em></h2><p>Chúng mình tin rằng một chiếc áo đẹp không cần phải mới tinh. Nó chỉ cần được tìm đúng người. Thanh Bui 2Hand chọn lọc những item chất lượng cao, có cá tính, xứng đáng được mặc thêm nhiều lần nữa.</p><a href={`mailto:${brand.email}`} className="text-link">MỘT CHÚT VỀ CHÚNG MÌNH <ArrowUpRight size={15}/></a></div><div className="manifesto-note">LESS NEW.<br/>MORE YOU.<span>TB. / 2026</span></div></section>
      <section className="newsletter"><div><p className="eyebrow light">THE GOOD STUFF, OCCASIONALLY</p><h2>Đồ đẹp.<br/><em>Tin vui.</em></h2><p>Nhận thông báo mỗi khi có món mới lên kệ.<br/>Không spam, chỉ có đồ xinh.</p></div><form className="newsletter-form" onSubmit={subscribe}><label htmlFor="email">EMAIL CỦA BẠN</label><div><input id="email" type="email" required placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/><button aria-label="Đăng ký nhận tin">{subscribed?<Check size={20}/>:<ArrowRight size={20}/>}</button></div><small>{subscribed?'Đăng ký thành công — hẹn gặp bạn trong inbox!':'Bằng việc đăng ký, bạn đồng ý nhận email từ chúng mình.'}</small></form><span className="newsletter-spark">✳</span></section>
    </main>
    <footer className="footer"><div className="footer-main"><div className="footer-brand"><a className="wordmark footer-mark" href="#top"><span className="mark">TB<span>.</span></span><span className="brandname">THANH BUI <i>2HAND</i></span></a><p>Đồ 2hand độ mới cao.<br/>Mặc theo cách của bạn.</p><a className="social-link" href={brand.facebook} target="_blank" rel="noreferrer">FACEBOOK <ArrowUpRight size={14}/></a><a className="social-link" href={brand.instagram} target="_blank" rel="noreferrer">INSTAGRAM <ArrowUpRight size={14}/></a></div><div className="footer-col"><b>KHÁM PHÁ</b><a href="#new-in">New In</a><a href="#shop">Shop tất cả</a><a href="#collections">Collections</a><a href="#story">Journal</a></div><div className="footer-col"><b>HỖ TRỢ</b><a href={brand.shippingPolicy}>Chính sách giao hàng</a><a href={brand.returnsPolicy}>Đổi trả & hoàn tiền</a><a href="mailto:quy.bt2006@gmail.com">Liên hệ</a></div><div className="footer-col footer-contact"><b>LIÊN HỆ</b><a href={`mailto:${brand.email}`}>{brand.email}</a><span>Hồ Chí Minh, Việt Nam</span><span>Trả lời trong vòng 24h</span></div><div className="footer-seal">SECOND<br/>HAND<br/><i>FIRST<br/>CHOICE.</i></div></div><div className="footer-bottom"><span>© 2026 {brand.name}. Made to be worn again.</span><a href="#top">BACK TO TOP ↑</a></div></footer>
    {drawer&&<><button className="scrim" aria-label="Đóng giỏ hàng" onClick={()=>setDrawer(false)}/><aside className="cart-drawer" aria-label="Giỏ hàng"><div className="drawer-head"><div><p className="eyebrow">YOUR SELECTION</p><h2>Giỏ hàng <span>({cartCount})</span></h2></div><button className="icon-button" aria-label="Đóng giỏ hàng" onClick={()=>setDrawer(false)}><X size={20}/></button></div>{cart.length===0?<div className="cart-empty"><ShoppingBag size={30}/><p>Giỏ hàng đang trống.</p><button className="text-link" onClick={()=>{setDrawer(false);jump('shop')}}>KHÁM PHÁ SẢN PHẨM <ArrowRight size={15}/></button></div>:<><div className="cart-items">{cart.map(line=><div className="cart-line" key={line.product.id}><img src={line.product.image} alt={line.product.alt}/><div className="cart-line-info"><b>{line.product.name}</b><span>{line.product.color} · {line.product.size}</span><strong>{money(line.product.price)}</strong></div><button className="remove" onClick={()=>setCart(c=>c.filter(x=>x.product.id!==line.product.id))}>Xóa</button></div>)}</div><div className="cart-total"><p><span>Tạm tính</span><strong>{money(total)}</strong></p><small>Phí giao hàng được tính khi xác nhận đơn.</small>{brand.checkoutUrl?<a className="button button-dark full" href={brand.checkoutUrl}>TIẾN HÀNH THANH TOÁN <ArrowRight size={16}/></a>:<a className="button button-dark full" href={brand.messengerUrl} target="_blank" rel="noreferrer" onClick={prepareFacebookOrder}>ĐẶT HÀNG QUA FACEBOOK <ArrowRight size={16}/></a>}<button className="continue" onClick={()=>setDrawer(false)}>TIẾP TỤC MUA SẮM</button></div></>}</aside></>}
    {selected&&<><button className="scrim modal-scrim" onClick={()=>setSelected(null)} aria-label="Đóng chi tiết sản phẩm"/><div className="product-modal" role="dialog" aria-modal="true" aria-label={`Chi tiết ${selected.name}`}><button className="modal-close icon-button" onClick={()=>setSelected(null)} aria-label="Đóng"><X size={20}/></button><div className="modal-gallery">{selected.images.map((src,i)=><img key={src} src={src} alt={`${selected.alt}, góc ảnh ${i+1}`} loading="lazy"/>)}</div><div className="modal-info"><button className="back-link" onClick={()=>setSelected(null)}><ArrowLeft size={15}/> QUAY LẠI CỬA HÀNG</button><p className="eyebrow">{selected.categoryLabel} · {selected.condition}</p><h2>{selected.name}</h2><strong className="modal-price">{money(selected.price)}</strong><p>{selected.description}</p><dl><div><dt>CHẤT LIỆU</dt><dd>{selected.material}</dd></div><div><dt>MÀU SẮC</dt><dd>{selected.color}</dd></div><div><dt>KÍCH CỠ</dt><dd>{selected.size}</dd></div><div><dt>TÌNH TRẠNG</dt><dd>{selected.condition}</dd></div></dl><button className="button button-dark full" onClick={()=>{add(selected);setSelected(null);setDrawer(true)}}>THÊM VÀO GIỎ <Plus size={16}/></button><small className="one-off">✳ Mỗi sản phẩm vintage là độc bản.</small></div></div></>}
    {notice&&<div className="toast"><Check size={16}/>{notice}</div>}
    <button className="to-top" aria-label="Về đầu trang" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}><ArrowDown size={16}/></button>
  </>
}
export default App


