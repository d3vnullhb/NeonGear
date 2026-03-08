import { Request, Response } from 'express'
import { listAttributes, getAttributeById, createAttribute, updateAttribute, deleteAttribute } from '../models/attribute.model'

export const getAttributes = async (_req: Request, res: Response) => {
  try {
    const attributes = await listAttributes()
    res.json({ success: true, message: 'Lấy thuộc tính thành công', data: attributes })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminCreateAttribute = async (req: Request, res: Response) => {
  try {
    const { name, data_type } = req.body
    if (!name) {
      res.status(400).json({ success: false, message: 'name là bắt buộc' })
      return
    }
    const attribute = await createAttribute({ name, data_type })
    res.status(201).json({ success: true, message: 'Tạo thuộc tính thành công', data: attribute })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminUpdateAttribute = async (req: Request, res: Response) => {
  try {
    const attribute_id = parseInt(req.params.id as string)
    const existing = await getAttributeById(attribute_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thuộc tính' })
      return
    }
    const attribute = await updateAttribute(attribute_id, req.body)
    res.json({ success: true, message: 'Cập nhật thuộc tính thành công', data: attribute })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}

export const adminDeleteAttribute = async (req: Request, res: Response) => {
  try {
    const attribute_id = parseInt(req.params.id as string)
    const existing = await getAttributeById(attribute_id)
    if (!existing) {
      res.status(404).json({ success: false, message: 'Không tìm thấy thuộc tính' })
      return
    }
    await deleteAttribute(attribute_id)
    res.json({ success: true, message: 'Xoá thuộc tính thành công' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server', errors: [error] })
  }
}
