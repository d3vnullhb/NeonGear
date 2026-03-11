import multer from 'multer'
import { Request, Response, NextFunction } from 'express'
import cloudinary from '../config/cloudinary'

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Chỉ chấp nhận file ảnh'))
  },
})

export const uploadToCloudinary = (folder: string) => async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next()
  try {
    const url = await streamToCloudinary(req.file.buffer, folder)
    ;(req as any).cloudinaryUrl = url
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload ảnh thất bại', errors: [error] })
  }
}

export const uploadManyToCloudinary = (folder: string) => async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || !(req.files as Express.Multer.File[]).length) return next()
  try {
    const files = req.files as Express.Multer.File[]
    const urls = await Promise.all(files.map((f) => streamToCloudinary(f.buffer, folder)))
    ;(req as any).cloudinaryUrls = urls
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: 'Upload ảnh thất bại', errors: [error] })
  }
}

export const streamToCloudinary = (buffer: Buffer, folder: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err || !result) reject(err)
      else resolve(result.secure_url)
    })
    stream.end(buffer)
  })
