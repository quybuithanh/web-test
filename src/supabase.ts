import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = url && publishableKey ? createClient(url, publishableKey) : null
export const adminEmail = (import.meta.env.VITE_SUPABASE_ADMIN_EMAIL || 'quy.bt2006@gmail.com').trim().toLowerCase()
