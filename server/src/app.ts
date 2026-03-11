import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import router from './routes'
import paymentRouter from './routes/payment.route'

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/v1', router)
app.use('/api/payment', paymentRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
