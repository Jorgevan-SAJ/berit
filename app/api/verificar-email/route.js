import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const corpo = await request.json()
    const email = (corpo?.email || '').trim().toLowerCase()

    if (!email.includes('@')) {
      return new Response(JSON.stringify({ cadastrado: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    let existe = false
    let pagina = 1
    while (pagina <= 10 && !existe) {
      const { data: usuarios, error } = await supabaseAdmin.auth.admin.listUsers({
        page: pagina,
        perPage: 1000,
      })

      if (error) {
        return new Response(JSON.stringify({ cadastrado: false }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const lista = usuarios?.users ?? []
      existe = lista.some((usuario) => usuario.email && usuario.email.toLowerCase() === email)
      if (lista.length < 1000) break
      pagina++
    }

    return new Response(JSON.stringify({ cadastrado: existe }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (erro) {
    return new Response(JSON.stringify({ cadastrado: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
