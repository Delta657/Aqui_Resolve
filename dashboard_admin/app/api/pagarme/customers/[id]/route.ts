import { NextRequest, NextResponse } from 'next/server'
import { pagarmeService } from '@/lib/services/pagarme-service'

/**
 * GET /api/pagarme/customers/:id
 * Busca um cliente por ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const response = await pagarmeService.getCustomer(id)

    if (response.errors) {
      return NextResponse.json(
        {
          success: false,
          errors: response.errors,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: response.data,
    })
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar cliente',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/pagarme/customers/:id
 * Atualiza um cliente
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const response = await pagarmeService.updateCustomer(id, body)

    if (response.errors) {
      return NextResponse.json(
        {
          success: false,
          errors: response.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: response.data,
      message: 'Cliente atualizado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar cliente',
      },
      { status: 500 }
    )
  }
}

