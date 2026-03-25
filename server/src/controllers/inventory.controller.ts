import { Request, Response } from 'express'
import {
  listInventory,
  upsertInventory,
  adjustInventory,
  addInventoryTransaction,
  listInventoryTransactions,
  getInventoryByVariant,
} from '../models/inventory.model'

export const adminListInventory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const [inventory, total] = await listInventory(page, limit)
    const totalPages = Math.ceil(total / limit)
    res.json({ success: true, message: 'Lấy tồn kho thành công', data: inventory, pagination: { total, totalPages, page, limit } })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminSetInventory = async (req: Request, res: Response) => {
  try {
    const variant_id = parseInt(req.params.variantId as string)
    const { quantity, note } = req.body
    if (quantity === undefined || quantity < 0) {
      res.status(400).json({ success: false, message: 'quantity >= 0 là bắt buộc' })
      return
    }

    const current = await getInventoryByVariant(variant_id)
    const currentQty = current?.quantity ?? 0
    const delta = parseInt(quantity) - currentQty

    await upsertInventory(variant_id, parseInt(quantity))
    if (delta !== 0) {
      await addInventoryTransaction({
        variant_id,
        change_quantity: delta,
        transaction_type: delta > 0 ? 'import' : 'adjustment',
        note: note || 'Điều chỉnh tồn kho thủ công',
      })
    }
    res.json({ success: true, message: 'Cập nhật tồn kho thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminAdjustInventory = async (req: Request, res: Response) => {
  try {
    const variant_id = parseInt(req.params.variantId as string)
    const { change_quantity, transaction_type, note } = req.body
    if (!change_quantity || !transaction_type) {
      res.status(400).json({ success: false, message: 'change_quantity và transaction_type là bắt buộc' })
      return
    }
    const delta = parseInt(change_quantity)
    if (delta < 0) {
      const current = await getInventoryByVariant(variant_id)
      const currentQty = current?.quantity ?? 0
      if (currentQty + delta < 0) {
        res.status(400).json({ success: false, message: `Không thể giảm tồn kho xuống âm (hiện tại: ${currentQty})` })
        return
      }
    }
    try {
      await adjustInventory(variant_id, delta)
    } catch (stockError) {
      const msg = stockError instanceof Error ? stockError.message : String(stockError)
      res.status(400).json({ success: false, message: msg })
      return
    }
    await addInventoryTransaction({ variant_id, change_quantity: delta, transaction_type, note })
    res.json({ success: true, message: 'Điều chỉnh tồn kho thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}

export const adminGetInventoryTransactions = async (req: Request, res: Response) => {
  try {
    const variant_id = parseInt(req.params.variantId as string)
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const transactions = await listInventoryTransactions(variant_id, page, limit)
    res.json({ success: true, message: 'Lấy lịch sử tồn kho thành công', data: transactions })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error instanceof Error ? error.message : String(error)] })
  }
}
