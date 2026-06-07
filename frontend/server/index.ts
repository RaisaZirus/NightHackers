import express from 'express'
import cors from 'cors'

const app = express()
const port = process.env.PORT ? Number(process.env.PORT) : 4175

app.use(cors())
app.use(express.json())

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from the Node backend!' })
})

app.listen(port, () => {
  console.log(`Node API running at http://localhost:${port}`)
})
