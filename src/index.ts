import { app } from './server.ts'
import { env } from '../env.ts'

// Only listen locally (for development)
if (env.NODE_ENV !== 'production') {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`)
    console.log(`Environment: ${env.NODE_ENV}`)
  })
}

export default app
